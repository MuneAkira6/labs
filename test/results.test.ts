// The result rules of SCOPE.md 1.4: the median, the range, the file names and the machine block.

import { spawnSync } from 'node:child_process'
import { cpus, tmpdir } from 'node:os'
import { join } from 'node:path'
import { arch, platform, version } from 'node:process'
import { describe, expect, it } from 'vitest'
import {
  gitCommit,
  machineBlock,
  machineBlockMarkdown,
  median,
  minMax,
  NO_GIT_COMMIT,
  resultFileNames,
  roundMs,
  utcDate,
} from '../tools/results.ts'

const REPO = join(import.meta.dirname, '..')

describe('the median and range rules (SCOPE.md 1.4)', () => {
  it('takes the middle value of an odd count', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([7])).toBe(7)
  })

  it('takes the mean of the middle two of an even count', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([10, 40, 20, 30])).toBe(25)
  })

  it('control: the lower middle value is not the median of an even count', () => {
    const sorted = [1, 2, 3, 4]
    const lowerMiddle = sorted[(sorted.length >> 1) - 1]
    expect(lowerMiddle).toBe(2)
    expect(median(sorted)).not.toBe(lowerMiddle)
  })

  it('gives the minimum and the maximum of the measured runs', () => {
    expect(minMax([12.4, 9.1, 30.8])).toEqual({ min: 9.1, max: 30.8 })
  })

  it('rounds to whole milliseconds for the table and leaves the raw values alone', () => {
    const raw = [12.4, 9.6, 30.5]
    expect(roundMs(median(raw))).toBe(12)
    expect(raw).toEqual([12.4, 9.6, 30.5])
  })

  it('control: an empty series has no median and no range', () => {
    expect(() => median([])).toThrow()
    expect(() => minMax([])).toThrow()
  })
})

describe('the result file names (SCOPE.md 1.4)', () => {
  it('is the UTC date, the platform and the arch', () => {
    const now = new Date('2026-10-05T23:59:59.000Z')
    expect(utcDate(now)).toBe('2026-10-05')
    expect(resultFileNames(now, 'linux', 'x64')).toEqual({
      json: '2026-10-05-linux-x64.json',
      md: '2026-10-05-linux-x64.md',
    })
    expect(resultFileNames(now, platform, arch).json).toBe(`2026-10-05-${platform}-${arch}.json`)
  })

  it('control: a local date is not the UTC date for a late-evening instant', () => {
    const now = new Date('2026-10-05T23:30:00.000Z')
    const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`
    // On a machine east of UTC this is already the 6th; `utcDate` must still say the 5th.
    expect(utcDate(now)).toBe('2026-10-05')
    if (local !== '2026-10-05') expect(utcDate(now)).not.toBe(local)
  })
})

describe('the machine block (SCOPE.md 1.4)', () => {
  it('carries every field the contract names, and omits docker when the lab needs none', async () => {
    const now = new Date('2026-10-05T07:00:00.000Z')
    const block = await machineBlock({ now })
    expect(Object.keys(block)).toEqual(['date', 'os', 'arch', 'cpu', 'memoryGiB', 'node', 'commit'])
    expect(block.date).toBe('2026-10-05T07:00:00.000Z')
    expect(block.arch).toBe(arch)
    expect(block.node).toBe(version)
    expect(block.cpu).toContain(` x ${cpus().length}`)
    expect(block.memoryGiB).toBeGreaterThan(0)
    expect(Number(block.memoryGiB.toFixed(1))).toBe(block.memoryGiB)
    // a git checkout names its commit; a tree without `.git` says that it has none
    const inGit =
      spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
        cwd: REPO,
        encoding: 'utf8',
      }).stdout?.trim() === 'true'
    if (inGit) expect(block.commit).toMatch(/^[0-9a-f]{7,}(\+dirty)?$/)
    else expect(block.commit).toBe(NO_GIT_COMMIT)
    expect(block.docker).toBeUndefined()
  })

  // Found after the run: in a fresh tree unpacked without `.git`, the commit came out as ''.
  it('outside a git checkout, commit says so instead of being empty', async () => {
    const saved = process.env.GIT_DIR
    process.env.GIT_DIR = join(tmpdir(), 'labs-no-such-git-dir')
    try {
      expect(await gitCommit()).toBe(NO_GIT_COMMIT)
    } finally {
      if (saved === undefined) delete process.env.GIT_DIR
      else process.env.GIT_DIR = saved
    }
  })

  it('adds docker when the lab uses it, and the Markdown shows every field', async () => {
    const block = await machineBlock({
      now: new Date('2026-10-05T07:00:00.000Z'),
      docker: '28.1.1',
    })
    expect(block.docker).toBe('28.1.1')
    const markdown = machineBlockMarkdown(block)
    for (const field of ['date', 'os', 'arch', 'cpu', 'memoryGiB', 'node', 'docker', 'commit']) {
      expect(markdown).toContain(`- ${field}: `)
    }
  })

  it('control: a block without docker shows no docker line', async () => {
    const block = await machineBlock({ now: new Date('2026-10-05T07:00:00.000Z') })
    expect(machineBlockMarkdown(block)).not.toContain('- docker:')
  })
})
