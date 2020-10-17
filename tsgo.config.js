const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  entry: 'lib/esm-modern/index.js',
  output: {
    webpack: 'dist'
  },
  bundler: ['webpack'],
  configureWebpack (config) {
    config.node = {
      crypto: 'empty',
      __dirname: false,
      __filename: false,
      buffer: false,
      process: false
    }
    // config.resolve.fallback = {
    //   fs: false,
    //   path: false,
    //   crypto: false
    // }
    config.resolve.alias = {
      '@tybys/binreader': '@tybys/binreader/lib/esm-modern/index.js'
    }
    config.plugins = [
      ...config.plugins,
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(path.dirname(config.entry[Object.keys(config.entry)[0]][0]), 'util/zlibwasm.wasm'), to: path.join(config.output.path, 'zlibwasm.wasm') }
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
