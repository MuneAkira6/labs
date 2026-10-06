// AC-4 of G1: the in-memory store and the MongoDB store answer the same find queries and the same
// window aggregation alike, on size S.
//
//   node tools/store-parity.ts            (needs the labs-a database of SCOPE.md 2.8 on 18460)
//
// This check needs Docker, so it is NOT a Vitest file: `pnpm test` must run without a database
// (SCOPE.md 5), and `vitest.config.ts` picks up `test/**/*.test.ts`. It lives in tools/ instead, where
// biome.json and tsconfig.json still cover it. Exit 0 parity, 1 a difference, 3 no database.

import { MongoClient } from 'mongodb'
import { databaseName, generate } from '../lab-a/src/data.ts'
import { naiveReport } from '../lab-a/src/naive.ts'
import { REPORTS, WINDOW } from '../lab-a/src/reports.ts'
import { seed } from '../lab-a/src/seed.ts'
import type { FindQuery, Store, StoredDoc } from '../lab-a/src/store.ts'
import { memoryStore, mongoStore } from '../lab-a/src/store.ts'
import { out, sha256 } from './common.ts'

const URI = 'mongodb://127.0.0.1:18460/?directConnection=true'

/** Drops `_id` where the contract does not fix it (the events) and makes dates comparable. */
function canonical(docs: StoredDoc[]): string {
  return JSON.stringify(
    docs.map((doc) => {
      const record = { ...(doc as unknown as Record<string, unknown>) }
      if ('at' in record) delete record._id
      for (const [key, value] of Object.entries(record)) {
        if (value instanceof Date) record[key] = value.toISOString()
      }
      return Object.keys(record)
        .sort()
        .map((key) => [key, record[key]])
    }),
  )
}

const QUERIES: { label: string; query: FindQuery }[] = [
  { label: 'groups sorted by code', query: { collection: 'groups', sort: ['code'] } },
  {
    label: 'users of G001 sorted by code',
    query: { collection: 'users', filter: { groupId: 'G001' }, sort: ['code'] },
  },
  {
    label: 'all users sorted by groupId, code',
    query: { collection: 'users', sort: ['groupId', 'code'] },
  },
  {
    label: "U0001's usage events in the window",
    query: {
      collection: 'usage_events',
      filter: { userId: 'U0001' },
      window: WINDOW,
      sort: ['at'],
    },
  },
  {
    label: "U0020's charge events in the window",
    query: {
      collection: 'charge_events',
      filter: { userId: 'U0020' },
      window: WINDOW,
      sort: ['at'],
    },
  },
]

async function compare(memory: Store, mongo: Store): Promise<string[]> {
  const differences: string[] = []

  for (const { label, query } of QUERIES) {
    const fromMemory = canonical(await memory.find(query))
    const fromMongo = canonical(await mongo.find(query))
    const same = fromMemory === fromMongo
    out(
      `find ${label}: memory sha256 ${sha256(fromMemory)} mongo sha256 ${sha256(fromMongo)} -> ${
        same ? 'equal' : 'DIFFERENT'
      }`,
    )
    if (!same) differences.push(`find ${label} differs`)
  }

  for (const [collection, field] of [
    ['usage_events', 'pages'],
    ['charge_events', 'amount'],
  ] as const) {
    const sort = (rows: { userId: string; sum: number; count: number }[]) =>
      JSON.stringify(rows.slice().sort((a, b) => (a.userId < b.userId ? -1 : 1)))
    const fromMemory = sort(await memory.totalsByUser(collection, WINDOW, field))
    const fromMongo = sort(await mongo.totalsByUser(collection, WINDOW, field))
    const same = fromMemory === fromMongo
    out(
      `aggregate ${collection} by userId: memory sha256 ${sha256(fromMemory)} mongo sha256 ${sha256(
        fromMongo,
      )} -> ${same ? 'equal' : 'DIFFERENT'}`,
    )
    if (!same) differences.push(`aggregate ${collection} differs`)
  }

  for (const report of REPORTS) {
    const fromMemory = await naiveReport(memory, report)
    const fromMongo = await naiveReport(mongo, report)
    const same = fromMemory.equals(fromMongo)
    out(
      `naive report ${report}: memory sha256 ${sha256(fromMemory)} mongo sha256 ${sha256(
        fromMongo,
      )} -> bytes ${same ? 'equal' : 'DIFFERENT'}`,
    )
    if (!same) differences.push(`report ${report} differs`)
  }

  return differences
}

async function main(): Promise<number> {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5_000 })
  try {
    await client.connect()
  } catch (error: unknown) {
    process.stderr.write(`no database on 127.0.0.1:18460: ${String(error)}\n`)
    return 3
  }
  try {
    const db = client.db(databaseName('S'))
    const counts = await seed(db, 'S')
    out(`seeded ${databaseName('S')}: ${JSON.stringify(counts)}`)
    const differences = await compare(memoryStore(generate('S')), mongoStore(db))
    if (differences.length > 0) {
      for (const difference of differences) out(`FAIL ${difference}`)
      return 1
    }
    out('store parity on size S: the in-memory and the MongoDB stores answered alike everywhere')
    return 0
  } finally {
    await client.close()
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`)
    process.exit(1)
  })
