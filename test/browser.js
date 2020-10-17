/// <reference path="../dist/wz.d.ts" />

(function () {

  const type = [
    1,
    2,
    3,
    // 513,
    517,
    1026,
    2050
  ]

  const input = document.getElementById('file')

  input.addEventListener('change', async (e) => {
    console.log(e.target.files[0])
    const f = e.target.files[0]

    let n = 0
    await wz.walkWzFileAsync(f, wz.WzMapleVersion.GMS, async (obj) => {
      // if (n >= 10) return true
      // n++
      // console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)
      if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzBinaryProperty) {
        n++
        if (n !== 3) return false
        console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)

        const buf = (await obj.getBytes(false))
        const blob = new Blob([buf.buffer], { type: 'audio/mp3' })
        const src = URL.createObjectURL(blob)
        const audio = new Audio()
        audio.src = src
        audio.play()

        return true
      }
      if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzCanvasProperty) {
        console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)
        try {
          var format = obj.pngProperty.format1 + obj.pngProperty.format2
        } catch (error) {
          console.log(obj.fullPath)
          throw error
        }
        if (type.indexOf(format) !== -1) {
          console.log(`${obj.fullPath}`)
          console.log(`${format}`)
          const canvas = await obj.pngProperty.getImage()
          document.body.append(canvas._canvas)
          await obj.pngProperty.saveToFile('4.png')
          return true
        }
      }
    })
  })

})()