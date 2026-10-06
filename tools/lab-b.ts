// The lab B runner (SCOPE.md 3.2 and 3.3).
//
//   pnpm lab:b [--arm <name>]…      all four arms unless named
//
// Exit codes of the command table of SCOPE.md 1: 0 every arm as expected, 1 an arm differs, 2 usage,
// 3 the environment is missing. The result table goes to stdout, the progress to stderr.
//
// Each arm gets its own container and its own JVM, because a frozen pool never recovers (facts F7),
// and the sources are copied inside the container so that root cannot write into the repository
// (facts F3).

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { out, progress, REPO_ROOT, repoPath, run } from './common.ts'
import type { ArmName, BurstLine, ParsedOutput, SummaryLine } from './lab-b-outcomes.ts'
import {
  ARMS,
  BURST_SIZES,
  compareWithExpected,
  EXPECTED,
  parseLabB,
  TOTAL_REQUESTS,
} from './lab-b-outcomes.ts'
import type { MachineBlock } from './results.ts'
import {
  dockerClientVersion,
  machineBlock,
  machineBlockMarkdown,
  resultFileNames,
} from './results.ts'

const SBT_IMAGE =
  'sbtscala/scala-sbt@sha256:eafe9c4c5934377cdf98e4ac6fe4f4b5d7e7dea6377fc9bc423a66c20adbdca0'
const LAB_B_DIR = join(REPO_ROOT, 'lab-b')
const RESULTS_DIR = join(LAB_B_DIR, 'results')
const CONTAINER_SECONDS = 300

const USAGE = `usage: node tools/lab-b.ts [--arm <name>]…   (names: ${ARMS.join(', ')})`

