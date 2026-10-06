// Each lab's CI job pulls the image that lab uses, by the same digest. Added after the run: the first
// CI run on GitHub failed lab B with exit 3, because the workflow pulled nothing and lab B never pulls.
// Read as text, so nothing here starts Docker.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO = join(import.meta.dirname, '..')
const text = (path: string): string => readFileSync(join(REPO, path), 'utf8')

/** The image references one job of the workflow pulls with `docker pull`, in order. */
const pulledBy = (workflow: string, job: string): string[] => {
  const lines = workflow.split(/\r?\n/)
  const start = lines.indexOf(`  ${job}:`)
  if (start < 0) return []
  const next = lines.findIndex((line, i) => i > start && /^ {2}\S/.test(line))
  return lines
    .slice(start + 1, next < 0 ? undefined : next)
    .map((line) => /^\s+- run: docker pull (\S+)$/.exec(line)?.[1])
    .filter((ref) => ref !== undefined)
}

const SBT_IMAGE = /const SBT_IMAGE =\s*'([^']+)'/.exec(text('tools/lab-b.ts'))?.[1]
const MONGO_IMAGE = /^\s+image: (\S+)$/m.exec(text('lab-a/compose.yaml'))?.[1]
const WORKFLOW = '.github/workflows/ci.yml'

describe('the images of the CI jobs', () => {
  it('lab-a pulls the image of lab-a/compose.yaml, by digest', () => {
    expect(MONGO_IMAGE).toMatch(/^mongo@sha256:[0-9a-f]{64}$/)
    expect(pulledBy(text(WORKFLOW), 'lab-a')).toEqual([MONGO_IMAGE])
  })

  it('lab-b pulls the image tools/lab-b.ts checks for, by digest', () => {
    expect(SBT_IMAGE).toMatch(/^sbtscala\/scala-sbt@sha256:[0-9a-f]{64}$/)
    expect(pulledBy(text(WORKFLOW), 'lab-b')).toEqual([SBT_IMAGE])
  })

  it('control: the same check fails on a copy of the workflow without the pull of lab-b', () => {
    const workflow = text(WORKFLOW)
    const planted = workflow
      .split('\n')
      .filter((line) => !line.includes(`docker pull ${SBT_IMAGE}`))
      .join('\n')
    expect(planted).not.toBe(workflow)
    expect(pulledBy(planted, 'lab-b')).toEqual([])
  })
})
