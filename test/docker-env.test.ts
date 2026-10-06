// No container of these labs inherits the PC's proxy settings. Added after the run: on the author's
// Windows PC, Docker Desktop put six proxy variables, four with credentials, into a plain `docker run`,
// and lab B's arms were started without clearing them. Read as text, so nothing here starts Docker.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { clearedProxyEnv, PROXY_VARIABLES } from '../tools/docker-env.ts'

const REPO = join(import.meta.dirname, '..')
const text = (path: string): string => readFileSync(join(REPO, path), 'utf8')

/** Whether lab B's dockerArgv, in this source text, clears the proxy variables before the image. */
const argvClearsProxies = (source: string): boolean => {
  const from = source.indexOf('function dockerArgv(')
  const to = source.indexOf('async function requireEnvironment(')
  if (from < 0 || to < from) return false
  const body = source.slice(from, to)
  const cleared = body.indexOf('...clearedProxyEnv()')
  return cleared > body.indexOf("'none'") && cleared < body.indexOf('SBT_IMAGE,')
}

describe('the proxy variables of the labs containers', () => {
  it('clearedProxyEnv sets all six forms, upper and lower case, to the empty string', () => {
    expect(clearedProxyEnv()).toEqual([
      '-e',
      'HTTP_PROXY=',
      '-e',
      'HTTPS_PROXY=',
      '-e',
      'NO_PROXY=',
      '-e',
      'http_proxy=',
      '-e',
      'https_proxy=',
      '-e',
      'no_proxy=',
    ])
  })

  it("lab B's docker run clears them, after --network none and before the image", () => {
    expect(argvClearsProxies(text('tools/lab-b.ts'))).toBe(true)
  })

  it('control: the same check fails on a copy of lab-b.ts without the line', () => {
    const source = text('tools/lab-b.ts')
    const planted = source
      .split('\n')
      .filter((line) => !line.includes('...clearedProxyEnv()'))
      .join('\n')
    expect(planted).not.toBe(source)
    expect(argvClearsProxies(planted)).toBe(false)
  })

  it("lab A's compose file sets every one of them to an empty string", () => {
    const compose = text('lab-a/compose.yaml')
    for (const name of PROXY_VARIABLES) {
      expect(compose, name).toMatch(new RegExp(`^\\s+${name}: ''$`, 'm'))
    }
  })
})
