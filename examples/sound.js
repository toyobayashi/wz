const { walkWzFileAsync, WzMapleVersion, WzObjectType, WzBinaryProperty, ErrorLogger } = require('..')
const path = require('path')

/**
 * @param {string} wzFilePath - WZ file path
 * @param {WzMapleVersion} mapleVersion - MapleStory version
 * @param {string} dir - Output directory path
 */
async function saveSounds (wzFilePath, mapleVersion, dir) {
  let n = 0

  // let _doNotUseMe

  /**
   * @template {import('..').WzObject} T
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

  walkWzFileAsync(wzFilePath, mapleVersion, callback)

  console.log(`Total files: ${n}`)

  if (ErrorLogger.errorsPresent()) {
    ErrorLogger.saveToFile('WzError.log')
  }
}

saveSounds('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS, 'Sound')
