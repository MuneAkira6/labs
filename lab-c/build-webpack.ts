// The build script of SCOPE.md 4.2: webpack's Node API, production mode, no CLI. The runner starts it
// as `process.execPath lab-c/build-webpack.ts` and times it from spawn to exit (4.3).

import webpack from 'webpack'
import { webpackConfig } from './webpack.ts'

webpack(webpackConfig('production'), (error, stats) => {
  if (error !== null && error !== undefined) {
    process.stderr.write(`${error.stack ?? String(error)}\n`)
    process.exit(1)
  }
  if (stats === undefined) {
    process.stderr.write('webpack returned no stats\n')
    process.exit(1)
  }
  if (stats.hasErrors()) {
    process.stderr.write(`${stats.toString({ preset: 'errors-only', colors: false })}\n`)
    process.exit(1)
  }
  process.stdout.write(
    `webpack: ${stats.toJson({ assets: true }).assets?.length ?? 0} assets in ${
      stats.endTime - stats.startTime
    } ms inside the process\n`,
  )
  process.exit(0)
})
