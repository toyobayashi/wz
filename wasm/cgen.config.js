const { defineFunctionConfig } = require('@tybys/cgen')

function createTarget (name, asm, isDebug) {
  const debugFlags = [
    '-sDISABLE_EXCEPTION_CATCHING=0',
    '-sSAFE_HEAP=1',
    ...(!asm ? ['-g4', '--source-map-base', './'] : [])
  ]

  const commonFlags = [
    '--bind',
    '-sALLOW_MEMORY_GROWTH=1',
    ...(asm ? ['-sWASM=0'] : []),
    // '-sDISABLE_EXCEPTION_CATCHING=0',
    ...(isDebug ? debugFlags : ['-O3'])
  ]

  return {
    name: name,
    type: 'exe',
    sources: [
      './src/main.cpp'
    ],
    defines: [
      'AES256=1',
      'ECB=1'
    ],
    wrapScript: './export.js',
    compileOptions: [
      ...commonFlags
    ],
    linkOptions: [
      ...commonFlags
    ],
    includePaths: [
      './deps/zlib',
      './deps/openssl/include'
    ],
    libs: [
      'zlibstatic',
      './deps/openssl/lib/libcrypto.a',
      './deps/openssl/lib/libssl.a',
    ]
  }
}

module.exports = defineFunctionConfig(function (_options, { isDebug }) {
  return {
    project: 'wz',
    dependencies: {
      './deps/zlib': {}
    },
    targets: [
      createTarget('wz', false, isDebug),
      createTarget('wzasm', true, isDebug)
    ]
  }
})
