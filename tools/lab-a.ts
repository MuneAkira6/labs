// The lab A runner (SCOPE.md 2.6 and 2.7).
//
//   pnpm lab:a        [--size S|L|both] [--runs N] [--keep]
//   pnpm lab:a:golden [--size S|L|both]            (node tools/lab-a.ts --golden)
//
// Exit codes, as the command table of SCOPE.md 1 fixes them: 0 every check holds, 1 a check failed,
// 2 usage (or, for --golden, goldens that already exist), 3 the environment is missing.
// The result table goes to stdout, the progress to stderr (SCOPE.md 1, "Commands").

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MongoClient } from 'mongodb'
import { bulkReport } from '../lab-a/src/bulk.ts'
import type { ExpectedCounts, RequestCounter } from '../lab-a/src/counting.ts'
import { countRequests, requestViolations } from '../lab-a/src/counting.ts'
import type { Size } from '../lab-a/src/data.ts'
import { databaseName, SIZES } from '../lab-a/src/data.ts'
import { naiveReport } from '../lab-a/src/naive.ts'
import type { ReportName } from '../lab-a/src/reports.ts'
import { REPORTS } from '../lab-a/src/reports.ts'
import { seed } from '../lab-a/src/seed.ts'
import type { Store } from '../lab-a/src/store.ts'
import { mongoStore } from '../lab-a/src/store.ts'
import { out, portIsFree, progress, REPO_ROOT, repoPath, run, sha256 } from './common.ts'
import type { MachineBlock } from './results.ts'
import {
  dockerClientVersion,
  machineBlock,
  machineBlockMarkdown,
  median,
  minMax,
  resultFileNames,
  roundMs,
} from './results.ts'

const MONGO_PORT = 18460
const COMPOSE_PROJECT = 'labs-a'
const COMPOSE_FILE = 'lab-a/compose.yaml'
const GOLDENS_DIR = join(REPO_ROOT, 'lab-a', 'goldens')
const RESULTS_DIR = join(REPO_ROOT, 'lab-a', 'results')
const URI = `mongodb://127.0.0.1:${MONGO_PORT}/?directConnection=true`
const WARMUPS = 1

const USAGE = 'usage: node tools/lab-a.ts [--golden] [--size S|L|both] [--runs N] [--keep]'

class LabError extends Error {
  exitCode: 1 | 2 | 3
  constructor(exitCode: 1 | 2 | 3, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

type Implementation = 'naive' | 'bulk'
const IMPLEMENTATIONS: readonly Implementation[] = ['naive', 'bulk']
const EXPORTERS: Record<Implementation, (store: Store, report: ReportName) => Promise<Buffer>> = {
  naive: naiveReport,
  bulk: bulkReport,
}

type Options = { golden: boolean; sizes: Size[]; runs: number; keep: boolean }

type EqualityRecord = {
  size: Size
  report: ReportName
  implementation: Implementation
  sha256: string
  goldenSha256: string
  bytesEqual: boolean
}

type RequestRecord = {
  size: Size
  report: ReportName
  implementation: Implementation
  listed: Record<string, number>
  requests: Record<string, number>
  expected: ExpectedCounts
}

type TimingRecord = {
  size: Size
  report: ReportName
  implementation: Implementation
  warmupMs: number
  runsMs: number[]
  medianMs: number
  minMs: number
  maxMs: number
}

function parseOptions(argv: readonly string[]): Options {
  const options: Options = { golden: false, sizes: ['S', 'L'], runs: 3, keep: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--golden') {
      options.golden = true
    } else if (arg === '--keep') {
      options.keep = true
    } else if (arg === '--size') {
      const value = argv[++i]
      if (value === 'S') options.sizes = ['S']
      else if (value === 'L') options.sizes = ['L']
      else if (value === 'both') options.sizes = ['S', 'L']
      else throw new LabError(2, `${USAGE}\n--size takes S, L or both, not ${String(value)}`)
    } else if (arg === '--runs') {
      const value = Number(argv[++i])
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new LabError(2, `${USAGE}\n--runs takes a whole number of at least 1`)
      }
      options.runs = value
    } else {
      throw new LabError(2, `${USAGE}\nunknown argument: ${arg}`)
    }
  }
  return options
}

/** The naive request count of 2.4: 1 for the groups, 1 per group, 1 per user. */
function expectedNaiveFinds(size: Size): number {
  const shape = SIZES[size]
  return 1 + shape.groups + shape.groups * shape.usersPerGroup
}

