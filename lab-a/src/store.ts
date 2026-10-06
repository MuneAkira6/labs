// The small store of SCOPE.md 2.3, with an in-memory implementation and a MongoDB one. It exposes
// only what the naive and the bulk implementations need: a find with an equality filter, an optional
// `at` window and a sort, and an aggregation that groups a window's events by `userId`.

import type { Db } from 'mongodb'
import type { ChargeEvent, Dataset, Group, UsageEvent, User } from './data.ts'

export type CollectionName = 'groups' | 'users' | 'usage_events' | 'charge_events'
export type EventCollectionName = 'usage_events' | 'charge_events'

export type TimeWindow = { from: Date; to: Date }
export type SortSpec = readonly string[]

export type FindQuery = {
  collection: CollectionName
  /** Equality only, as SCOPE.md 2.3 allows. */
  filter?: Readonly<Record<string, string>>
  /** `from <= at < to`. */
  window?: TimeWindow
  sort?: SortSpec
}

export type StoredDoc = Group | User | UsageEvent | ChargeEvent
export type UserTotal = { userId: string; sum: number; count: number }

export type Store = {
  find(query: FindQuery): Promise<StoredDoc[]>
  /** `$match` on the window, `$group` by `userId` with the sum of `sumField` and the count. */
  totalsByUser(
    collection: EventCollectionName,
    window: TimeWindow,
    sumField: 'pages' | 'amount',
  ): Promise<UserTotal[]>
}

function fieldOf(doc: StoredDoc, key: string): unknown {
  return (doc as unknown as Record<string, unknown>)[key]
}

function compareBy(sort: SortSpec): (a: StoredDoc, b: StoredDoc) => number {
  return (a, b) => {
    for (const key of sort) {
      const left = fieldOf(a, key)
      const right = fieldOf(b, key)
      const l = left instanceof Date ? left.getTime() : left
      const r = right instanceof Date ? right.getTime() : right
      if (typeof l === 'number' && typeof r === 'number') {
        if (l !== r) return l < r ? -1 : 1
      } else {
        const ls = String(l)
        const rs = String(r)
        if (ls !== rs) return ls < rs ? -1 : 1
      }
    }
    return 0
  }
}

export function memoryStore(data: Dataset): Store {
  const collections: Record<CollectionName, StoredDoc[]> = {
    groups: data.groups,
    users: data.users,
    usage_events: data.usage_events,
    charge_events: data.charge_events,
  }
  return {
    async find(query) {
      let docs = collections[query.collection].slice()
      if (query.filter) {
        for (const [key, value] of Object.entries(query.filter)) {
          docs = docs.filter((doc) => fieldOf(doc, key) === value)
        }
      }
      if (query.window) {
        const { from, to } = query.window
        docs = docs.filter((doc) => {
          const at = fieldOf(doc, 'at')
          return at instanceof Date && at >= from && at < to
        })
      }
      if (query.sort) docs.sort(compareBy(query.sort))
      return docs
    },
    async totalsByUser(collection, window, sumField) {
      const totals = new Map<string, UserTotal>()
      for (const doc of collections[collection]) {
        const at = fieldOf(doc, 'at')
        if (!(at instanceof Date) || at < window.from || at >= window.to) continue
        const userId = String(fieldOf(doc, 'userId'))
        const value = Number(fieldOf(doc, sumField))
        const total = totals.get(userId) ?? { userId, sum: 0, count: 0 }
        total.sum += value
        total.count += 1
        totals.set(userId, total)
      }
      return [...totals.values()]
    },
  }
}

export function mongoStore(db: Db): Store {
  return {
    async find(query) {
      const filter: Record<string, unknown> = { ...(query.filter ?? {}) }
      if (query.window) filter.at = { $gte: query.window.from, $lt: query.window.to }
      const cursor = db.collection(query.collection).find(filter)
      if (query.sort) {
        const sort: Record<string, 1> = {}
        for (const key of query.sort) sort[key] = 1
        cursor.sort(sort)
      }
      return (await cursor.toArray()) as unknown as StoredDoc[]
    },
    async totalsByUser(collection, window, sumField) {
      const rows = await db
        .collection(collection)
        .aggregate([
          { $match: { at: { $gte: window.from, $lt: window.to } } },
          { $group: { _id: '$userId', sum: { $sum: `$${sumField}` }, count: { $sum: 1 } } },
        ])
        .toArray()
      return rows.map((row) => ({
        userId: String(row._id),
        sum: Number(row.sum),
        count: Number(row.count),
      }))
    },
  }
}
