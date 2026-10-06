// Seeding one size into MongoDB (SCOPE.md 2.1): the database is dropped first, the four collections
// are written in the generator's order, the three indexes are created, and the counts the generator
// reports are returned so the runner can print them.

import type { Db } from 'mongodb'
import type { ChargeEvent, Counts, Group, Size, UsageEvent, User } from './data.ts'
import { countsOf, generate } from './data.ts'

export async function seed(db: Db, size: Size): Promise<Counts> {
  const data = generate(size)
  await db.dropDatabase()

  await db.collection<Group>('groups').insertMany(data.groups.map((g) => ({ ...g })))
  await db.collection<User>('users').insertMany(data.users.map((u) => ({ ...u })))
  await db
    .collection<UsageEvent>('usage_events')
    .insertMany(data.usage_events.map((e) => ({ ...e })))
  await db
    .collection<ChargeEvent>('charge_events')
    .insertMany(data.charge_events.map((e) => ({ ...e })))

  await db.collection('users').createIndex({ groupId: 1, code: 1 })
  await db.collection('usage_events').createIndex({ userId: 1, at: 1 })
  await db.collection('charge_events').createIndex({ userId: 1, at: 1 })

  return countsOf(data)
}
