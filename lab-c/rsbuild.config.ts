// The Rsbuild setup of SCOPE.md 4.2, used through `node node_modules/@rsbuild/core/bin/rsbuild.js`.
// The JSX stays on the classic runtime, the page mounts on `root`, the dev server binds 127.0.0.1
// explicitly on 18462, and no persistent cache is enabled.

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

const LAB_C_DIR = fileURLToPath(new URL('.', import.meta.url))
const APP_DIR = join(LAB_C_DIR, 'app')

export const RSBUILD_DEV_PORT = 18462

export default defineConfig({
  root: APP_DIR,
  source: { entry: { index: './src/index.tsx' } },
  plugins: [pluginReact({ swcReactOptions: { runtime: 'classic' } })],
  html: { mountId: 'root' },
  output: { distPath: { root: 'dist-rsbuild' } },
  server: { host: '127.0.0.1', port: RSBUILD_DEV_PORT },
  performance: { buildCache: false },
})
