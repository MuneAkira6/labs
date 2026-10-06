// The expected-outcome table of SCOPE.md 3.3 and the parser for the `LAB-B` lines of 3.1. Both are
// plain functions over text, so `pnpm test` covers them with no Docker and no container.

export type ArmName = 'fixed-await' | 'global-await' | 'global-noextra' | 'fixed-compose'

export const ARMS: readonly ArmName[] = [
  'fixed-await',
  'global-await',
  'global-noextra',
  'fixed-compose',
]

export type Burst1Expectation =
  | { kind: 'fewerThan'; than: number }
  | { kind: 'exactly'; value: number }

export type Expectation = {
  burst1Ok: Burst1Expectation
  probeAfterBurst1: 'ok' | 'timeout'
  /** Bursts 2 and 3 together, 20 + 20. */
  laterBurstsOk: number
  probesAfterLaterBursts: 'ok' | 'timeout'
  /** After every burst. */
  health: number
}

/**
 * SCOPE.md 3.3, transcribed. `fewerThan` is the contract's "fewer than 8 ok": how many of burst 1's
 * eight requests finish before the pool freezes is racy, so it is compared as `< 8` and reported as
 * measured. Asserting a particular number here would harden a race into a contract.
 */
export const EXPECTED: Record<ArmName, Expectation> = {
  'fixed-await': {
    burst1Ok: { kind: 'fewerThan', than: 8 },
    probeAfterBurst1: 'timeout',
    laterBurstsOk: 0,
    probesAfterLaterBursts: 'timeout',
    health: 200,
  },
  'global-await': {
    burst1Ok: { kind: 'exactly', value: 8 },
    probeAfterBurst1: 'ok',
    laterBurstsOk: 40,
    probesAfterLaterBursts: 'ok',
    health: 200,
  },
  'global-noextra': {
    burst1Ok: { kind: 'fewerThan', than: 8 },
    probeAfterBurst1: 'timeout',
    laterBurstsOk: 0,
    probesAfterLaterBursts: 'timeout',
    health: 200,
  },
  'fixed-compose': {
    burst1Ok: { kind: 'exactly', value: 8 },
    probeAfterBurst1: 'ok',
    laterBurstsOk: 40,
    probesAfterLaterBursts: 'ok',
    health: 200,
  },
}

export const BURST_SIZES: readonly number[] = [8, 20, 20]
export const TOTAL_REQUESTS = 48

export type BurstLine = {
  arm: string
  burst: number
  size: number
  ok: number
  timedOut: number
  failed: number
  probe: string
  health: number
}

export type SummaryLine = {
  arm: string
  total: number
  ok: number
  timedOut: number
  failed: number
}

export type ParsedOutput = {
  bursts: BurstLine[]
  summary: SummaryLine | null
  /** The `LAB-B …` lines as they were read, with any prefix the build tool added removed. */
  raw: string[]
}

const MARKER = 'LAB-B '
const BURST_KEYS = ['arm', 'burst', 'size', 'ok', 'timedOut', 'failed', 'probe', 'health']
const SUMMARY_KEYS = ['arm', 'total', 'ok', 'timedOut', 'failed']

