// The result files of SCOPE.md 1.4, shared by the three runners: the machine block, the median and
// range rules, and the two file names. Nothing here needs a lab, so `pnpm test` covers it directly.

import { cpus, release, totalmem, type } from 'node:os'
import { run } from './common.ts'

export type MachineBlock = {
  /** UTC, ISO 8601. */
  date: string
  /** `os.type()` and `os.release()`. */
  os: string
  arch: string
  /** The model of `os.cpus()[0]` and the count. */
  cpu: string
  /** `os.totalmem()`, one decimal. */
  memoryGiB: number
  node: string
  /** The Docker client version, only when the lab uses Docker. */
  docker?: string
  /** `git rev-parse --short HEAD`, plus `+dirty` when `git status --porcelain` is not empty. */
  commit: string
}

export function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/** `<UTC date>-<platform>-<arch>.json` and the same name with `.md` (SCOPE.md 1.4). */
export function resultFileNames(
  now: Date,
  platform: string,
  arch: string,
): { json: string; md: string } {
  const stem = `${utcDate(now)}-${platform}-${arch}`
  return { json: `${stem}.json`, md: `${stem}.md` }
}

export async function gitCommit(): Promise<string> {
  const head = await run('git', ['rev-parse', '--short', 'HEAD'])
  const porcelain = await run('git', ['status', '--porcelain'])
  const commit = head.stdout.trim()
  return porcelain.stdout.trim().length > 0 ? `${commit}+dirty` : commit
}

export async function dockerClientVersion(): Promise<string> {
  const result = await run('docker', ['version', '--format', '{{.Client.Version}}'])
  return result.stdout.trim()
}

export async function machineBlock(options: { now: Date; docker?: string }): Promise<MachineBlock> {
  const processors = cpus()
  const block: MachineBlock = {
    date: options.now.toISOString(),
    os: `${type()} ${release()}`,
    arch: process.arch,
    cpu: `${processors[0]?.model ?? 'unknown'} x ${processors.length}`,
    memoryGiB: Number((totalmem() / 1024 ** 3).toFixed(1)),
    node: process.version,
    commit: await gitCommit(),
  }
  if (options.docker !== undefined) block.docker = options.docker
  return block
}

/** The median of 1.4: for an even count, the mean of the middle two. Not rounded. */
export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('median: no values')
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function minMax(values: readonly number[]): { min: number; max: number } {
  if (values.length === 0) throw new Error('minMax: no values')
  return { min: Math.min(...values), max: Math.max(...values) }
}

/** The table's form: whole milliseconds (1.4). The JSON keeps the raw values. */
export function roundMs(value: number): number {
  return Math.round(value)
}

export function machineBlockMarkdown(block: MachineBlock): string {
  const lines = [
    `- date: ${block.date}`,
    `- os: ${block.os}`,
    `- arch: ${block.arch}`,
    `- cpu: ${block.cpu}`,
    `- memoryGiB: ${block.memoryGiB}`,
    `- node: ${block.node}`,
  ]
  if (block.docker !== undefined) lines.push(`- docker: ${block.docker}`)
  lines.push(`- commit: ${block.commit}`)
  return lines.join('\n')
}
