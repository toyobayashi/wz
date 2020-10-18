# node-wz

MapleStory wz reader for Node.js and browser.

Incompletely port from [lastbattle/Harepacker-resurrected/MapleLib/WzLib](https://github.com/lastbattle/Harepacker-resurrected/tree/master/MapleLib/WzLib).

[API Documentation](https://github.com/toyobayashi/wz/blob/main/docs/api/index.md)

## Example

``` bash
npm install @tybys/wz
```

### Node.js

``` js
const path = require('path')
const {
  walkWzFileAsync,
  WzMapleVersion,
  WzObjectType,
  WzBinaryProperty,
  ErrorLogger
} = require('@tybys/wz')

/**
 * @param {string} wzFilePath - WZ file path
 * @param {WzMapleVersion} mapleVersion - MapleStory version
 * @param {string} dir - Output directory path
 */
async function saveSounds (wzFilePath, mapleVersion, dir) {
  let n = 0

  // let _doNotUseMe

  /**
   * @template {import('@tybys/wz').WzObject} T
   * @param {T} obj - wz object
   * @returns {Promise<boolean | undefined>}
   */
  async function callback (obj) {
    // obj is available only in this scope
    // _doNotUseMe = obj // ! do not do this
    if (obj.objectType === WzObjectType.Property && obj instanceof WzBinaryProperty) {
      const relativePath = path.win32.relative(wzFilePath, obj.fullPath).replace(/\\/g, '/')
      const file = path.join(dir, path.extname(relativePath) === '' ? `${relativePath}.mp3` : relativePath)
      console.log(`Saving ${path.resolve(file)}`)
      await obj.saveToFile(file)
      n++
    }
    return false // continue walking
  }

  await walkWzFileAsync(wzFilePath, mapleVersion, callback)

  console.log(`Total files: ${n}`)

  if (ErrorLogger.errorsPresent()) {
    ErrorLogger.saveToFile('WzError.log')
  }
}

saveSounds('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS, 'Sound')
```

### Modern browser

Browser environment should be with ES2018+ and WebAssembly support.

``` html
<input type="file" name="sound" id="file">

<script src="node_modules/@tybys/wz/dist/wz.min.js"></script>
```

``` js
/// <reference path="node_modules/@tybys/wz/dist/wz.d.ts" />

(function () {
  const input = document.getElementById('file')

  input.addEventListener('change', async (e) => {
    const f = e.target.files[0] // Select the Sound.wz file

    await wz.walkWzFileAsync(f, wz.WzMapleVersion.BMS, async (obj) => {
      if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzBinaryProperty) {
        console.log(obj.fullPath)

        const buf = (await obj.getBytes(false)) // MP3 Uint8Array
        const blob = new Blob([buf.buffer], { type: 'audio/mp3' })
        const src = URL.createObjectURL(blob)
        const audio = new Audio()
        audio.src = src
        audio.play()

        await obj.saveToFile('1.mp3') // trigger download

        return true
      }
    })
  })
})()
```

### Webpack

Set `node` or `node.process` to `false` due to emscripten js glue code is using `process`, and add `CopyWebpackPlugin` to copy `wz.wasm` file

``` js
module.exports = {
  // ...
  node: false
  // or
  node: {
    process: false
  },
  plugins: [
    // ...
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/@tybys/wz/dist/wz.wasm', to: '${the same place with output bundle}/wz.wasm' }
      ]
    })
  ],
  /* resolve: {
    alias: {
      '@tybys/wz': '@tybys/wz/lib/esm/index.js' // this is es5 output
    }
  } */
}
```

``` js
import { walkWzFileAsync, /* ... */ } from '@tybys/wz'
```
