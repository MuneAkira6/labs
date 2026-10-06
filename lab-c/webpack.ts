// The webpack + Babel setup of SCOPE.md 4.2, used through webpack's Node API by a build script and a
// dev script; there is no webpack CLI in this repository. No persistent cache is enabled.

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import type { Configuration } from 'webpack'

export const LAB_C_DIR = fileURLToPath(new URL('.', import.meta.url))
export const APP_DIR = join(LAB_C_DIR, 'app')
export const WEBPACK_DIST = join(APP_DIR, 'dist-webpack')
export const WEBPACK_DEV_PORT = 18461

/** The page of 4.2: `<div id="root"></div>`. */
const PAGE = [
  '<!doctype html>',
  '<html lang="en">',
  '<head><meta charset="utf-8"><title>lab C</title></head>',
  '<body><div id="root"></div></body>',
  '</html>',
].join('')

export function webpackConfig(mode: 'production' | 'development'): Configuration {
  return {
    mode,
    context: APP_DIR,
    entry: join(APP_DIR, 'src', 'index.tsx'),
    output: {
      path: WEBPACK_DIST,
      filename: mode === 'production' ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    resolve: { extensions: ['.tsx', '.ts', '.js'] },
    // No persistent cache, and none in memory either, so every build is cold (4.2 and 4.3).
    cache: false,
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: false,
              babelrc: false,
              configFile: false,
              browserslistConfigFile: false,
              presets: [
                ['@babel/preset-react', { runtime: 'classic' }],
                // Babel 8 removed `allExtensions` and `isTSX`; JSX detection is by file extension,
                // and every generated module is a `.tsx`.
                '@babel/preset-typescript',
              ],
            },
          },
        },
      ],
    },
    // The page of 4.2, exactly as the contract writes it. In production html-webpack-plugin 5.6.8
    // re-serialises it without attribute quotes and emits `<div id=root></div>`; its `minify` option
    // does not change that, measured three ways in facts F20. The emitted page therefore mounts on
    // `root` without the quotes, which is the one contract change of this run.
    plugins: [new HtmlWebpackPlugin({ templateContent: PAGE })],
    infrastructureLogging: { level: 'error' },
    stats: 'errors-warnings',
  }
}