/**
 * The expected counts of 2.4. Bulk's `getMore` is left out on purpose: the contract measures and
 * reports it, and does not assert it.
 */
function expectedCounts(implementation: Implementation, size: Size): ExpectedCounts {
  return implementation === 'naive'
    ? { find: expectedNaiveFinds(size), aggregate: 0, getMore: 0 }
    : { find: 2, aggregate: 1 }
}

function goldenPath(size: Size, report: ReportName): string {
  return join(GOLDENS_DIR, size, `${report}.csv`)
}

function goldensHoldAFile(): string[] {
  if (!existsSync(GOLDENS_DIR)) return []
  return readdirSync(GOLDENS_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => repoPath(join(entry.parentPath, entry.name)))
    .sort()
}

async function requireEnvironment(): Promise<void> {
  const docker = await run('docker', ['version', '--format', '{{.Server.Version}}']).catch(
    (error: unknown) => {
      throw new LabError(3, `docker is not usable: ${String(error)}`)
    },
  )
  if (docker.code !== 0) {
    throw new LabError(3, `docker version exited ${docker.code}: ${docker.stderr.trim()}`)
  }
  if (!(await portIsFree(MONGO_PORT))) {
    throw new LabError(
      3,
      `127.0.0.1:${MONGO_PORT} is already taken, so lab A cannot start its database`,
    )
  }
}

async function composeUp(): Promise<void> {
  progress(`lab A: docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} up -d --wait`)
  const result = await run('docker', [
    'compose',
    '-p',
    COMPOSE_PROJECT,
    '-f',
    COMPOSE_FILE,
    'up',
    '-d',
    '--wait',
  ])
  if (result.code !== 0) {
    throw new LabError(3, `compose up exited ${result.code}: ${result.stderr.trim()}`)
  }
  progress(result.stderr.trim())
}

async function composeDown(): Promise<void> {
  progress(`lab A: docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} down -v`)
  const result = await run('docker', [
    'compose',
    '-p',
    COMPOSE_PROJECT,
    '-f',
    COMPOSE_FILE,
    'down',
    '-v',
  ])
  if (result.code !== 0) progress(`compose down exited ${result.code}: ${result.stderr.trim()}`)
  else progress(result.stderr.trim())
}

/**
 * One export on a fresh client with `monitorCommands: true`, serving that export alone (2.4). The
 * whole `listed` tally is reported, not only the counted requests, so a command that happens to sit
 * on the non-request allow-list cannot pass unseen (facts F17).
 */
async function exportWithCounting(
  size: Size,
  report: ReportName,
  implementation: Implementation,
): Promise<{ record: RequestRecord; violations: string[] }> {
  const client = new MongoClient(URI, { monitorCommands: true })
  const counter: RequestCounter = countRequests(client)
  try {
    await client.connect()
    const label = `${size}/${report} ${implementation}`
    if (counter.total() !== 0) {
      throw new LabError(
        1,
        `${label}: the request count was ${counter.total()} when the export started, not 0`,
      )
    }
    progress(`  ${label}: requests at the start of the export: ${counter.total()}`)
    const expected = expectedCounts(implementation, size)
    await EXPORTERS[implementation](mongoStore(client.db(databaseName(size))), report)
    const violations = requestViolations(counter, expected, label)
    const record: RequestRecord = {
      size,
      report,
      implementation,
      listed: { ...counter.listed },
      requests: { ...counter.requests },
      expected,
    }
    progress(
      `requests ${label}: listed ${JSON.stringify(record.listed)} counted ${JSON.stringify(
        record.requests,
      )} expected ${JSON.stringify(expected)}`,
    )
    return { record, violations }
  } finally {
    await client.close()
  }
}

/** Wall time from the first request to the CSV bytes being complete in memory (2.5). */
async function timeOneExport(
  store: Store,
  report: ReportName,
  implementation: Implementation,
): Promise<number> {
  const started = performance.now()
  await EXPORTERS[implementation](store, report)
  return performance.now() - started
}

