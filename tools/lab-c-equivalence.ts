// The equivalence check of SCOPE.md 4.4 and the page reading both lab C setups need. Pure functions
// over the emitted text, so `pnpm test` covers them with no build, no port and no network.

export type Tool = 'webpack' | 'rsbuild'

/**
 * The mount point of the page. 4.4 was written as the literal `id="root"`; in production
 * html-webpack-plugin 5.6.8 emits `<div id=root></div>` and offers no switch that changes it
 * (facts F20), so all three quoting forms count and nothing else does. A page with no root mount
 * still fails.
 */
export function mountsOnRoot(html: string): boolean {
  return /\bid\s*=\s*(?:"root"|'root'|root(?=[\s/>]))/.test(html)
}

/**
 * The `src` of the first `<script src=…>` of a page, or null when there is none. Both quoted and
 * unquoted attributes occur: Rsbuild writes `src="/static/js/…"`, html-webpack-plugin writes
 * `src=main.<hash>.js` in production. The page is read as it is given, never as a shape assumed.
 */
export function firstScriptSrc(html: string): string | null {
  const match = /<script\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/i.exec(html)
  if (match === null) return null
  return match[1] ?? match[2] ?? match[3] ?? null
}

/**
 * Every label of 4.1 that does not occur in the emitted JavaScript, in order. The labels are matched
 * as whole tokens: a plain substring search would let `m50` satisfy `m5`, so with 1,000 modules a
 * missing low label would never be reported and the check would be far weaker than it reads.
 */
export function missingLabels(js: string, modules: number): string[] {
  const present = new Set<string>()
  for (const match of js.matchAll(/m\d+/g)) present.add(match[0])
  const missing: string[] = []
  for (let i = 0; i < modules; i++) {
    if (!present.has(`m${i}`)) missing.push(`m${i}`)
  }
  return missing
}

export type EmittedBuild = {
  tool: Tool
  /** Every emitted `.js` file concatenated. */
  js: string
  /** The emitted HTML page. */
  html: string
  /** The file names the build emitted, so the page's script can be shown to be one of them. */
  assets: string[]
}

/**
 * One message per difference, naming the label or the condition that failed. An empty array means
 * the build satisfies 4.4.
 */
export function equivalenceViolations(build: EmittedBuild, modules: number): string[] {
  const bad: string[] = []

  const missing = missingLabels(build.js, modules)
  if (missing.length > 0) {
    bad.push(
      `${build.tool}: the emitted JavaScript is missing ${missing.length} label(s) of ${modules}, the first being ${
        missing[0]
      }${missing.length > 1 ? ` and the last ${missing[missing.length - 1]}` : ''}`,
    )
  }

  if (!mountsOnRoot(build.html)) {
    bad.push(`${build.tool}: the emitted HTML does not mount the application on root`)
  }

  const src = firstScriptSrc(build.html)
  if (src === null) {
    bad.push(`${build.tool}: the emitted HTML has no script with a src attribute`)
  } else {
    const name =
      src
        .split('?')[0]
        .split('/')
        .filter((part) => part.length > 0)
        .pop() ?? ''
    if (!build.assets.some((asset) => asset === name || asset.endsWith(`/${name}`))) {
      bad.push(
        `${build.tool}: the emitted HTML references the script ${src}, which is not one of the ${
          build.assets.length
        } emitted file(s)`,
      )
    }
  }

  return bad
}
