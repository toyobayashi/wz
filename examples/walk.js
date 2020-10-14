const { walkWzFile, walkWzFileAsync, WzMapleVersion, WzPropertyType, WzObjectType } = require('..')

let n = 0

// let _doNotUseMe

/**
 * @template {import('..').WzObject} T
 * @param {T} obj - wz object
 * @returns {boolean | undefined}
 */
function callback (obj) {
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

/**
 * @template {import('..').WzObject} T
 * @param {T} obj - wz object
 * @returns {boolean | undefined | Promise<boolean | undefined>}
 */
function callbackAsync (obj) {
  return Promise.resolve(callback(obj))
}

const wzFilePath = 'C:\\Nexon\\MapleStory\\Sound.wz'

n = 0
walkWzFile(wzFilePath, WzMapleVersion.BMS, callback)

n = 0
walkWzFileAsync(wzFilePath, WzMapleVersion.BMS, callbackAsync).then(() => {
  console.log('\nAsync done.')
})

console.log('\nSync done.\n') // output after walkWzFile()
