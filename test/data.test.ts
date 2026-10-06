import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import type { Dataset, Size } from '../lab-a/src/data.ts'
import {
  canonicalDump,
  countsOf,
  GROUP_NAME_CYCLE,
  generate,
  SEED,
  WINDOW_FROM,
  WINDOW_TO,
  xorshift32,
} from '../lab-a/src/data.ts'

function firstValues(count: number, seed: number): number[] {
  const next = xorshift32(seed)
  return Array.from({ length: count }, () => next())
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function boundaryCount(events: { userId: string; at: Date }[], userId: string, at: Date): number {
  return events.filter((e) => e.userId === userId && e.at.getTime() === at.getTime()).length
}

describe('xorshift32 (SCOPE.md 2.1)', () => {
  it('gives the five values the contract names for the seed 20261005', () => {
    expect(SEED).toBe(20261005)
    expect(firstValues(5, SEED)).toEqual([549423487, 3817879383, 1244534954, 2925042391, 491171478])
  })

  it('control: a seed one off the contract does not give the contract first value', () => {
    expect(firstValues(1, SEED + 1)[0]).not.toBe(549423487)
  })
})

describe('the generator (SCOPE.md 2.1)', () => {
  const sizes: Size[] = ['S', 'L']
  const data: Record<Size, Dataset> = { S: generate('S'), L: generate('L') }

  it('writes the documents per collection the run measured (facts F16)', () => {
    expect(countsOf(data.S)).toEqual({
      groups: 4,
      users: 20,
      usage_events: 487,
      charge_events: 78,
    })
    expect(countsOf(data.L)).toEqual({
      groups: 40,
      users: 1000,
      usage_events: 24546,
      charge_events: 3460,
    })
  })

  it('names the groups by the cycle of 2.1, with the group number appended', () => {
    expect(GROUP_NAME_CYCLE).toEqual(['営業部', '開発部', 'サポート, 第一', '企画"室"', '経理'])
    expect(data.S.groups.map((g) => g.code)).toEqual(['G001', 'G002', 'G003', 'G004'])
    expect(data.S.groups.map((g) => g.name)).toEqual([
      '営業部1',
      '開発部2',
      'サポート, 第一3',
      '企画"室"4',
    ])
    expect(data.L.groups[4]).toEqual({ _id: 'G005', code: 'G005', name: '経理5' })
  })

  it('codes the users in group order then user order and names them 利用者 + the number', () => {
    expect(data.S.users[0]).toEqual({
      _id: 'U0001',
      code: 'U0001',
      name: '利用者1',
      groupId: 'G001',
    })
    expect(data.S.users[19]).toEqual({
      _id: 'U0020',
      code: 'U0020',
      name: '利用者20',
      groupId: 'G004',
    })
    expect(data.L.users.at(-1)?.code).toBe('U1000')
  })

  it('gives every user the four boundary events of 2.1, two per collection', () => {
    for (const size of sizes) {
      const d = data[size]
      for (const user of d.users) {
        expect(boundaryCount(d.usage_events, user._id, WINDOW_FROM)).toBe(1)
        expect(boundaryCount(d.usage_events, user._id, WINDOW_TO)).toBe(1)
        expect(boundaryCount(d.charge_events, user._id, WINDOW_FROM)).toBe(1)
        expect(boundaryCount(d.charge_events, user._id, WINDOW_TO)).toBe(1)
      }
      expect(
        d.usage_events
          .filter((e) => e.at.getTime() === WINDOW_FROM.getTime())
          .every((e) => e.pages === 7),
      ).toBe(true)
      expect(
        d.charge_events
          .filter((e) => e.at.getTime() === WINDOW_TO.getTime())
          .every((e) => e.amount === 990),
      ).toBe(true)
    }
  })

  it('is deterministic: two generations of the same size give the same canonical dump', () => {
    for (const size of sizes) {
      expect(sha256(canonicalDump(generate(size)))).toBe(sha256(canonicalDump(generate(size))))
    }
  })

  it('control: the two sizes do not give the same canonical dump', () => {
    expect(sha256(canonicalDump(generate('S')))).not.toBe(sha256(canonicalDump(generate('L'))))
  })
})
