const { defineFunctionConfig } = require('@tybys/cgen')

module.exports = defineFunctionConfig(function (_options, { isDebug }) {

  const debugFlags = [
    '-sDISABLE_EXCEPTION_CATCHING=0',
    '-sSAFE_HEAP=1'
  ]

  const commonFlags = [
    '--bind',
    '-sALLOW_MEMORY_GROWTH=1',
    // '-sDISABLE_EXCEPTION_CATCHING=0',
    ...(isDebug ? debugFlags : [])
  ]

  return {
    project: 'wz',
    dependencies: {
      './deps/zlib': {}
    },
    targets: [
      {
        name: 'wz',
        type: 'exe',
        sources: [
          './src/main.cpp',
          './src/aes/aes.c'
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
          './deps/zlib'
        ],
        libs: [
          "zlibstatic"
        ]
      }
    ]
  }
})