function timingsMarkdown(
  timings: readonly TimingRecord[],
  requests: readonly RequestRecord[],
): string {
  const sizes = [...new Set(timings.map((t) => t.size))]
  const blocks: string[] = []
  for (const size of sizes) {
    const rows = timings.filter((t) => t.size === size)
    const lines = [
      `### Size ${size}`,
      '',
      '| report | implementation | median ms | range ms | find | aggregate | getMore |',
      '| --- | --- | --- | --- | --- | --- | --- |',
    ]
    for (const row of rows) {
      const counted = requests.find(
        (r) =>
          r.size === size && r.report === row.report && r.implementation === row.implementation,
      )
      const counts = counted?.requests ?? {}
      lines.push(
        `| ${row.report} | ${row.implementation} | ${roundMs(row.medianMs)} | ${roundMs(
          row.minMs,
        )}–${roundMs(row.maxMs)} | ${counts.find ?? 0} | ${counts.aggregate ?? 0} | ${
          counts.getMore ?? 0
        } |`,
      )
    }
    blocks.push(lines.join('\n'))
  }
  return blocks.join('\n\n')
}

function resultMarkdown(
  machine: MachineBlock,
  options: Options,
  equality: readonly EqualityRecord[],
  requests: readonly RequestRecord[],
  timings: readonly TimingRecord[],
): string {
  return [
    '# Lab A — report N+1',
    '',
    '## Machine',
    '',
    machineBlockMarkdown(machine),
    '',
    '## Timings',
    '',
    `${WARMUPS} warm-up export per report and implementation, discarded, then ${options.runs} measured runs. ` +
      'An export is timed from its first request to the CSV bytes being complete in memory; connecting ' +
      'and writing the file are outside it. Medians and ranges are whole milliseconds. Timed runs use a ' +
      'client without command monitoring. No claim is made beyond this machine and these runs.',
    '',
    timingsMarkdown(timings, requests),
    '',
    '## Byte equality with the goldens',
    '',
    '| size | report | implementation | sha256 | golden sha256 | bytes |',
    '| --- | --- | --- | --- | --- | --- |',
    ...equality.map(
      (e) =>
        `| ${e.size} | ${e.report} | ${e.implementation} | ${e.sha256.slice(0, 16)} | ${e.goldenSha256.slice(
          0,
          16,
        )} | ${e.bytesEqual ? 'equal' : 'DIFFERENT'} |`,
    ),
    '',
  ].join('\n')
}

function writeResults(
  machine: MachineBlock,
  options: Options,
  equality: readonly EqualityRecord[],
  requests: readonly RequestRecord[],
  timings: readonly TimingRecord[],
  now: Date,
): { json: string; md: string } {
  mkdirSync(RESULTS_DIR, { recursive: true })
  const names = resultFileNames(now, process.platform, process.arch)
  const markdown = resultMarkdown(machine, options, equality, requests, timings)
  const payload = {
    lab: 'a',
    machine,
    sizes: options.sizes,
    warmups: WARMUPS,
    runs: options.runs,
    equality,
    requests,
    timings,
  }
  writeFileSync(join(RESULTS_DIR, names.json), `${JSON.stringify(payload, null, 2)}\n`)
  writeFileSync(join(RESULTS_DIR, names.md), markdown)
  out(markdown)
  progress(`lab A: wrote lab-a/results/${names.json} and lab-a/results/${names.md}`)
  return names
}

async function captureGoldens(options: Options): Promise<number> {
  const existing = goldensHoldAFile()
  if (existing.length > 0) {
    throw new LabError(
      2,
      `lab-a/goldens already holds ${existing.length} file(s), the first being ${existing[0]}; ` +
        'the goldens are captured once and never written again (SCOPE.md 2.6)',
    )
  }

  await requireEnvironment()
  await composeUp()
  const client = new MongoClient(URI)
  const captured = new Map<string, Buffer>()
  let differences = 0
  try {
    await client.connect()
    for (const size of options.sizes) {
      const db = client.db(databaseName(size))
      const counts = await seed(db, size)
      out(`seeded ${databaseName(size)}: ${JSON.stringify(counts)}`)
      const store = mongoStore(db)
      for (const report of REPORTS) {
        const first = await naiveReport(store, report)
        const second = await naiveReport(store, report)
        const same = first.equals(second)
        out(
          `A/A ${size}/${report}: run 1 sha256 ${sha256(first)} run 2 sha256 ${sha256(second)} -> ${
            same ? 'identical' : 'DIFFERENT'
          }`,
        )
        if (!same) differences++
        else captured.set(`${size}/${report}`, first)
      }
    }
  } finally {
    await client.close()
    if (!options.keep) await composeDown()
  }

  if (differences > 0) {
    out(`A/A check failed on ${differences} report(s); no golden written`)
    return 1
  }

  const lines: string[] = []
  for (const [key, bytes] of captured) {
    const [size, report] = key.split('/') as [Size, ReportName]
    const path = goldenPath(size, report)
    mkdirSync(join(GOLDENS_DIR, size), { recursive: true })
    writeFileSync(path, bytes)
    lines.push(`${sha256(bytes)}  ${repoPath(path)}`)
  }
  lines.sort((a, b) => (a.slice(66) < b.slice(66) ? -1 : 1))
  writeFileSync(join(GOLDENS_DIR, 'SHA256SUMS'), `${lines.join('\n')}\n`)
  out(`wrote ${captured.size} golden(s) and lab-a/goldens/SHA256SUMS`)
  return 0
}

