// The two implementations behind one store (SCOPE.md 2.3) must produce the same bytes. The in-memory
// store makes this a plain unit test: no Docker, no network.

import { describe, expect, it } from 'vitest'
import { bulkReport } from '../lab-a/src/bulk.ts'
import { csvViolations } from '../lab-a/src/csv.ts'
import { generate } from '../lab-a/src/data.ts'
import { naiveReport } from '../lab-a/src/naive.ts'
import { REPORT_SPECS, REPORTS } from '../lab-a/src/reports.ts'
import { memoryStore } from '../lab-a/src/store.ts'

const SIZE_S = generate('S')

describe('naive and bulk on the in-memory store, size S', () => {
  for (const report of REPORTS) {
    it(`gives identical bytes for ${report}`, async () => {
      const store = memoryStore(SIZE_S)
      const naive = await naiveReport(store, report)
      const bulk = await bulkReport(store, report)
      expect(bulk.equals(naive)).toBe(true)
      expect(csvViolations(bulk, REPORT_SPECS[report])).toEqual([])
    })
  }

  it('control: bulk of one report does not equal naive of another', async () => {
    const store = memoryStore(SIZE_S)
    const bulk = await bulkReport(store, 'users-usage')
    const naive = await naiveReport(store, 'users-charge')
    expect(bulk.equals(naive)).toBe(false)
  })

  it('gives a user with no event in the window 0 and 0, and keeps the row', async () => {
    // A group of one user who has no event at all: the aggregation returns nothing for them, so the
    // fold has to supply the zeros rather than drop the row (SCOPE.md 2.2 and 2.3).
    const lonely = {
      groups: [{ _id: 'G001', code: 'G001', name: '営業部1' }],
      users: [{ _id: 'U0001', code: 'U0001', name: '利用者1', groupId: 'G001' }],
      usage_events: [],
      charge_events: [],
    }
    const store = memoryStore(lonely)
    const users = await bulkReport(store, 'users-usage')
    expect(users.subarray(3).toString('utf8')).toBe(
      'group_code,group_name,user_code,user_name,pages,events\r\nG001,営業部1,U0001,利用者1,0,0\r\n',
    )
    const groups = await bulkReport(store, 'groups-usage')
    expect(groups.subarray(3).toString('utf8')).toBe(
      'group_code,group_name,users,pages,events\r\nG001,営業部1,1,0,0\r\n',
    )
    expect((await naiveReport(store, 'users-usage')).equals(users)).toBe(true)
  })

  it("counts a group's full membership in the users column, not only those with events", async () => {
    const data = generate('S')
    // Strip every event of the first group's five users: their rows must stay and users must read 5.
    const firstGroupUsers = new Set(
      data.users.filter((u) => u.groupId === 'G001').map((u) => u._id),
    )
    const stripped = {
      ...data,
      usage_events: data.usage_events.filter((e) => !firstGroupUsers.has(e.userId)),
      charge_events: data.charge_events.filter((e) => !firstGroupUsers.has(e.userId)),
    }
    const store = memoryStore(stripped)
    const bulk = await bulkReport(store, 'groups-usage')
    const naive = await naiveReport(store, 'groups-usage')
    expect(bulk.equals(naive)).toBe(true)
    expect(bulk.subarray(3).toString('utf8').split('\r\n')[1]).toBe('G001,営業部1,5,0,0')
  })
})
