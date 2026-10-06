// The deterministic generator of SCOPE.md 2.1. It owns the only copy of the xorshift32 recurrence in
// this repository: the tests pin the contract's five values against this function, never against a
// local copy of the arithmetic.

export type Size = 'S' | 'L'

export type Group = { _id: string; code: string; name: string }
export type User = { _id: string; code: string; name: string; groupId: string }
export type UsageEvent = { userId: string; at: Date; pages: number }
export type ChargeEvent = { userId: string; at: Date; amount: number }

export type Dataset = {
  groups: Group[]
  users: User[]
  usage_events: UsageEvent[]
  charge_events: ChargeEvent[]
}

export type Counts = {
  groups: number
  users: number
  usage_events: number
  charge_events: number
}

/** The seed of SCOPE.md 2.1. */
export const SEED = 20261005

/** The window of SCOPE.md 2.2: WINDOW_FROM <= at < WINDOW_TO. */
export const WINDOW_FROM = new Date('2026-09-01T00:00:00.000Z')
export const WINDOW_TO = new Date('2026-10-01T00:00:00.000Z')

export const SIZES: Record<Size, { groups: number; usersPerGroup: number }> = {
  S: { groups: 4, usersPerGroup: 5 },
  L: { groups: 40, usersPerGroup: 25 },
}

/** The names of SCOPE.md 2.1; the third carries a comma and the fourth a quote, on purpose. */
export const GROUP_NAME_CYCLE = ['営業部', '開発部', 'サポート, 第一', '企画"室"', '経理']

/** September 2026, the month the window covers: 30 days. */
const SEPTEMBER_2026_DAYS = 30

/**
 * xorshift32 as SCOPE.md 2.1 writes it: `x ^= x << 13; x ^= x >>> 17; x ^= x << 5`, unsigned 32-bit.
 * Each call advances the state and returns it.
 */
export function xorshift32(seed: number): () => number {
  let x = seed >>> 0
  return () => {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
    return x
  }
}

export function databaseName(size: Size): string {
  return `labs_a_${size}`
}

function groupCode(n: number): string {
  return `G${String(n).padStart(3, '0')}`
}

function userCode(n: number): string {
  return `U${String(n).padStart(4, '0')}`
}

function septemberAt(day: number, hourUtc: number, plusMinutes: number): Date {
  return new Date(Date.UTC(2026, 8, day, hourUtc, plusMinutes, 0, 0))
}

/**
 * The dataset of SCOPE.md 2.1, drawn in the order that section describes: groups, then users, then
 * usage_events (every user over all 30 days of September 2026), then charge_events, then the boundary
 * events, which consume no randomness. `_id` is the document's own code, so two generations of the
 * same size are identical document for document.
 */
export function generate(size: Size): Dataset {
  const shape = SIZES[size]
  const next = xorshift32(SEED)

  const groups: Group[] = []
  for (let g = 1; g <= shape.groups; g++) {
    const name = `${GROUP_NAME_CYCLE[(g - 1) % GROUP_NAME_CYCLE.length]}${g}`
    groups.push({ _id: groupCode(g), code: groupCode(g), name })
  }

  const users: User[] = []
  let userNumber = 0
  for (const group of groups) {
    for (let u = 0; u < shape.usersPerGroup; u++) {
      userNumber++
      users.push({
        _id: userCode(userNumber),
        code: userCode(userNumber),
        name: `利用者${userNumber}`,
        groupId: group._id,
      })
    }
  }

  const usage_events: UsageEvent[] = []
  for (const user of users) {
    for (let day = 1; day <= SEPTEMBER_2026_DAYS; day++) {
      const n = next() % 4
      // The minute draw belongs to the event, so it happens only when there is an event (2.1).
      if (n > 0) {
        usage_events.push({ userId: user._id, at: septemberAt(day, 9, next() % 480), pages: n })
      }
    }
  }

  const charge_events: ChargeEvent[] = []
  for (const user of users) {
    const k = next() % 4
    for (let i = 0; i < k; i++) {
      const amount = ((next() % 50) + 1) * 10
      charge_events.push({ userId: user._id, at: septemberAt((next() % 30) + 1, 12, 0), amount })
    }
  }

  // The boundary events of 2.1: one inside the window, one outside, for every user, both collections.
  for (const user of users) {
    usage_events.push({ userId: user._id, at: new Date(WINDOW_FROM), pages: 7 })
    usage_events.push({ userId: user._id, at: new Date(WINDOW_TO), pages: 7 })
  }
  for (const user of users) {
    charge_events.push({ userId: user._id, at: new Date(WINDOW_FROM), amount: 990 })
    charge_events.push({ userId: user._id, at: new Date(WINDOW_TO), amount: 990 })
  }

  return { groups, users, usage_events, charge_events }
}

/** What the generator reports it wrote (SCOPE.md 2.1). */
export function countsOf(data: Dataset): Counts {
  return {
    groups: data.groups.length,
    users: data.users.length,
    usage_events: data.usage_events.length,
    charge_events: data.charge_events.length,
  }
}

/**
 * A canonical, stable text of the whole dataset: one JSON line per document, collections in a fixed
 * order, keys in a fixed order, dates as ISO 8601. Used to prove two generations are identical.
 */
export function canonicalDump(data: Dataset): string {
  const lines: string[] = []
  for (const g of data.groups) lines.push(`groups ${JSON.stringify([g._id, g.code, g.name])}`)
  for (const u of data.users) {
    lines.push(`users ${JSON.stringify([u._id, u.code, u.name, u.groupId])}`)
  }
  for (const e of data.usage_events) {
    lines.push(`usage_events ${JSON.stringify([e.userId, e.at.toISOString(), e.pages])}`)
  }
  for (const e of data.charge_events) {
    lines.push(`charge_events ${JSON.stringify([e.userId, e.at.toISOString(), e.amount])}`)
  }
  return `${lines.join('\n')}\n`
}
