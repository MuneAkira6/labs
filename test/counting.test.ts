// The request counting of SCOPE.md 2.4, driven by a fake client: no database, no network.

import { describe, expect, it } from 'vitest'
import type { CommandSource } from '../lab-a/src/counting.ts'
import { countRequests, requestViolations } from '../lab-a/src/counting.ts'

type FakeClient = CommandSource & { emit(commandName: string): void }

function fakeClient(): FakeClient {
  const listeners: ((event: { commandName: string }) => void)[] = []
  return {
    on(_event, listener) {
      listeners.push(listener)
      return this
    },
    emit(commandName) {
      for (const listener of listeners) listener({ commandName })
    },
  }
}

describe('counting the requests of one export (SCOPE.md 2.4)', () => {
  it('is zero at the start, before any command', () => {
    const counter = countRequests(fakeClient())
    expect(counter.total()).toBe(0)
    expect(counter.requests).toEqual({})
    expect(counter.listed).toEqual({})
  })

  it('counts by command name', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    for (let i = 0; i < 25; i++) client.emit('find')
    expect(counter.countOf('find')).toBe(25)
    expect(counter.total()).toBe(25)
  })

  it('lists the handshake and endSessions without counting them as requests', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    client.emit('hello')
    client.emit('find')
    client.emit('endSessions')
    expect(counter.listed).toEqual({ hello: 1, find: 1, endSessions: 1 })
    expect(counter.requests).toEqual({ find: 1 })
    expect(counter.total()).toBe(1)
  })

  it('accepts the naive counts of 2.4', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    for (let i = 0; i < 25; i++) client.emit('find')
    expect(requestViolations(counter, { find: 25, aggregate: 0, getMore: 0 }, 'S naive')).toEqual(
      [],
    )
  })

  it('accepts the bulk counts of 2.4 and does not judge getMore', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    client.emit('find')
    client.emit('find')
    client.emit('aggregate')
    for (let i = 0; i < 9; i++) client.emit('getMore')
    // `getMore` is left out of the expected object: 2.4 measures and reports it, never asserts it.
    expect(requestViolations(counter, { find: 2, aggregate: 1 }, 'L bulk')).toEqual([])
    expect(counter.countOf('getMore')).toBe(9)
  })

  it('control: one find too many fails the check', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    for (let i = 0; i < 26; i++) client.emit('find')
    expect(requestViolations(counter, { find: 25, aggregate: 0, getMore: 0 }, 'S naive')).toEqual([
      'S naive: find was 26, expected 25',
    ])
  })

  it('control: an extra query under another name fails the check', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    client.emit('find')
    client.emit('find')
    client.emit('aggregate')
    client.emit('count')
    expect(requestViolations(counter, { find: 2, aggregate: 1 }, 'S bulk')).toEqual([
      'S bulk: the command count is neither a request of 2.4 nor part of the handshake',
    ])
  })

  it('control: an unexpected aggregate in a naive export fails the check', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    for (let i = 0; i < 25; i++) client.emit('find')
    client.emit('aggregate')
    expect(requestViolations(counter, { find: 25, aggregate: 0, getMore: 0 }, 'S naive')).toEqual([
      'S naive: aggregate was 1, expected 0',
    ])
  })

  it('control: a getMore where the contract asserts none fails the check', () => {
    const client = fakeClient()
    const counter = countRequests(client)
    for (let i = 0; i < 25; i++) client.emit('find')
    client.emit('getMore')
    expect(requestViolations(counter, { find: 25, aggregate: 0, getMore: 0 }, 'S naive')).toEqual([
      'S naive: getMore was 1, expected 0',
    ])
  })
})
