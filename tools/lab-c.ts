// The lab C runner (SCOPE.md 4.1 to 4.4).
//
//   pnpm lab:c [--modules N] [--runs N]      defaults: 1000 modules, 5 runs
//
// Exit codes of the command table of SCOPE.md 1: 0 every build ran and the equivalence holds, 1
// otherwise, 2 usage. Lab C uses no Docker, so its machine block omits the `docker` field (1.4).
// The result tables go to stdout, the progress to stderr.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { generateApp } from '../lab-c/generate.ts'
import { out, portIsFree, progress, REPO_ROOT, run } from './common.ts'
import type { Tool } from './lab-c-equivalence.ts'
import { equivalenceViolations, firstScriptSrc, missingLabels } from './lab-c-equivalence.ts'
import type { MachineBlock } from './results.ts'
import {
  machineBlock,
  machineBlockMarkdown,
  median,
  minMax,
  resultFileNames,
  roundMs,
} from './results.ts'

const LAB_C_DIR = join(REPO_ROOT, 'lab-c')
const APP_DIR = join(LAB_C_DIR, 'app')
const RESULTS_DIR = join(LAB_C_DIR, 'results')
const BABEL_CACHE = join(APP_DIR, 'node_modules', '.cache')
const WARMUPS = 1
const READY_LIMIT_MS = 120_000
const POLL_MS = 50

const TOOLS: readonly Tool[] = ['webpack', 'rsbuild']

const SETUPS: Record<Tool, { dist: string; devPort: number; build: string[]; dev: string[] }> = {
  webpack: {
    dist: join(APP_DIR, 'dist-webpack'),
    devPort: 18461,
    build: ['lab-c/build-webpack.ts'],
    dev: ['lab-c/dev-webpack.ts'],
  },
  rsbuild: {
    dist: join(APP_DIR, 'dist-rsbuild'),
    devPort: 18462,
    build: [
      'node_modules/@rsbuild/core/bin/rsbuild.js',
      'build',
      '--config',
      'lab-c/rsbuild.config.ts',
    ],
    dev: [
      'node_modules/@rsbuild/core/bin/rsbuild.js',
      'dev',
      '--config',
      'lab-c/rsbuild.config.ts',
    ],
  },
}

const USAGE = 'usage: node tools/lab-c.ts [--modules N] [--runs N]'

class LabError extends Error {
  exitCode: 1 | 2
  constructor(exitCode: 1 | 2, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

type Options = { modules: number; runs: number }

type BuildTiming = {
  tool: Tool
  warmupMs: number
  runsMs: number[]
  medianMs: number
  minMs: number
  maxMs: number
}

type DevStart = { ms: number; scriptSrc: string; portFreeAfterStop: boolean }

type DevTiming = {
  tool: Tool
  port: number
  warmupMs: number
  runsMs: number[]
  medianMs: number
  minMs: number
  maxMs: number
  scriptSrc: string
  startsWithPortFreedAfterStop: number
  starts: number
}

type Equivalence = {
  tool: Tool
  modules: number
  labelsFound: number
  mountsOnRoot: boolean
  firstScriptSrc: string | null
  assets: string[]
  violations: string[]
}

function parseOptions(argv: readonly string[]): Options {
  const options: Options = { modules: 1000, runs: 5 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--modules' || arg === '--runs') {
      const value = Number(argv[++i])
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new LabError(2, `${USAGE}\n${arg} takes a whole number of at least 1`)
      }
      if (arg === '--modules') options.modules = value
      else options.runs = value
    } else {
      throw new LabError(2, `${USAGE}\nunknown argument: ${arg}`)
    }
  }
  return options
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

/** A path written into a committed file: repository-relative, with `/` on every OS. */
function committedPath(absolute: string): string {
  return relative(REPO_ROOT, absolute).split(sep).join('/')
}

function emittedFiles(dist: string): string[] {
  if (!existsSync(dist)) return []
  return readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
}

/** Before every build: the tool's output directory and the Babel cache, if either exists (4.3). */
function removeBeforeBuild(tool: Tool): void {
  rmSync(SETUPS[tool].dist, { recursive: true, force: true, maxRetries: 10 })
  rmSync(BABEL_CACHE, { recursive: true, force: true, maxRetries: 10 })
}

/** One cold production build: wall time of `process.execPath <script or CLI>`, spawn to exit (4.3). */
async function timeOneBuild(tool: Tool): Promise<number> {
  removeBeforeBuild(tool)
  const started = performance.now()
  const result = await run(process.execPath, SETUPS[tool].build)
  const ms = performance.now() - started
  if (result.code !== 0) {
    throw new LabError(
      1,
      `${tool}: the production build exited ${result.code}\n${result.stderr.trim()}`,
    )
  }
  return ms
}

/**
 * Ready when `GET /` answers 200 with `id="root"` in the body and the first `<script src>` of that
 * page also answers 200 — both, not either (4.3). Tried every 50 ms, 120 s limit. A page that cannot
 * be read is retried while there is time and then reported by name, never waved through.
 */
async function waitUntilReady(
  port: number,
  spawnedAt: number,
): Promise<{ ms: number; scriptSrc: string }> {
  let last = 'GET / never answered'
  while (performance.now() - spawnedAt < READY_LIMIT_MS) {
    try {
      const page = await fetch(`http://127.0.0.1:${port}/`)
      if (page.status !== 200) {
        last = `GET / answered ${page.status}`
      } else {
        const html = await page.text()
        if (!html.includes('id="root"')) {
          last = 'GET / answered 200 but the body does not hold id="root"'
        } else {
          const src = firstScriptSrc(html)
          if (src === null) {
            last = 'GET / answered 200 with id="root" but the page has no script with a src'
          } else {
            const script = await fetch(new URL(src, `http://127.0.0.1:${port}/`))
            if (script.status !== 200) {
              last = `the first script ${src} answered ${script.status}`
            } else {
              return { ms: performance.now() - spawnedAt, scriptSrc: src }
            }
          }
        }
      }
    } catch (error: unknown) {
      last = `the request failed: ${String(error)}`
    }
    await sleep(POLL_MS)
  }
  throw new LabError(
    1,
    `${port}: the dev server was not ready within ${READY_LIMIT_MS} ms; the last thing observed was: ${last}`,
  )
}

async function waitUntilPortFree(port: number, limitMs = 30_000): Promise<boolean> {
  const started = performance.now()
  while (performance.now() - started < limitMs) {
    if (await portIsFree(port)) return true
    await sleep(POLL_MS)
  }
  return false
}

/** One dev-server start, timed from spawn to ready, then stopped and its port waited free (4.3). */
async function timeOneDevStart(tool: Tool): Promise<DevStart> {
  const setup = SETUPS[tool]
  const spawnedAt = performance.now()
  const child = spawn(process.execPath, setup.dev, { cwd: REPO_ROOT })
  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk)
  })
  child.stdout.on('data', () => {})
  const exited = new Promise<void>((done) => child.on('close', () => done()))
  try {
    const ready = await waitUntilReady(setup.devPort, spawnedAt)
    return { ...ready, portFreeAfterStop: false }
  } catch (error: unknown) {
    if (stderr.trim().length > 0) progress(`${tool} dev stderr: ${stderr.trim()}`)
    throw error
  } finally {
    child.kill('SIGTERM')
    const stopped = await Promise.race([exited.then(() => true), sleep(10_000).then(() => false)])
    if (!stopped) {
      child.kill('SIGKILL')
      await exited
    }
  }
}

