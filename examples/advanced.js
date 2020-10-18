const { init, WzFile, WzMapleVersion, WzBinaryProperty, WzImage, WzDirectory } = require('..')

async function main () {
  // Must call init() first to initialize Webassembly
  // before calling other API in browser.
  // In nodejs it is just return Promise.resolve()
  await init()

  // Construct a WzFile object
  const wz = new WzFile('C:\\Nexon\\MapleStory\\Sound.wz', WzMapleVersion.BMS)

  // Pass it to parseWzFile() to receive parse result
  const result = WzFile.createParseResult()
  const r = await wz.parseWzFile(/* out */ result, /* parse main directory only */ true)
  if (!r) {
    throw new Error(result.message)
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
