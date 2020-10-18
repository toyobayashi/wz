const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: 'lib/esm-modern/index.js',
  output: {
    webpack: 'dist'
  },
  bundler: ['webpack'],
  configureWebpack (config) {
    const webpackVesion = Number(webpack.version.charAt(0))
    if (webpackVesion > 4) {
      config.node = false
      config.resolve.fallback = {
        crypto: false
      }
    } else {
      config.node = {
        crypto: 'empty',
        __dirname: false,
        __filename: false,
        process: false
      }
    }
    config.resolve.alias = {
      '@tybys/binreader': '@tybys/binreader/lib/esm-modern/index.js'
    }
    config.plugins = [
      ...config.plugins,
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(path.dirname(config.entry[Object.keys(config.entry)[0]][0]), 'util/wz.wasm'), to: path.join(config.output.path, 'wz.wasm') }
        ]
      })
    ]
  },
  tsTransform: {
    ignoreErrorCodes: [
      // 2694 // Namespace {0} has no exported member {1}
      // BigInt literals are not available when targeting lower than ES2020
      // 2737,
    ]
  }
}
