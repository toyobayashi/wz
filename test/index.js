const { WzFile, WzMapleVersion, WzImage, WzBinaryProperty } = require('..')

// const wz = new WzFile('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS)
const wz = new WzFile('C:\\Users\\toyo\\game\\CMS\\冒险岛online\\Sound.wz', WzMapleVersion.BMS)

const out = {
  message: ''
}
const r = wz.parseWzFile(out)
console.log(out)
console.log(r)

const it = wz.wzDirectory.wzImages.values()
it.next()
it.next()
it.next()
it.next()
it.next()
it.next()
it.next()
it.next()
// it.next()
// it.next()
// it.next()
/** @type {WzImage} */
const first = it.next().value
first.parseImage()
console.log(first.name)
first.wzProperties.forEach(p => {
  if (p instanceof WzBinaryProperty) {
    p.saveToFile(__dirname + '\\' + p.name + '.mp3')
  }
})
// console.log(first.wzProperties)
// const imgs = wz.mainDir.imgs
// console.log(imgs)
// wz.mainDir.imgs.get('Bgm02.img').parse()
wz.dispose()
