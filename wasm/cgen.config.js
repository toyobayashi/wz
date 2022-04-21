const { defineFunctionConfig } = require('@tybys/cgen')

function createTarget (name, asm, isDebug) {
  const compilerFlags = [
    // ...(isDebug ? ['-sDISABLE_EXCEPTION_CATCHING=0'] : [])
  ]
  const linkerFlags = [
    // '--bind',
    '-sALLOW_MEMORY_GROWTH=1',
    "-sEXPORTED_FUNCTIONS=['_malloc','_free']",
    ...(asm ? ['-sWASM=0'] : []),
    ...(isDebug ? [/* '-sDISABLE_EXCEPTION_CATCHING=0',  */'-sSAFE_HEAP=1'] : [])
  ]

  return {
    name: name,
    type: 'exe',
    sources: [
      './src/main.c'
    ],
    defines: [
      'AES256=1',
      'ECB=1'
    ],
    emwrap: {
      script: './export.js',
    },
    compileOptions: [
      ...compilerFlags
    ],
    linkOptions: [
      ...linkerFlags
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
