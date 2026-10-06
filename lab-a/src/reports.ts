// The four reports of SCOPE.md 2.2: their columns, in order, and what each one sums and counts.
// Shared by the naive and the bulk implementations so that both describe the same four exports.

import { WINDOW_FROM, WINDOW_TO } from './data.ts'
import type { EventCollectionName, TimeWindow } from './store.ts'

export type ReportName = 'users-usage' | 'groups-usage' | 'users-charge' | 'groups-charge'

export type ReportSpec = {
  /** One row per user, or one row per group. */
  rowsPer: 'user' | 'group'
  collection: EventCollectionName
  sumField: 'pages' | 'amount'
  header: readonly string[]
  /** Zero-based indexes of the columns that must read as an integer in plain decimal (2.2). */
  integerColumns: readonly number[]
}

export const WINDOW: TimeWindow = { from: WINDOW_FROM, to: WINDOW_TO }

export const REPORTS: readonly ReportName[] = [
  'users-usage',
  'groups-usage',
  'users-charge',
  'groups-charge',
]

export const REPORT_SPECS: Record<ReportName, ReportSpec> = {
  'users-usage': {
    rowsPer: 'user',
    collection: 'usage_events',
    sumField: 'pages',
    header: ['group_code', 'group_name', 'user_code', 'user_name', 'pages', 'events'],
    integerColumns: [4, 5],
  },
  'groups-usage': {
    rowsPer: 'group',
    collection: 'usage_events',
    sumField: 'pages',
    header: ['group_code', 'group_name', 'users', 'pages', 'events'],
    integerColumns: [2, 3, 4],
  },
  'users-charge': {
    rowsPer: 'user',
    collection: 'charge_events',
    sumField: 'amount',
    header: ['group_code', 'group_name', 'user_code', 'user_name', 'amount', 'charges'],
    integerColumns: [4, 5],
  },
  'groups-charge': {
    rowsPer: 'group',
    collection: 'charge_events',
    sumField: 'amount',
    header: ['group_code', 'group_name', 'users', 'amount', 'charges'],
    integerColumns: [2, 3, 4],
  },
}
