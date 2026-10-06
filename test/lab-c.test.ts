// Lab C's generator (SCOPE.md 4.1) and its equivalence check (4.4). The generator writes into a
// scratch directory under the OS temp directory; nothing here needs a build, a port or the network.

import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  componentName,
  componentSource,
  entrySource,
  generateApp,
  label,
} from '../lab-c/generate.ts'
import {
  equivalenceViolations,
  firstScriptSrc,
  missingLabels,
  mountsOnRoot,
} from '../tools/lab-c-equivalence.ts'

const scratches: string[] = []

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'labs-lab-c-test-'))
  scratches.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of scratches) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 })
    } catch (error: unknown) {
      // A failed removal is printed and never costs a result (SCOPE.md, "Language and style").
      process.stderr.write(`could not remove ${dir}: ${String(error)}\n`)
    }
  }
})

/** One stable digest of the whole generated tree: every path and its bytes, paths sorted. */
function treeDigest(dir: string): string {
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(relative(dir, file).split(sep).join('/'))
    hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}

describe('the generator (SCOPE.md 4.1)', () => {
  it('writes one component per module and the entry', () => {
    const dir = scratch()
    const written = generateApp(dir, 12)
    expect(written).toHaveLength(13)
    expect(written[0].endsWith(join('components', 'C0000.tsx'))).toBe(true)
    expect(written.at(-1)?.endsWith(join('src', 'index.tsx'))).toBe(true)
    expect(componentName(0)).toBe('C0000')
    expect(componentName(999)).toBe('C0999')
    expect(label(0)).toBe('m0')
    expect(label(999)).toBe('m999')
  })

  it('is deterministic: two generations of the same count are byte-identical', () => {
    const a = scratch()
    const b = scratch()
    generateApp(a, 40)
    generateApp(b, 40)
    const first = treeDigest(a)
    expect(first).toBe(treeDigest(b))
    // And generating again over the same directory changes nothing.
    generateApp(a, 40)
    expect(treeDigest(a)).toBe(first)
  })

  it('control: two different module counts do not give the same tree', () => {
    const a = scratch()
    const b = scratch()
    generateApp(a, 10)
    generateApp(b, 11)
    expect(treeDigest(a)).not.toBe(treeDigest(b))
  })

  it('writes the app from scratch, so a smaller count leaves no older component behind', () => {
    const dir = scratch()
    generateApp(dir, 20)
    generateApp(dir, 5)
    const components = readdirSync(join(dir, 'src', 'components'))
    expect(components).toHaveLength(5)
    expect(components).not.toContain('C0019.tsx')
  })

  it('gives every module its own label and the classic JSX runtime import', () => {
    const dir = scratch()
    generateApp(dir, 50)
    for (const index of [0, 1, 7, 49]) {
      const source = readFileSync(
        join(dir, 'src', 'components', `${componentName(index)}.tsx`),
        'utf8',
      )
      expect(source).toContain("import React from 'react'")
      expect(source).toContain(`<h2>${label(index)}</h2>`)
      expect(source).toContain(`export default function ${componentName(index)}()`)
    }
    expect(componentSource(3)).toContain('<li>m3 one</li>')
  })

  it('imports every component in the entry and renders them with react-dom/client', () => {
    const source = entrySource(4)
    expect(source).toContain("import { createRoot } from 'react-dom/client'")
    for (const index of [0, 1, 2, 3]) {
      expect(source).toContain(
        `import ${componentName(index)} from './components/${componentName(index)}'`,
      )
    }
    expect(source).toContain("document.getElementById('root')")
    expect(source).toContain('createRoot(container).render(')
  })

  it('control: a module count below 1 is an error that names it', () => {
    expect(() => generateApp(scratch(), 0)).toThrowError(/at least 1, not 0/)
    expect(() => generateApp(scratch(), 1.5)).toThrowError(/at least 1, not 1.5/)
  })
})

