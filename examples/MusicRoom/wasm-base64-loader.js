const wasmBase64Loader = (content) =>
  `export default "data:application/wasm;base64,${content.toString('base64')}";`

wasmBase64Loader.raw = true

module.exports = wasmBase64Loader
