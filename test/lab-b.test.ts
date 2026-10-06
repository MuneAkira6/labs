// Lab B's `LAB-B` line parser and the comparison with the expected-outcome table of SCOPE.md 3.3.
// Both are pure text functions, so this file needs neither Docker nor the network.

import { describe, expect, it } from 'vitest'
import type { ArmName, Expectation } from '../tools/lab-b-outcomes.ts'
import {
  ARMS,
  BURST_SIZES,
  compareWithExpected,
  EXPECTED,
  parseLabB,
  TOTAL_REQUESTS,
} from '../tools/lab-b-outcomes.ts'

/** What a frozen arm prints, the way sbt prints it: the program's lines carry an `[info] ` prefix. */
function frozenOutput(arm: ArmName, burst1Ok = 0): string {
  const burst = (n: number, size: number, ok: number) =>
    `[info] LAB-B {"arm":"${arm}","burst":${n},"size":${size},"ok":${ok},"timedOut":${
      size - ok
    },"failed":0,"probe":"timeout","health":200}`
  return [
    '[info] compiling 1 Scala source to /w/target/scala-3.8.4/classes ...',
    burst(1, 8, burst1Ok),
    burst(2, 20, 0),
    burst(3, 20, 0),
    `[info] LAB-B {"arm":"${arm}","total":48,"ok":${burst1Ok},"timedOut":${
      48 - burst1Ok
    },"failed":0}`,
    '[success] Total time: 36 s',
  ].join('\n')
}

function healthyOutput(arm: ArmName): string {
  const burst = (n: number, size: number) =>
    `[info] LAB-B {"arm":"${arm}","burst":${n},"size":${size},"ok":${size},"timedOut":0,"failed":0,"probe":"ok","health":200}`
  return [
    burst(1, 8),
    burst(2, 20),
    burst(3, 20),
    `[info] LAB-B {"arm":"${arm}","total":48,"ok":48,"timedOut":0,"failed":0}`,
  ].join('\n')
}