class LabError extends Error {
  exitCode: 1 | 2 | 3
  constructor(exitCode: 1 | 2 | 3, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

type ArmRun = {
  arm: ArmName
  container: string
  /** The command as run, with the host side of the mount made repository-relative (SCOPE.md 7). */
  argv: string[]
  exitCode: number
  seconds: number
  bursts: BurstLine[]
  summary: SummaryLine | null
  raw: string[]
  differences: string[]
}

function parseArms(argv: readonly string[]): ArmName[] {
  const chosen: ArmName[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--arm') throw new LabError(2, `${USAGE}\nunknown argument: ${argv[i]}`)
    const value = argv[++i]
    if (!ARMS.includes(value as ArmName)) {
      throw new LabError(2, `${USAGE}\nunknown arm: ${String(value)}`)
    }
    chosen.push(value as ArmName)
  }
  return chosen.length > 0 ? chosen : [...ARMS]
}

/**
 * `global-noextra` is the same program and the same code as `global-await`; it differs only by these
 * three JVM options, passed through `set javaOptions` before `run` (SCOPE.md 3.1 and 3.2).
 */
function sbtScript(arm: ArmName): string {
  const settings =
    arm === 'global-noextra'
      ? ' "set javaOptions ++= Seq(\\"-Dscala.concurrent.context.numThreads=3\\",' +
        ' \\"-Dscala.concurrent.context.maxThreads=3\\",' +
        ' \\"-Dscala.concurrent.context.maxExtraThreads=0\\")"'
      : ''
  return `cp -r /src /w && cd /w && sbt -Dsbt.offline=true${settings} "run ${arm}"`
}

function dockerArgv(arm: ArmName, mount: string): string[] {
  // Arguments as an array, never a shell string; the inner `bash -c` script is one argument.
  return [
    'run',
    '--rm',
    '--name',
    `labs-b-${arm}`,
    '--network',
    'none',
    '-v',
    `${mount}:/src:ro`,
    SBT_IMAGE,
    'bash',
    '-c',
    sbtScript(arm),
  ]
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
  const image = await run('docker', ['image', 'inspect', SBT_IMAGE, '--format', '{{.Id}}'])
  if (image.code !== 0) {
    throw new LabError(
      3,
      `the sbt image is not on this machine by digest and the run never pulls one: ${SBT_IMAGE}`,
    )
  }
  progress(`lab B: sbt image ${image.stdout.trim()}`)
}

async function runArm(arm: ArmName): Promise<ArmRun> {
  // Docker needs the absolute host path; the result files must not carry one from under a home
  // directory, so what gets recorded names the repository instead (SCOPE.md 7).
  const argv = dockerArgv(arm, LAB_B_DIR)
  const recordedArgv = ['docker', ...dockerArgv(arm, `<repository>/${repoPath(LAB_B_DIR)}`)]
  progress(`lab B: docker ${argv.join(' ')}`)
  const started = Date.now()
  const result = await run('docker', argv, { timeoutMs: CONTAINER_SECONDS * 1000 })
  const seconds = Math.round((Date.now() - started) / 1000)
  if (result.timedOut) {
    // The docker client was killed; make sure the container cannot outlive it.
    await run('docker', ['rm', '-f', `labs-b-${arm}`])
    throw new LabError(1, `${arm}: the container exceeded ${CONTAINER_SECONDS} s and was removed`)
  }
  let parsed: ParsedOutput
  try {
    parsed = parseLabB(result.stdout)
  } catch (error: unknown) {
    throw new LabError(1, `${arm}: ${String(error)}`)
  }
  const differences =
    result.code === 0
      ? compareWithExpected(arm, parsed)
      : [`${arm}: the container exited ${result.code}`, ...compareWithExpected(arm, parsed)]
  for (const line of parsed.raw) progress(`  ${line}`)
  progress(
    `lab B: ${arm} ran in ${seconds} s, container exit ${result.code}, ${
      differences.length === 0 ? 'as SCOPE.md 3.3 expects' : `${differences.length} difference(s)`
    }`,
  )
  return {
    arm,
    container: `labs-b-${arm}`,
    argv: recordedArgv,
    exitCode: result.code,
    seconds,
    bursts: parsed.bursts,
    summary: parsed.summary,
    raw: parsed.raw,
    differences,
  }
}

function armMarkdown(armRun: ArmRun): string {
  const row = EXPECTED[armRun.arm]
  const expectedBurst1 =
    row.burst1Ok.kind === 'fewerThan'
      ? `fewer than ${row.burst1Ok.than} ok`
      : `${row.burst1Ok.value} ok`
  const lines = [
    `### ${armRun.arm}`,
    '',
    `Container \`${armRun.container}\`, \`--network none\`, its own JVM; ${armRun.seconds} s, exit ${armRun.exitCode}.`,
    '',
    '| burst | size | ok | timedOut | failed | probe | health |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...armRun.bursts.map(
      (b) =>
        `| ${b.burst} | ${b.size} | ${b.ok} | ${b.timedOut} | ${b.failed} | ${b.probe} | ${b.health} |`,
    ),
    '',
    `Summary: total ${armRun.summary?.total ?? 0}, ok ${armRun.summary?.ok ?? 0}, timedOut ${
      armRun.summary?.timedOut ?? 0
    }, failed ${armRun.summary?.failed ?? 0}.`,
    '',
    `Expected by SCOPE.md 3.3: burst 1 ${expectedBurst1}, probe after burst 1 ${row.probeAfterBurst1}, ` +
      `bursts 2 and 3 ${row.laterBurstsOk} ok, probes after them ${row.probesAfterLaterBursts}, ` +
      `health ${row.health} after every burst.`,
    '',
    // What was observed, in values rather than a verdict word, so the file says what happened and a
    // reader never has to take "as expected" on trust.
    `Observed: burst 1 ${armRun.bursts[0]?.ok ?? 0} ok, bursts 2 and 3 ${
      (armRun.bursts[1]?.ok ?? 0) + (armRun.bursts[2]?.ok ?? 0)
    } ok together, probes ${armRun.bursts.map((b) => b.probe).join(', ')}, health ${armRun.bursts
      .map((b) => b.health)
      .join(', ')}. Differences from the row above: ${
      armRun.differences.length === 0 ? 'none' : armRun.differences.join('; ')
    }.`,
    '',
    'Raw lines:',
    '',
    '```',
    ...armRun.raw,
    '```',
  ]
  return lines.join('\n')
}

function resultMarkdown(machine: MachineBlock, runs: readonly ArmRun[]): string {
  return [
    '# Lab B — blocking await',
    '',
    '## Machine',
    '',
    machineBlockMarkdown(machine),
    '',
    '## Arms',
    '',
    `Each arm ran in its own container and its own JVM, with \`--network none\` and the sources copied` +
      ` inside the container. Bursts of ${BURST_SIZES.join(', ')} requests, released together by a latch,` +
      ` 5 s per request, one second between bursts, then one probe \`GET /work\` and one \`GET /health\`` +
      ` after each burst. ${TOTAL_REQUESTS} requests per arm in all. Lab B measures outcomes, not time:` +
      ` the seconds given per arm are the container's wall time and are not a benchmark.`,
    '',
    ...runs.map(armMarkdown),
    '',
  ].join('\n')
}

function writeResults(machine: MachineBlock, runs: readonly ArmRun[], now: Date): void {
  mkdirSync(RESULTS_DIR, { recursive: true })
  const names = resultFileNames(now, process.platform, process.arch)
  const markdown = resultMarkdown(machine, runs)
  const payload = {
    lab: 'b',
    machine,
    burstSizes: BURST_SIZES,
    totalRequests: TOTAL_REQUESTS,
    expected: EXPECTED,
    arms: runs,
  }
  writeFileSync(join(RESULTS_DIR, names.json), `${JSON.stringify(payload, null, 2)}\n`)
  writeFileSync(join(RESULTS_DIR, names.md), markdown)
  out(markdown)
  progress(`lab B: wrote lab-b/results/${names.json} and lab-b/results/${names.md}`)
}

async function main(): Promise<number> {
  const arms = parseArms(process.argv.slice(2))
  progress(`lab B: arms ${arms.join(',')}`)
  await requireEnvironment()
  const docker = await dockerClientVersion()

  const runs: ArmRun[] = []
  // One arm at a time: never two containers together.
  for (const arm of arms) runs.push(await runArm(arm))

  const differing = runs.filter((armRun) => armRun.differences.length > 0)
  const now = new Date()
  writeResults(await machineBlock({ now, docker }), runs, now)

  if (differing.length > 0) {
    for (const armRun of differing) {
      for (const difference of armRun.differences) progress(`FAIL ${difference}`)
    }
    progress(`lab B: ${differing.length} arm(s) differ from SCOPE.md 3.3`)
    return 1
  }
  progress('lab B: every arm behaved as SCOPE.md 3.3 expects')
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
