const path = require('path')
const { WzFile, WzMapleVersion, WzImage, WzBinaryProperty, WzCanvasProperty, WzPngProperty, walkWzFileAsync, WzObjectType, WzPropertyType } = require('..')

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

const type = [
  1,
  // 2,
  3,
  // 513,
  // 517,
  // 1026,
  // 2050
]
const filepath = process.argv[2]
const ver = process.argv[3] === undefined ? WzMapleVersion.BMS : (typeof WzMapleVersion[process.argv[3]] === 'number' ? WzMapleVersion[process.argv[3]] : Number(process.argv[3]))

async function main () {
  if (filepath === undefined || filepath === '') {
    throw new Error('Path is null')
  }
  // const wz = new WzFile(filepath, ver)
  // wz.parseWzFile({ message: '' })
  // const target = wz.wzDirectory.at('Obj').at('hoyoung.img')
  // target.parseImage()
  // const canvas = target.at('town').at('foothold').at('0').at('0')
  // await canvas.pngProperty.saveToFile('./test5.png')

  // const wz = new WzFile(filepath, ver)
  // wz.parseWzFile({ message: '' })
  // const target = wz.wzDirectory.at('WorldMap').at('WorldMap000.img')
  // target.parseImage()
  // const canvas = target.at('BaseImg').at('0')
  // await canvas.pngProperty.saveToFile('./test6.png')

  // console.log(canvas)
  let n = 0
  await walkWzFileAsync(filepath, ver, async (obj) => {
    // if (n > 50) return true
    // const type = obj.objectType === WzObjectType.Property ? WzPropertyType[obj.propertyType] : WzObjectType[obj.objectType]
    // let relativePath = path.win32.relative(filepath, obj.fullPath).replace(/\\/g, '/')
    // if (relativePath === '') {
    //   relativePath = '.'
    // }

    // if (obj.objectType === WzObjectType.Property && obj instanceof WzBinaryProperty) {
    //   console.log(n, type, relativePath)
    //   obj.saveToFile(path.join(/* __dirname,  */'Sound', path.extname(relativePath) === '' ? `${relativePath}.mp3` : relativePath))
    //   n++
    // }
    if (obj.objectType === WzObjectType.Property && obj instanceof WzCanvasProperty) {
      n++
      console.log(n, WzPropertyType[obj.propertyType], obj.fullPath)

      // const img = await obj.pngProperty.getImage(false)
      try {
        var format = obj.pngProperty.format1 + obj.pngProperty.format2
      } catch (error) {
        console.log(obj.fullPath)
        throw error
      }
      if (type.indexOf(format) !== -1) {
        console.log(`${obj.fullPath}`)
        console.log(`${format}`)
        const r = await obj.pngProperty.saveToFile(`./${format}.png`)
        return r
      }
      // console.log(img)
    }
    return false
  })
  console.log(`Total: ${n}`)
}

main()
