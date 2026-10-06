// The bulk implementation of SCOPE.md 2.3: three requests sent at once, then one fold in memory.
// The requests do not depend on each other, so all three are dispatched before anything is awaited —
// `Promise.all` over three calls already made, not three awaits in a row.

import type { CsvValue } from './csv.ts'
import { csvBytes } from './csv.ts'
import type { Group, User } from './data.ts'
import type { ReportName } from './reports.ts'
import { REPORT_SPECS, WINDOW } from './reports.ts'
import type { Store, UserTotal } from './store.ts'

export async function bulkReport(store: Store, report: ReportName): Promise<Buffer> {
  const spec = REPORT_SPECS[report]

  const groupsRequest = store.find({ collection: 'groups', sort: ['code'] })
  const usersRequest = store.find({ collection: 'users', sort: ['groupId', 'code'] })
  const totalsRequest = store.totalsByUser(spec.collection, WINDOW, spec.sumField)
  const [groupDocs, userDocs, totals] = await Promise.all([
    groupsRequest,
    usersRequest,
    totalsRequest,
  ])
  const groups = groupDocs as Group[]
  const users = userDocs as User[]

  const totalsByUser = new Map<string, UserTotal>(totals.map((total) => [total.userId, total]))
  const membersByGroup = new Map<string, User[]>()
  for (const user of users) {
    const members = membersByGroup.get(user.groupId)
    if (members) members.push(user)
    else membersByGroup.set(user.groupId, [user])
  }

  const rows: CsvValue[][] = []
  for (const group of groups) {
    // Every group appears, even one with no users at all.
    const members = membersByGroup.get(group._id) ?? []
    let groupSum = 0
    let groupCount = 0
    for (const user of members) {
      // The aggregation returns nothing for a user with no event in the window: the fold supplies
      // the zeros, it never skips the row (2.2).
      const total = totalsByUser.get(user._id)
      const sum = total?.sum ?? 0
      const count = total?.count ?? 0
      groupSum += sum
      groupCount += count
      if (spec.rowsPer === 'user') {
        rows.push([group.code, group.name, user.code, user.name, sum, count])
      }
    }
    if (spec.rowsPer === 'group') {
      // `users` is the group's full membership, not the number of users that had events.
      rows.push([group.code, group.name, members.length, groupSum, groupCount])
    }
  }

  return csvBytes(spec.header, rows)
}
