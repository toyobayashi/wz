exports.inflate = function (data, len) {
  var srclen = data.length >>> 0;
  var source = Module._malloc(srclen);
  if (!source) throw new Error('malloc failed');
  Module.HEAPU8.set(data, source);

  var destlen = len >>> 0;
  var dest = Module._malloc(destlen);
  if (!dest) {
    Module._free(source);
    throw new Error('malloc failed');
  }
  var r = Module._wz_zlib_inflate(source, srclen, dest, destlen);
  Module._free(source);
  if (r === 0) {
    var ret = Module.HEAPU8.slice(dest, dest + destlen);
    Module._free(dest);
    return ret;
  }
  Module._free(dest);
  throw new Error('Inflate failed');
}

function Cipher (k) {
  this.k = k;
  this.remain = new Uint8Array(0);
  this.autoPadding = true;
}

Cipher.prototype.setAutoPadding = function (autoPadding) {
  this.autoPadding = autoPadding;
  return this;
};

Cipher.prototype.destroy = function () {
  Module._wz_aes_ecb_destroy_key(this.k);
  return this;
};

Cipher.prototype.update = function (data) {
  var remain = new Uint8Array(this.remain.length + data.length);
  remain.set(this.remain, 0);
  remain.set(data, this.remain.length);

  var srclen = remain.length;
  var source = Module._malloc(srclen);
  if (!source) throw new Error('malloc failed');
  Module.HEAPU8.set(remain, source);
  
  var out = Module._malloc(16);
  if (!out) {
    Module._free(source);
    throw new Error('malloc failed');
  }

  var ret = [];
  for (var i = 0; i < remain.length; i += 16) {
    var left = remain.length - i;
    if (left < 16) {
      this.remain = remain.slice(i);
      break;
    } else {
      Module._wz_aes_ecb_encrypt(source + i, out, this.k);
      ret.push(Module.HEAPU8.slice(out, out + 16));
    }
  }

  var r = new Uint8Array(16 * ret.length);
  for (var i = 0; i < ret.length; ++i) {
    r.set(ret[i], i * 16);
  }

  Module._free(out);
  Module._free(source);
  
  return r;
};

Cipher.prototype.final = function () {
  if (this.remain.length === 0) {
    return new Uint8Array([
      159,  59, 117,  4, 146, 111,
      139, 211, 110, 49,  24, 233,
        3, 164, 205, 74
    ]);
  }

  if (!this.autoPadding && ((this.remain.length % 16) !== 0)) {
    throw new Error('wrong final block length')
  }

  var data = new Uint8Array(16);
  data.set(this.remain);
  var pad = 16 - this.remain.length;
  for (var i = this.remain.length; i < 16; ++i) {
    data[i] = pad;
  }
  var source = Module._malloc(16);
  if (!source) throw new Error('malloc failed');
  Module.HEAPU8.set(data, source);
  
  var out = Module._malloc(16);
  if (!out) {
    Module._free(source);
    throw new Error('malloc failed');
  }
  Module._wz_aes_ecb_encrypt(source, out, this.k);
  var ret = Module.HEAPU8.slice(out, out + 16);
  Module._free(out);
  Module._free(source);
  return ret;
}

exports.aesCreate = function (key) {
  var keyLen = key.length;
  if (keyLen !== 32) {
    throw new Error('Invalid key');
  }
  var keyPointer = Module._malloc(keyLen);
  if (!keyPointer) {
    throw new Error('malloc failed');
  }
  Module.HEAPU8.set(key, keyPointer);
  var k = Module._wz_aes_ecb_create_key(keyPointer);
  Module._free(keyPointer);
  return new Cipher(k);
}
