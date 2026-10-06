// The naive implementation of SCOPE.md 2.3: one request for the groups, one per group for its users,
// one per user for that user's events in the window, every request awaited before the next is sent.
// This is the shape that makes the request count grow with the number of users.

import type { CsvValue } from './csv.ts'
import { csvBytes } from './csv.ts'
import type { Group, User } from './data.ts'
import type { ReportName } from './reports.ts'
import { REPORT_SPECS, WINDOW } from './reports.ts'
import type { Store, StoredDoc } from './store.ts'

function numberField(doc: StoredDoc, key: string): number {
  return Number((doc as unknown as Record<string, unknown>)[key])
}

export async function naiveReport(store: Store, report: ReportName): Promise<Buffer> {
  const spec = REPORT_SPECS[report]
  const rows: CsvValue[][] = []

  const groups = (await store.find({ collection: 'groups', sort: ['code'] })) as Group[]
  for (const group of groups) {
    const users = (await store.find({
      collection: 'users',
      filter: { groupId: group._id },
      sort: ['code'],
    })) as User[]

    let groupSum = 0
    let groupCount = 0
    for (const user of users) {
      const events = await store.find({
        collection: spec.collection,
        filter: { userId: user._id },
        window: WINDOW,
      })
      let sum = 0
      for (const event of events) sum += numberField(event, spec.sumField)
      groupSum += sum
      groupCount += events.length
      if (spec.rowsPer === 'user') {
        rows.push([group.code, group.name, user.code, user.name, sum, events.length])
      }
    }
    if (spec.rowsPer === 'group') {
      rows.push([group.code, group.name, users.length, groupSum, groupCount])
    }
  }

  return csvBytes(spec.header, rows)
}
