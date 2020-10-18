const { walkWzFileAsync, WzMapleVersion, WzPropertyType, WzObjectType } = require('..')

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
  if (n > 5) return true
  if (obj.objectType === WzObjectType.Image) {
    console.log(`Image     \t ${obj.fullPath}`)
    n++
  } else if (obj.objectType === WzObjectType.Directory) {
    console.log(`Directory \t ${obj.fullPath}`)
    n++
  } else if (obj.objectType === WzObjectType.Property) {
    console.log(`${WzPropertyType[obj.propertyType]}    \t ${obj.fullPath}`)
    n++
  }
  return false
}

const wzFilePath = 'C:\\Nexon\\MapleStory\\Sound.wz'

walkWzFileAsync(wzFilePath, WzMapleVersion.BMS, callback).then(() => {
  console.log('\nDone.')
})