describe('the equivalence check (SCOPE.md 4.4)', () => {
  const page =
    '<!doctype html><html><head><script defer src="/static/js/index.abc.js"></script></head>' +
    '<body><div id="root"></div></body></html>'
  const good = {
    tool: 'rsbuild' as const,
    js: 'm0 m1 m2 m3',
    html: page,
    assets: ['index.html', 'static/js/index.abc.js'],
  }

  it('passes a build that holds every label, mounts on root and references an emitted script', () => {
    expect(equivalenceViolations(good, 4)).toEqual([])
    expect(missingLabels('m0 m1 m2 m3', 4)).toEqual([])
  })

  it('control: a missing label fails the check and names the label', () => {
    expect(missingLabels('m0 m1 m3', 4)).toEqual(['m2'])
    expect(equivalenceViolations({ ...good, js: 'm0 m1 m3' }, 4)).toEqual([
      'rsbuild: the emitted JavaScript is missing 1 label(s) of 4, the first being m2',
    ])
  })

  it('control: several missing labels name the first and the last', () => {
    expect(equivalenceViolations({ ...good, js: 'm0' }, 4)).toEqual([
      'rsbuild: the emitted JavaScript is missing 3 label(s) of 4, the first being m1 and the last m3',
    ])
  })

  it('accepts the three quoting forms of the root mount that the two tools emit', () => {
    // html-webpack-plugin emits `id=root` unquoted in production and Rsbuild emits `id="root"`
    // (facts F20); both mount the application on root.
    expect(mountsOnRoot('<div id="root"></div>')).toBe(true)
    expect(mountsOnRoot("<div id='root'></div>")).toBe(true)
    expect(mountsOnRoot('<div id=root></div>')).toBe(true)
    expect(mountsOnRoot('<body><div id=root class=x></div></body>')).toBe(true)
  })

  it('control: a page that mounts on something else fails the check', () => {
    for (const html of ['<div id="app"></div>', '<div id=rootish></div>', '<div></div>']) {
      expect(mountsOnRoot(html)).toBe(false)
      expect(equivalenceViolations({ ...good, html }, 4)).toContain(
        'rsbuild: the emitted HTML does not mount the application on root',
      )
    }
  })

  it('reads the first script src whether it is quoted or not', () => {
    expect(firstScriptSrc(page)).toBe('/static/js/index.abc.js')
    expect(firstScriptSrc('<script defer src=main.abc.js></script>')).toBe('main.abc.js')
    expect(firstScriptSrc("<script src='a.js'></script><script src='b.js'></script>")).toBe('a.js')
  })

  it('control: a page with no script src fails the check and says so', () => {
    const html = '<html><body><div id="root"></div></body></html>'
    expect(firstScriptSrc(html)).toBeNull()
    expect(equivalenceViolations({ ...good, html }, 4)).toContain(
      'rsbuild: the emitted HTML has no script with a src attribute',
    )
  })

  it('control: a page referencing a script the build did not emit fails the check', () => {
    expect(equivalenceViolations({ ...good, assets: ['index.html'] }, 4)).toContain(
      'rsbuild: the emitted HTML references the script /static/js/index.abc.js, which is not one of the 1 emitted file(s)',
    )
  })

  it('names the tool in every message, so the lab says which setup failed', () => {
    const forWebpack = equivalenceViolations({ ...good, tool: 'webpack', js: '' }, 2)
    expect(forWebpack[0].startsWith('webpack: ')).toBe(true)
  })
})

describe('the label match is a whole token, not a substring', () => {
  it('control: m50 in the output does not satisfy the label m5', () => {
    // A plain `includes('m5')` would pass here. With 1,000 modules that would hide most of the
    // range, so the check tokenises instead.
    const js = ['m0', 'm1', 'm2', 'm3', 'm4', 'm50', 'm6', 'm7', 'm8', 'm9'].join(' ')
    expect(missingLabels(js, 10)).toEqual(['m5'])
    expect('m0 m1 m2 m3 m4 m50 m6 m7 m8 m9'.includes('m5')).toBe(true)
  })

  it('counts a label present only as a longer number as missing', () => {
    expect(missingLabels('m10 m11 m12', 2)).toEqual(['m0', 'm1'])
  })
})
