module.exports = {
  format: 'esm', // for dts rollup
  tsTransform: {
    ignoreErrorCodes: [
      // BigInt literals are not available when targeting lower than ES2020
      // 2737,
    ]
  }
}
