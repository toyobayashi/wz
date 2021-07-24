/// <reference path="../dist/wz.d.ts" />

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function (callback, type, quality) {
      var canvas = this;
      setTimeout(function () {
        var binStr = atob(canvas.toDataURL(type, quality).split(',')[1]);
        var len = binStr.length;
        var arr = new Uint8Array(len);
 
        for (var i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }
 
        callback(new Blob([arr], { type: type || 'image/png' }));
      });
    }
  })
}

(function () {

  var type = [
    1,
    2,
    3,
    // 513,
    517,
    1026,
    2050
  ];

  var input = document.getElementById('file');

  input.addEventListener('change', function (e) {
    console.log(e.target.files[0]);
    if (!e.target.files[0]) return;
    const f = e.target.files[0];

    let n = 0;
    wz.walkWzFileAsync(f, wz.WzMapleVersion.GMS, function (obj) {
      return new Promise(function (resolve, reject) {
        // if (n >= 10) return true
        // n++
        // console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)
        if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzBinaryProperty) {
          n++;
          if (n !== 9) return resolve(false);
          console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath);

          return resolve(obj.getBytes(false).then(function (buf) {
            const blob = new Blob([buf.buffer], { type: 'audio/mp3' });
            const src = URL.createObjectURL(blob);
            const audio = new Audio();
            audio.src = src;
            audio.play();

            return true;
          }));
        }
        if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzCanvasProperty) {
          console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath);
          try {
            var format = obj.pngProperty.format1 + obj.pngProperty.format2;
          } catch (error) {
            console.log(obj.fullPath);
            return reject(error);
          }
          if (type.indexOf(format) !== -1) {
            console.log(obj.fullPath)
            console.log(format)
            return resolve(obj.pngProperty.getImage().then(function (canvas) {
              document.body.appendChild(canvas._canvas)
              return obj.pngProperty.saveToFile('4.png')
            }).then(function () {
              return true
            }));
          }
        }
        resolve(false);
      });
    });
  });
})();
