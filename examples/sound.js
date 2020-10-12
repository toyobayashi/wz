const { walkWzFile, WzMapleVersion, WzObjectType, WzBinaryProperty, ErrorLogger } = require('..')
const path = require('path')

/**
 * @param {string} dir - Directory path
 */
function saveSounds (wzFilePath, dir) {
  let n = 0

  /**
   * @template {import('..').WzObject} T
   * @param {T} obj - wz object
   * @returns {boolean | undefined}
   */
  function callback (obj) {
    if (obj.objectType === WzObjectType.Property && obj instanceof WzBinaryProperty) {
      const relativePath = path.win32.relative(wzFilePath, obj.fullPath).replace(/\\/g, '/')
      const file = path.join(dir, path.extname(relativePath) === '' ? `${relativePath}.mp3` : relativePath)
      console.log(`Saving ${path.resolve(file)}`)
      obj.saveToFile(file)
      n++
    }
    return false
  }

  walkWzFile(wzFilePath, WzMapleVersion.GMS, callback)

  console.log(`Total files: ${n}`)

  if (ErrorLogger.errorsPresent()) {
    ErrorLogger.saveToFile('WzError.log')
  }
}

saveSounds('C:\\Nexon\\MapleRoyals\\Sound.wz', 'Sound')
