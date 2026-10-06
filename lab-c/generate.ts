// The synthetic application of SCOPE.md 4.1. `lab-c/app/` is written from scratch every time; its
// content depends only on the module count, so two generations of the same count are byte-identical.
// Nothing here is random and nothing reads the clock.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_MODULES = 1000

/** `C0000`, `C0001`, … one per module. */
export function componentName(index: number): string {
  return `C${String(index).padStart(4, '0')}`
}

/** The label the equivalence check of 4.4 looks for: `m0` … `m<N-1>`. */
export function label(index: number): string {
  return `m${index}`
}

export function componentSource(index: number): string {
  const name = componentName(index)
  const own = label(index)
  return `import React from 'react'

export default function ${name}() {
  return (
    <section>
      <h2>${own}</h2>
      <ul>
        <li>${own} one</li>
        <li>${own} two</li>
        <li>${own} three</li>
      </ul>
    </section>
  )
}
`
}

export function entrySource(modules: number): string {
  const names = Array.from({ length: modules }, (_, i) => componentName(i))
  const imports = names.map((name) => `import ${name} from './components/${name}'`).join('\n')
  const list = names.map((name) => `  ${name},`).join('\n')
  return `import React from 'react'
import { createRoot } from 'react-dom/client'
${imports}

const components = [
${list}
]

const container = document.getElementById('root')
if (container !== null) {
  createRoot(container).render(
    <React.Fragment>
      {components.map((Component, index) => (
        <Component key={index} />
      ))}
    </React.Fragment>,
  )
}
`
}

/** Writes the whole application and returns the files it wrote, repository-relative order. */
export function generateApp(appDir: string, modules: number): string[] {
  if (!Number.isSafeInteger(modules) || modules < 1) {
    throw new Error(`lab C: the module count must be a whole number of at least 1, not ${modules}`)
  }
  // From scratch: a previous generation with a different count must leave nothing behind.
  rmSync(join(appDir, 'src'), { recursive: true, force: true, maxRetries: 10 })
  const componentsDir = join(appDir, 'src', 'components')
  mkdirSync(componentsDir, { recursive: true })

  const written: string[] = []
  for (let i = 0; i < modules; i++) {
    const path = join(componentsDir, `${componentName(i)}.tsx`)
    writeFileSync(path, componentSource(i))
    written.push(path)
  }
  const entry = join(appDir, 'src', 'index.tsx')
  writeFileSync(entry, entrySource(modules))
  written.push(entry)
  return written
}