async function devTimings(tool: Tool, options: Options): Promise<DevTiming> {
  const setup = SETUPS[tool]
  const freed: boolean[] = []
  let scriptSrc = ''

  const once = async (): Promise<number> => {
    const start = await timeOneDevStart(tool)
    scriptSrc = start.scriptSrc
    const free = await waitUntilPortFree(setup.devPort)
    freed.push(free)
    if (!free) {
      throw new LabError(
        1,
        `${tool}: 127.0.0.1:${setup.devPort} was still taken 30 s after the dev server was stopped`,
      )
    }
    return start.ms
  }

  const warmupMs = await once()
  progress(`dev ${tool}: warm-up ${roundMs(warmupMs)} ms discarded`)
  const runsMs: number[] = []
  for (let i = 0; i < options.runs; i++) runsMs.push(await once())
  const { min, max } = minMax(runsMs)
  return {
    tool,
    port: setup.devPort,
    warmupMs,
    runsMs,
    medianMs: median(runsMs),
    minMs: min,
    maxMs: max,
    scriptSrc,
    startsWithPortFreedAfterStop: freed.filter(Boolean).length,
    starts: freed.length,
  }
}

function checkEquivalence(tool: Tool, modules: number): Equivalence {
  const dist = SETUPS[tool].dist
  const files = emittedFiles(dist)
  const assets = files.map((file) => relative(dist, file).split(sep).join('/'))
  const js = files
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const htmlFile = files.find((file) => file.endsWith('.html'))
  const html = htmlFile === undefined ? '' : readFileSync(htmlFile, 'utf8')
  const violations = equivalenceViolations({ tool, js, html, assets }, modules)
  const labelsFound = modules - missingLabels(js, modules).length
  return {
    tool,
    modules,
    labelsFound,
    mountsOnRoot: violations.every((v) => !v.includes('mount the application on root')),
    firstScriptSrc: firstScriptSrc(html),
    assets,
    violations,
  }
}