describe('the LAB-B line parser (SCOPE.md 3.1)', () => {
  it('finds the lines behind sbt’s [info] prefix and ignores everything else', () => {
    const parsed = parseLabB(frozenOutput('fixed-await'))
    expect(parsed.bursts).toHaveLength(3)
    expect(parsed.raw).toHaveLength(4)
    expect(parsed.raw[0]).toBe(
      'LAB-B {"arm":"fixed-await","burst":1,"size":8,"ok":0,"timedOut":8,"failed":0,"probe":"timeout","health":200}',
    )
    expect(parsed.summary).toEqual({
      arm: 'fixed-await',
      total: 48,
      ok: 0,
      timedOut: 48,
      failed: 0,
    })
  })

  it('reads every key of a burst line', () => {
    const parsed = parseLabB(healthyOutput('global-await'))
    expect(parsed.bursts[0]).toEqual({
      arm: 'global-await',
      burst: 1,
      size: 8,
      ok: 8,
      timedOut: 0,
      failed: 0,
      probe: 'ok',
      health: 200,
    })
    expect(BURST_SIZES).toEqual([8, 20, 20])
    expect(TOTAL_REQUESTS).toBe(48)
  })

  it('finds nothing in output that holds no LAB-B line', () => {
    const parsed = parseLabB('[info] compiling\n[success] Total time: 6 s')
    expect(parsed.bursts).toEqual([])
    expect(parsed.summary).toBeNull()
  })

  it('control: a LAB-B line that is not JSON is an error that names it', () => {
    expect(() => parseLabB('[info] LAB-B {"arm":"fixed-await",')).toThrowError(
      /a LAB-B line is not JSON: \{"arm":"fixed-await",/,
    )
  })

  it('control: a burst line with a missing key is an error that names the keys', () => {
    expect(() =>
      parseLabB(
        '[info] LAB-B {"arm":"fixed-await","burst":1,"size":8,"ok":0,"timedOut":8,"failed":0}',
      ),
    ).toThrowError(/a burst line has the keys arm,burst,failed,ok,size,timedOut, not/)
  })

  it('control: a LAB-B line that is neither a burst nor a summary is an error', () => {
    expect(() => parseLabB('[info] LAB-B {"arm":"fixed-await","note":"hello"}')).toThrowError(
      /neither a burst nor a summary/,
    )
  })
})

describe('the comparison with the expected-outcome table (SCOPE.md 3.3)', () => {
  it('transcribes the four rows of the contract', () => {
    expect([...ARMS]).toEqual(['fixed-await', 'global-await', 'global-noextra', 'fixed-compose'])
    expect(EXPECTED['fixed-await']).toEqual({
      burst1Ok: { kind: 'fewerThan', than: 8 },
      probeAfterBurst1: 'timeout',
      laterBurstsOk: 0,
      probesAfterLaterBursts: 'timeout',
      health: 200,
    })
    expect(EXPECTED['global-noextra']).toEqual(EXPECTED['fixed-await'])
    expect(EXPECTED['global-await']).toEqual({
      burst1Ok: { kind: 'exactly', value: 8 },
      probeAfterBurst1: 'ok',
      laterBurstsOk: 40,
      probesAfterLaterBursts: 'ok',
      health: 200,
    })
    expect(EXPECTED['fixed-compose']).toEqual(EXPECTED['global-await'])
  })

  it('accepts the two frozen arms', () => {
    for (const arm of ['fixed-await', 'global-noextra'] as ArmName[]) {
      expect(compareWithExpected(arm, parseLabB(frozenOutput(arm)))).toEqual([])
    }
  })

  it('accepts the two arms that keep working', () => {
    for (const arm of ['global-await', 'fixed-compose'] as ArmName[]) {
      expect(compareWithExpected(arm, parseLabB(healthyOutput(arm)))).toEqual([])
    }
  })

  it('accepts any burst-1 count below 8 for a frozen arm, since the contract leaves it open', () => {
    for (const ok of [0, 1, 2, 7]) {
      expect(
        compareWithExpected('fixed-await', parseLabB(frozenOutput('fixed-await', ok))),
      ).toEqual([])
    }
  })

  it('control: a frozen arm whose burst 1 reaches 8 ok fails the comparison', () => {
    const parsed = parseLabB(frozenOutput('fixed-await', 8))
    expect(compareWithExpected('fixed-await', parsed)).toContain(
      'fixed-await: burst 1 had 8 ok, expected fewer than 8 ok',
    )
  })

  it('control: a frozen arm that answers its later bursts fails the comparison', () => {
    const parsed = parseLabB(healthyOutput('fixed-await'))
    expect(compareWithExpected('fixed-await', parsed)).toEqual([
      'fixed-await: burst 1 had 8 ok, expected fewer than 8 ok',
      'fixed-await: the probe after burst 1 was ok, expected timeout',
      'fixed-await: bursts 2 and 3 had 40 ok together, expected 0',
      'fixed-await: the probe after burst 2 was ok, expected timeout',
      'fixed-await: the probe after burst 3 was ok, expected timeout',
    ])
  })

  it('control: a working arm that freezes fails the comparison', () => {
    const parsed = parseLabB(frozenOutput('global-await'))
    const differences = compareWithExpected('global-await', parsed)
    expect(differences).toContain('global-await: burst 1 had 0 ok, expected 8 ok')
    expect(differences).toContain('global-await: bursts 2 and 3 had 0 ok together, expected 40')
    expect(differences).toContain('global-await: the probe after burst 1 was timeout, expected ok')
  })

  it('control: health other than 200 after a burst fails the comparison', () => {
    const output = frozenOutput('fixed-await').replace('"health":200}', '"health":0}')
    expect(compareWithExpected('fixed-await', parseLabB(output))).toContain(
      'fixed-await: health after burst 1 was 0, expected 200',
    )
  })

  it('control: a burst whose counts do not add up to its size fails the comparison', () => {
    const output = frozenOutput('fixed-await').replace('"timedOut":8', '"timedOut":7')
    expect(compareWithExpected('fixed-await', parseLabB(output))).toContain(
      'fixed-await: burst 1 adds up to 7, not its size 8',
    )
  })

  it('control: a flipped expected table fails an arm that is in fact correct', () => {
    // This is what AC-34 plants in a scratch copy: the table says the arm should freeze.
    const flipped: Record<ArmName, Expectation> = {
      ...EXPECTED,
      'global-await': EXPECTED['fixed-await'],
    }
    const parsed = parseLabB(healthyOutput('global-await'))
    expect(compareWithExpected('global-await', parsed, EXPECTED)).toEqual([])
    expect(compareWithExpected('global-await', parsed, flipped)).toContain(
      'global-await: burst 1 had 8 ok, expected fewer than 8 ok',
    )
  })

  it('control: a missing summary line fails the comparison', () => {
    const output = frozenOutput('fixed-await')
      .split('\n')
      .filter((line) => !line.includes('"total"'))
      .join('\n')
    expect(compareWithExpected('fixed-await', parseLabB(output))).toContain(
      'fixed-await: no summary line',
    )
  })

  it('control: too few burst lines fails the comparison', () => {
    const output = frozenOutput('fixed-await')
      .split('\n')
      .filter((line) => !line.includes('"burst":3'))
      .join('\n')
    expect(compareWithExpected('fixed-await', parseLabB(output))).toEqual([
      'fixed-await: 2 burst line(s), expected 3',
    ])
  })
})
