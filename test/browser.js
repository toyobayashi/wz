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
  var mapleVersion = wz.WzMapleVersion.GMS;

  input.addEventListener('change', function (e) {
    console.log(e.target.files[0]);
    if (!e.target.files[0]) return;
    var f = e.target.files[0];

    if (f.name.indexOf('.img') !== -1) {
      wz.init().then(function () {
        var image = wz.WzImage.createFromFile(f, mapleVersion);
        image.parseImage().then(function (parsed) {
          if (parsed) {
            console.log('parsed');
          }
        });
      });
      return;
    }

    var n = 0;
    wz.walkWzFileAsync(f, mapleVersion, function (obj) {
      return new Promise(function (resolve, reject) {
        // if (n >= 10) return true
        // n++
        // console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath)
        if (obj.objectType === wz.WzObjectType.Property && obj instanceof wz.WzBinaryProperty) {
          n++;
          if (n !== 9) return resolve(false);
          console.log(n, wz.WzPropertyType[obj.propertyType], obj.fullPath);

          return resolve(obj.getBytes(false).then(function (buf) {
            var blob = new Blob([buf.buffer], { type: 'audio/mp3' });
            var src = URL.createObjectURL(blob);
            var audio = new Audio();
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