function resultMarkdown(
  machine: MachineBlock,
  options: Options,
  builds: readonly BuildTiming[],
  devs: readonly DevTiming[],
  equivalences: readonly Equivalence[],
): string {
  const row = (t: BuildTiming | DevTiming): string =>
    `| ${t.tool} | ${roundMs(t.medianMs)} | ${roundMs(t.minMs)}–${roundMs(t.maxMs)} |`
  return [
    '# Lab C — build migration',
    '',
    '## Machine',
    '',
    machineBlockMarkdown(machine),
    '',
    `Lab C uses no Docker, so the machine block omits the \`docker\` field (SCOPE.md 1.4).`,
    '',
    `${options.modules} generated modules. ${WARMUPS} warm-up per tool and measurement, discarded, then` +
      ` ${options.runs} measured runs. Medians and ranges are whole milliseconds; every raw run is in the` +
      ` JSON beside its discarded warm-up. No claim is made beyond this machine and these runs, and` +
      ` neither tool was tuned beyond SCOPE.md 4.2.`,
    '',
    '## Cold production build',
    '',
    'The output directory and `lab-c/app/node_modules/.cache` are removed before every build. A build is' +
      ' timed as the wall time of a child process started as `process.execPath <script or CLI>`, from' +
      ' spawn to exit.',
    '',
    '| tool | median ms | range ms |',
    '| --- | --- | --- |',
    ...builds.map(row),
    '',
    '## Dev-server start',
    '',
    'Timed from spawn until `GET /` answers 200 with `id="root"` in the body and the first `<script src>`' +
      ' of that page also answers 200. Tried every 50 ms, 120 s limit. After each start the process is' +
      ' stopped and its port waited free before the next.',
    '',
    '| tool | median ms | range ms |',
    '| --- | --- | --- |',
    ...devs.map(row),
    '',
    ...devs.map(
      (d) =>
        `- ${d.tool} on 127.0.0.1:${d.port}: first script \`${d.scriptSrc}\`; the port was free again` +
        ` after ${d.startsWithPortFreedAfterStop} of ${d.starts} stops.`,
    ),
    '',
    '## Equivalence (SCOPE.md 4.4)',
    '',
    '| tool | labels found | mounts on root | first script | emitted files | differences |',
    '| --- | --- | --- | --- | --- | --- |',
    ...equivalences.map(
      (e) =>
        `| ${e.tool} | ${e.labelsFound} of ${e.modules} | ${e.mountsOnRoot ? 'yes' : 'no'} | ${
          e.firstScriptSrc ?? 'none'
        } | ${e.assets.length} | ${e.violations.length === 0 ? 'none' : e.violations.join('; ')} |`,
    ),
    '',
  ].join('\n')
}

async function main(): Promise<number> {
  const options = parseOptions(process.argv.slice(2))
  progress(`lab C: modules ${options.modules} runs ${options.runs}`)

  const written = generateApp(APP_DIR, options.modules)
  progress(`lab C: generated ${written.length} file(s) under ${committedPath(APP_DIR)}`)

  const builds: BuildTiming[] = []
  const equivalences: Equivalence[] = []
  for (const tool of TOOLS) {
    const warmupMs = await timeOneBuild(tool)
    progress(`build ${tool}: warm-up ${roundMs(warmupMs)} ms discarded`)
    const runsMs: number[] = []
    for (let i = 0; i < options.runs; i++) runsMs.push(await timeOneBuild(tool))
    const { min, max } = minMax(runsMs)
    builds.push({
      tool,
      warmupMs,
      runsMs,
      medianMs: median(runsMs),
      minMs: min,
      maxMs: max,
    })
    progress(
      `build ${tool}: ${options.runs} runs median ${roundMs(median(runsMs))} ms range ${roundMs(
        min,
      )}–${roundMs(max)} ms`,
    )
    // After the last production build of this tool (4.4).
    const equivalence = checkEquivalence(tool, options.modules)
    equivalences.push(equivalence)
    progress(
      `equivalence ${tool}: ${equivalence.labelsFound} of ${options.modules} labels, mounts on root ${
        equivalence.mountsOnRoot
      }, first script ${equivalence.firstScriptSrc ?? 'none'}, ${equivalence.assets.length} emitted file(s)`,
    )
  }

  const devs: DevTiming[] = []
  for (const tool of TOOLS) {
    const timing = await devTimings(tool, options)
    devs.push(timing)
    progress(
      `dev ${tool}: ${options.runs} runs median ${roundMs(timing.medianMs)} ms range ${roundMs(
        timing.minMs,
      )}–${roundMs(timing.maxMs)} ms`,
    )
  }

  const now = new Date()
  // No `docker` argument: lab C uses none, and 1.4 omits the field then.
  const machine = await machineBlock({ now })
  mkdirSync(RESULTS_DIR, { recursive: true })
  const names = resultFileNames(now, process.platform, process.arch)
  const markdown = resultMarkdown(machine, options, builds, devs, equivalences)
  writeFileSync(
    join(RESULTS_DIR, names.json),
    `${JSON.stringify(
      {
        lab: 'c',
        machine,
        modules: options.modules,
        warmups: WARMUPS,
        runs: options.runs,
        appDir: committedPath(APP_DIR),
        builds,
        devStarts: devs,
        equivalence: equivalences,
      },
      null,
      2,
    )}\n`,
  )
  writeFileSync(join(RESULTS_DIR, names.md), markdown)
  out(markdown)
  progress(`lab C: wrote lab-c/results/${names.json} and lab-c/results/${names.md}`)

  const failures = equivalences.flatMap((e) => e.violations)
  if (failures.length > 0) {
    for (const failure of failures) progress(`FAIL ${failure}`)
    progress(`lab C: the equivalence check found ${failures.length} difference(s)`)
    return 1
  }
  progress('lab C: every build ran and the equivalence holds')
  return 0
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
