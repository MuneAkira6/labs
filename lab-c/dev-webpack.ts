// The dev script of SCOPE.md 4.2: `webpack-dev-server` on 127.0.0.1:18461 through its Node API, no
// CLI. The host is given explicitly, so the server never reaches beyond the loopback.

import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { WEBPACK_DEV_PORT, webpackConfig } from './webpack.ts'

const compiler = webpack(webpackConfig('development'))
const server = new WebpackDevServer(
  { host: '127.0.0.1', port: WEBPACK_DEV_PORT, hot: false, liveReload: false, client: false },
  compiler,
)

await server.start()
process.stdout.write(`webpack-dev-server listening on 127.0.0.1:${WEBPACK_DEV_PORT}\n`)
