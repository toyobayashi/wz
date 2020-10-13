# node-wz

Incompletely port from [lastbattle/Harepacker-resurrected/MapleLib/WzLib](https://github.com/lastbattle/Harepacker-resurrected/tree/master/MapleLib/WzLib).

[API Documentation](./docs/api/index.md)

## Example

``` bash
npm install @tybys/wz
```

``` js
const path = require('path')
const {
  walkWzFile,
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
function saveSounds (wzFilePath, mapleVersion, dir) {
  let n = 0

  /**
   * @template {import('@tybys/wz').WzObject} T
   * @param {T} obj - wz object
   * @returns {boolean | undefined}
   */
  function callback (obj) {
    // obj is available only in this scope
    if (obj.objectType === WzObjectType.Property && obj instanceof WzBinaryProperty) {
      const relativePath = path.win32.relative(wzFilePath, obj.fullPath).replace(/\\/g, '/')
      const file = path.join(dir, path.extname(relativePath) === '' ? `${relativePath}.mp3` : relativePath)
      console.log(`Saving ${path.resolve(file)}`)
      obj.saveToFile(file)
      n++
    }
    return false // continue walking
  }

  walkWzFile(wzFilePath, mapleVersion, callback)

  console.log(`Total files: ${n}`)

  if (ErrorLogger.errorsPresent()) {
    ErrorLogger.saveToFile('WzError.log')
  }
}

saveSounds('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS, 'Sound')
```
