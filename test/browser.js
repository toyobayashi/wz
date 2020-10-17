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
      console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)
      // if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzBinaryProperty) {

      // }
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
          return true
        }
      }
    })
  })

})()