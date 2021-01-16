const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  entry: 'lib/esm/index.js',
  output: {
    webpack: 'dist',
    name: 'wz.es5'
  },
  bundler: ['webpack'],
  configureWebpack (config) {
    config.plugins = [
      ...config.plugins,
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(path.dirname(config.entry[Object.keys(config.entry)[0]][0]), 'util/wz.js.mem'), to: path.join(config.output.path, 'wz.js.mem') }
        ]
      })
    ]
  }
}
