// Counting the requests of one export, as SCOPE.md 2.4 describes it: a fresh client with
// `monitorCommands: true` serves exactly one export, and a listener on `commandStarted` counts by
// `commandName`. The counter takes anything that emits those events, so a test can drive it with a
// fake client and needs no database.

export type CommandStartedLike = { commandName: string }

export type CommandSource = {
  on(event: 'commandStarted', listener: (event: CommandStartedLike) => void): unknown
}

/**
 * Listed but not counted as requests (2.4): the driver's handshake, and the `endSessions` it sends
 * when the client closes. Measured on this machine, see facts F17.
 */
export const NON_REQUEST_COMMANDS: readonly string[] = [
  'hello',
  'ismaster',
  'isMaster',
  'saslStart',
  'saslContinue',
  'saslSupportedMechs',
  'buildInfo',
  'getParameter',
  'endSessions',
]

/** The command names that are requests of the lab (2.4). */
export const REQUEST_COMMANDS: readonly string[] = ['find', 'aggregate', 'getMore']

export type ExpectedCounts = {
  find: number
  aggregate: number
  /** Left out when the contract measures it instead of asserting it (bulk, 2.4). */
  getMore?: number
}

export type RequestCounter = {
  /** Every `commandName` seen, the handshake included. */
  readonly listed: Record<string, number>
  /** Only the names that count as requests. */
  readonly requests: Record<string, number>
  /** How many requests have been counted so far. */
  total(): number
  countOf(commandName: string): number
}

export function countRequests(source: CommandSource): RequestCounter {
  const listed: Record<string, number> = {}
  const requests: Record<string, number> = {}
  source.on('commandStarted', (event) => {
    listed[event.commandName] = (listed[event.commandName] ?? 0) + 1
    if (NON_REQUEST_COMMANDS.includes(event.commandName)) return
    requests[event.commandName] = (requests[event.commandName] ?? 0) + 1
  })
  return {
    listed,
    requests,
    total() {
      return Object.values(requests).reduce((a, b) => a + b, 0)
    },
    countOf(commandName) {
      return requests[commandName] ?? 0
    },
  }
}

/**
 * The checks of 2.4 over one export's counts: the expected `find` and `aggregate`, `getMore` only
 * when the contract asserts it, and no request under any other name. An empty array means they hold.
 */
export function requestViolations(
  counter: RequestCounter,
  expected: ExpectedCounts,
  label: string,
): string[] {
  const bad: string[] = []
  if (counter.countOf('find') !== expected.find) {
    bad.push(`${label}: find was ${counter.countOf('find')}, expected ${expected.find}`)
  }
  if (counter.countOf('aggregate') !== expected.aggregate) {
    bad.push(
      `${label}: aggregate was ${counter.countOf('aggregate')}, expected ${expected.aggregate}`,
    )
  }
  if (expected.getMore !== undefined && counter.countOf('getMore') !== expected.getMore) {
    bad.push(`${label}: getMore was ${counter.countOf('getMore')}, expected ${expected.getMore}`)
  }
  for (const name of Object.keys(counter.requests)) {
    if (!REQUEST_COMMANDS.includes(name)) {
      bad.push(
        `${label}: the command ${name} is neither a request of 2.4 nor part of the handshake`,
      )
    }
  }
  return bad
}
