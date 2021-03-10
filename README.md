# node-wz

MapleStory wz reader for Node.js and browser.

Incompletely port from [lastbattle/Harepacker-resurrected/MapleLib/WzLib](https://github.com/lastbattle/Harepacker-resurrected/tree/master/MapleLib/WzLib).

[API Documentation](https://github.com/toyobayashi/wz/blob/main/docs/api/index.md)

## Build

Environment:

* Node.js v12+

* CMake v3.6+

* Emscripten toolchain latest

    * Set environment variable `$EMSDK` to emsdk path

    * Add `$EMSDK` and `$EMSDK/upstream/emscripten` to `$PATH`

* Make for Windows (Windows only)

``` bash
git clone https://github.com/toyobayashi/wz.git
cd wz
```

``` bash
npm install
npm run build
```

Windows

``` bat
npm install
npm run build
```

## Example

``` bash
npm install @tybys/wz
```

### Node.js (v10.20+)

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

#### Webpack

Add `CopyWebpackPlugin` to copy `wz.wasm` file

``` js
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/@tybys/wz/dist/wz.wasm', to: '${the same place with output bundle}/wz.wasm' }
      ]
    })
  ],
  /* resolve: {
    alias: {
      '@tybys/binreader': '@tybys/binreader/lib/esm-modern/index.js'
    }
  } */
}
```

``` js
import { walkWzFileAsync, /* ... */ } from '@tybys/wz'
```

### Old browser

For example IE11:

``` html
<!-- BigInt -->
<script>
if (typeof BigInt === 'undefined') {
  window.BigInt = function BigInt (n) {
    return n;
  };
}
</script>

<!-- document.currentScript -->
<script>
// https://github.com/amiller-gh/currentScript-polyfill/blob/master/currentScript.js
</script>

<!-- TextDecoder -->
<script src="https://cdn.jsdelivr.net/npm/text-encoding/lib/encoding-indexes.js"></script>
<script src="https://cdn.jsdelivr.net/npm/text-encoding/lib/encoding.js"></script>

<!-- ES6 globals -->
<script src="https://cdn.jsdelivr.net/npm/@babel/polyfill/dist/polyfill.min.js"></script>

<script src="node_modules/@tybys/wz/dist/wz.es5.min.js"></script>
```

#### Webpack

``` js
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/@tybys/wz/dist/wz.js.mem', to: '${the same place with output bundle}/wz.js.mem' }
      ]
    })
  ],
  resolve: {
    alias: {
      '@tybys/wz': '@tybys/wz/lib/esm/index.js' // es5 output
    }
  }
}
```

### Advanced

Though `walkWzFileAsync()` is easy to use, it is much more slower in browser than in Node.js. It is recommanded to use class API to do specific directory or image operation.

``` js
const { init, WzFile, WzMapleVersion, WzBinaryProperty, WzImage, WzDirectory, WzFileParseStatus, getErrorDescription } = require('@tybys/wz')

async function main () {
  // Must call init() first to initialize Webassembly
  // before calling other API in browser.
  // In nodejs it is just return Promise.resolve()
  await init()

  // Construct a WzFile object
  const wz = new WzFile('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS)

  const r = await wz.parseWzFile()
  if (r !== WzFileParseStatus.SUCCESS) {
    throw new Error(getErrorDescription(r))
  }

  // Access main directory
  /** @type {WzDirectory} */
  const mainDirectory = wz.wzDirectory // ! not null

  /** @type {WzImage | null} */
  const img = mainDirectory.at('Bgm50.img')
  if (img === null) throw new Error('404')

  // Parse the image before use it
  await img.parseImage()

  // Access image properties
  const props = img.wzProperties // getter returns Set<WzImageProperty>

  for (const prop of props) {
    if (prop instanceof WzBinaryProperty) {
      console.log(prop.fullPath)
      // do something
      // prop.saveToFile()
    }
  }
  wz.dispose()
}

main()
```
