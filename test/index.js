const path = require('path')
const { WzFile, WzMapleVersion, WzImage, WzBinaryProperty, WzCanvasProperty, WzPngProperty, walkWzFileAsync, WzObjectType } = require('..')

// const wz = new WzFile('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS)
// // const wz = new WzFile('C:\\Users\\toyo\\game\\CMS\\冒险岛online\\Sound.wz', WzMapleVersion.BMS)
// // const wz = new WzFile('C:\\Users\\toyo\\game\\MapleRoyals800x600\\Sound.wz', WzMapleVersion.GMS)

// const out = {
//   message: ''
// }
// const r = wz.parseWzFile(out)
// console.log(out)
// console.log(r)

// const it = wz.wzDirectory.wzImages.values()
// it.next()
// it.next()
// it.next()
// it.next()
// it.next()
// it.next()
// it.next()
// it.next()
// // it.next()
// // it.next()
// // it.next()
// /** @type {WzImage} */
// const first = it.next().value
// first.parseImage()
// console.log(first.name)
// first.wzProperties.forEach(p => {
//   if (p instanceof WzBinaryProperty) {
//     const filename = path.extname(p.name) === '' ? `${p.name}.mp3` : p.name
//     p.saveToFile(path.join(__dirname, filename))
//   }
// })

// wz.dispose()

// async function main () {
//   const wz2 = new WzFile('C:\\Nexon\\MapleStory\\Map.wz', WzMapleVersion.BMS)
//   const out2 = {
//     message: ''
//   }
//   const r2 = wz2.parseWzFile(out2)
//   console.log(out2)
//   console.log(r2)

//   /** @type {WzImage} */
//   const GWorldMap = wz2.at('WorldMap').at('GWorldMap.img')
//   GWorldMap.parseImage()
//   /** @type {WzCanvasProperty} */
//   const canvas = GWorldMap.at('BaseImg').at('0')
//   await canvas.pngProperty.getImage(false)
//   await canvas.pngProperty.saveToFile('./test2.png')
//   console.log(canvas)

//   wz2.dispose()
// }

const type = [3, 513, 1026, 2050]
const path = process.argv[2]
const ver = process.argv[3] === undefined ? WzMapleVersion.BMS : process.argv[3]

async function main () {
  if (path === undefined || path === '') {
    throw new Error('Path is null')
  }
  let n = 0
  await walkWzFileAsync(path, ver, async (obj) => {
    // if (n > 10000) return true
    if (obj.objectType === WzObjectType.Property && obj instanceof WzCanvasProperty) {
      n++
      console.log(n)

      // const img = await obj.pngProperty.getImage(false)
      const format = obj.pngProperty.format1 + obj.pngProperty.format2
      if (type.indexOf(format) !== -1) {
        console.log(`${obj.fullPath}`)
        console.log(`${format}`)
        const r = await obj.pngProperty.saveToFile('./test3.png')
        return r
      }
      // console.log(img)
    }
    return false
  })
  console.log(`Total: ${n}`)
}

main()
