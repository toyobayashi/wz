// const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  output: {
    web: '../../docs/MusicRoom'
  },
  pluginImplementation: {
    HtmlWebpackPlugin: require('html-webpack-plugin'),
    TerserWebpackPlugin: require('terser-webpack-plugin')
  },
  configureWebpack: {
    web (config) {
      /* config.plugins = [
        ...(config.plugins || []),
        new CopyWebpackPlugin({
          patterns: [
            { from: '../../dist/wz.wasm', to: 'wz.wasm' }
          ]
        })
      ] */
      config.module.rules = [
        ...(config.module.rules || []),
        {
          test: /@tybys[\\/]wz[\\/]dist[\\/]wz\.wasm$/,
          loader: path.join(__dirname, 'wasm-base64-loader.js')
        }
      ],
      config.optimization = {}
    }
  }
}