async function runLab(options: Options): Promise<number> {
  await requireEnvironment()
  const docker = await dockerClientVersion()
  await composeUp()

  const failures: string[] = []
  const equality: EqualityRecord[] = []
  const requests: RequestRecord[] = []
  const timings: TimingRecord[] = []
  // One client without command monitoring, for seeding, the equality checks and every timed run
  // (2.4, last line).
  const client = new MongoClient(URI)
  try {
    await client.connect()
    for (const size of options.sizes) {
      const db = client.db(databaseName(size))
      const counts = await seed(db, size)
      progress(`seeded ${databaseName(size)}: ${JSON.stringify(counts)}`)
      const store = mongoStore(db)

      for (const implementation of IMPLEMENTATIONS) {
        for (const report of REPORTS) {
          const bytes = await EXPORTERS[implementation](store, report)
          const path = goldenPath(size, report)
          if (!existsSync(path)) {
            failures.push(`${size}/${report}: the golden ${repoPath(path)} does not exist`)
            continue
          }
          const golden = readFileSync(path)
          const record: EqualityRecord = {
            size,
            report,
            implementation,
            sha256: sha256(bytes),
            goldenSha256: sha256(golden),
            bytesEqual: bytes.equals(golden),
          }
          equality.push(record)
          progress(
            `${implementation} ${size}/${report}: sha256 ${record.sha256} golden ${
              record.goldenSha256
            } bytes ${record.bytesEqual ? 'equal' : 'DIFFERENT'}`,
          )
          if (!record.bytesEqual || record.sha256 !== record.goldenSha256) {
            failures.push(
              `${size}/${report}: the ${implementation} output does not match its golden`,
            )
          }
        }
      }

      for (const implementation of IMPLEMENTATIONS) {
        for (const report of REPORTS) {
          const counted = await exportWithCounting(size, report, implementation)
          requests.push(counted.record)
          failures.push(...counted.violations)
        }
      }

      for (const implementation of IMPLEMENTATIONS) {
        for (const report of REPORTS) {
          const warmupMs = await timeOneExport(store, report, implementation)
          const runsMs: number[] = []
          for (let i = 0; i < options.runs; i++) {
            runsMs.push(await timeOneExport(store, report, implementation))
          }
          const { min, max } = minMax(runsMs)
          timings.push({
            size,
            report,
            implementation,
            warmupMs,
            runsMs,
            medianMs: median(runsMs),
            minMs: min,
            maxMs: max,
          })
          progress(
            `timing ${size}/${report} ${implementation}: warm-up ${roundMs(warmupMs)} ms discarded, ` +
              `${options.runs} runs median ${roundMs(median(runsMs))} ms range ${roundMs(min)}–${roundMs(
                max,
              )} ms`,
          )
        }
      }
    }
  } finally {
    await client.close()
    if (!options.keep) await composeDown()
  }

  if (failures.length > 0) {
    for (const failure of failures) progress(`FAIL ${failure}`)
    progress(`lab A: ${failures.length} check(s) failed; no result file written`)
    return 1
  }

  const now = new Date()
  const machine = await machineBlock({ now, docker })
  writeResults(machine, options, equality, requests, timings, now)
  progress('lab A: every check of this run held')
  return 0
}

async function main(): Promise<number> {
  const options = parseOptions(process.argv.slice(2))
  progress(
    `lab A: sizes ${options.sizes.join(',')} runs ${options.runs}${options.golden ? ' --golden' : ''}`,
  )
  return options.golden ? await captureGoldens(options) : await runLab(options)
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    if (error instanceof LabError) {
      process.stderr.write(`${error.message}\n`)
      process.exit(error.exitCode)
    }
    process.stderr.write(`${String(error)}\n`)
    process.exit(1)
  })