function keysOf(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

/**
 * Reads the `LAB-B` lines out of a container's stdout. sbt prefixes the program's output with
 * `[info] `, so the marker is found anywhere in the line rather than at its start. A line that holds
 * the marker but cannot be read exactly is an error that names it.
 */
export function parseLabB(stdout: string): ParsedOutput {
  const bursts: BurstLine[] = []
  const raw: string[] = []
  let summary: SummaryLine | null = null

  for (const line of stdout.split(/\r?\n/)) {
    const at = line.indexOf(MARKER)
    if (at < 0) continue
    const payload = line.slice(at + MARKER.length).trim()
    raw.push(`${MARKER}${payload}`)
    let parsed: unknown
    try {
      parsed = JSON.parse(payload)
    } catch (error: unknown) {
      throw new Error(`lab B: a LAB-B line is not JSON: ${payload} (${String(error)})`)
    }
    if (parsed === null || typeof parsed !== 'object') {
      throw new Error(`lab B: a LAB-B line is not a JSON object: ${payload}`)
    }
    const record = parsed as Record<string, unknown>
    if ('burst' in record) {
      const expected = [...BURST_KEYS].sort().join(',')
      if (keysOf(record).join(',') !== expected) {
        throw new Error(
          `lab B: a burst line has the keys ${keysOf(record).join(',')}, not ${expected}: ${payload}`,
        )
      }
      bursts.push(record as unknown as BurstLine)
    } else if ('total' in record) {
      const expected = [...SUMMARY_KEYS].sort().join(',')
      if (keysOf(record).join(',') !== expected) {
        throw new Error(
          `lab B: the summary line has the keys ${keysOf(record).join(',')}, not ${expected}: ${payload}`,
        )
      }
      summary = record as unknown as SummaryLine
    } else {
      throw new Error(`lab B: a LAB-B line is neither a burst nor a summary: ${payload}`)
    }
  }

  return { bursts, summary, raw }
}

function describeBurst1(expectation: Burst1Expectation): string {
  return expectation.kind === 'fewerThan'
    ? `fewer than ${expectation.than} ok`
    : `${expectation.value} ok`
}

/**
 * Compares one arm's output with the row of 3.3, returning one message per difference. An empty
 * array means the arm behaved as the contract says.
 */
export function compareWithExpected(
  arm: ArmName,
  parsed: ParsedOutput,
  expected: Record<ArmName, Expectation> = EXPECTED,
): string[] {
  const bad: string[] = []
  const row = expected[arm]

  if (parsed.bursts.length !== BURST_SIZES.length) {
    bad.push(`${arm}: ${parsed.bursts.length} burst line(s), expected ${BURST_SIZES.length}`)
    return bad
  }

  for (let i = 0; i < parsed.bursts.length; i++) {
    const burst = parsed.bursts[i]
    if (burst.arm !== arm) bad.push(`${arm}: burst ${i + 1} names the arm ${burst.arm}`)
    if (burst.burst !== i + 1) bad.push(`${arm}: burst ${i + 1} is numbered ${burst.burst}`)
    if (burst.size !== BURST_SIZES[i]) {
      bad.push(`${arm}: burst ${i + 1} has size ${burst.size}, expected ${BURST_SIZES[i]}`)
    }
    if (burst.ok + burst.timedOut + burst.failed !== burst.size) {
      bad.push(
        `${arm}: burst ${i + 1} adds up to ${burst.ok + burst.timedOut + burst.failed}, not its size ${burst.size}`,
      )
    }
    if (burst.health !== row.health) {
      bad.push(`${arm}: health after burst ${i + 1} was ${burst.health}, expected ${row.health}`)
    }
  }

  const burst1 = parsed.bursts[0]
  if (row.burst1Ok.kind === 'fewerThan') {
    if (!(burst1.ok < row.burst1Ok.than)) {
      bad.push(`${arm}: burst 1 had ${burst1.ok} ok, expected ${describeBurst1(row.burst1Ok)}`)
    }
  } else if (burst1.ok !== row.burst1Ok.value) {
    bad.push(`${arm}: burst 1 had ${burst1.ok} ok, expected ${describeBurst1(row.burst1Ok)}`)
  }
  if (burst1.probe !== row.probeAfterBurst1) {
    bad.push(
      `${arm}: the probe after burst 1 was ${burst1.probe}, expected ${row.probeAfterBurst1}`,
    )
  }

  const laterOk = parsed.bursts[1].ok + parsed.bursts[2].ok
  if (laterOk !== row.laterBurstsOk) {
    bad.push(`${arm}: bursts 2 and 3 had ${laterOk} ok together, expected ${row.laterBurstsOk}`)
  }
  for (const i of [1, 2]) {
    if (parsed.bursts[i].probe !== row.probesAfterLaterBursts) {
      bad.push(
        `${arm}: the probe after burst ${i + 1} was ${parsed.bursts[i].probe}, expected ${row.probesAfterLaterBursts}`,
      )
    }
  }

  const summary = parsed.summary
  if (summary === null) {
    bad.push(`${arm}: no summary line`)
    return bad
  }
  if (summary.arm !== arm) bad.push(`${arm}: the summary names the arm ${summary.arm}`)
  if (summary.total !== TOTAL_REQUESTS) {
    bad.push(`${arm}: the summary total is ${summary.total}, expected ${TOTAL_REQUESTS}`)
  }
  const sum = (pick: (burst: BurstLine) => number): number =>
    parsed.bursts.reduce((total, burst) => total + pick(burst), 0)
  for (const [name, fromSummary, fromBursts] of [
    ['ok', summary.ok, sum((b) => b.ok)],
    ['timedOut', summary.timedOut, sum((b) => b.timedOut)],
    ['failed', summary.failed, sum((b) => b.failed)],
  ] as const) {
    if (fromSummary !== fromBursts) {
      bad.push(
        `${arm}: the summary says ${name} ${fromSummary}, the bursts add up to ${fromBursts}`,
      )
    }
  }
  if (summary.ok + summary.timedOut + summary.failed !== TOTAL_REQUESTS) {
    bad.push(
      `${arm}: the summary adds up to ${summary.ok + summary.timedOut + summary.failed}, not ${TOTAL_REQUESTS}`,
    )
  }

  return bad
}
