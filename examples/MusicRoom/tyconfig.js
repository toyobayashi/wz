const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  pluginImplementation: {
    HtmlWebpackPlugin: require('html-webpack-plugin'),
    TerserWebpackPlugin: require('terser-webpack-plugin')
  },
  configureWebpack: {
    web (config) {
      config.plugins = [
        ...(config.plugins || []),
        new CopyWebpackPlugin({
          patterns: [
            { from: '../../dist/wz.wasm', to: 'wz.wasm' }
          ]
        })
      ]
    }
  }
}