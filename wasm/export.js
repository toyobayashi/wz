exports.inflate = function (data, len) {
  var srclen = data.length >>> 0;
  var source = Module._malloc(srclen);
  if (!source) throw new Error('malloc failed');
  var memory = new Uint8Array(Module.HEAPU8.buffer, source, srclen);
  memory.set(data);

  var destlen = len >>> 0;
  var dest = Module._malloc(destlen);
  if (!dest) {
    Module._free(source);
    throw new Error('malloc failed');
  }
  var r = Module._wz_zlib_inflate(source, srclen, dest, destlen);
  Module._free(source);
  if (r === 0) {
    var ret = new Uint8Array(Module.HEAPU8.buffer, dest, destlen).slice();
    Module._free(dest);
    return ret;
  }
  Module._free(dest);
  throw new Error('Inflate failed');
}

exports.aesEnc = function (data, key) {
  if (key.length !== 32) {
    throw new Error('Invalid key');
  }

  var srclen = data.length >>> 0;
  var source = Module._malloc(srclen);
  if (!source) throw new Error('malloc failed');
  var srcMemory = new Uint8Array(Module.HEAPU8.buffer, source, srclen);
  srcMemory.set(data);

  var outLenPointer = Module._malloc(4);
  if (!source) {
    Module._free(source);
    throw new Error('malloc failed');
  }
  Module._wz_aes_ecb_encrypt(source, srclen, 0, 0, outLenPointer);
  
  var outLen = Module.HEAPU32[outLenPointer >> 2]
  var out = Module._malloc(outLen);
  if (!out) {
    Module._free(source);
    Module._free(outLenPointer);
    throw new Error('malloc failed');
  }
  var keyLen = key.length >>> 0;
  var keyPointer = Module._malloc(keyLen);
  if (!keyPointer) {
    Module._free(source);
    Module._free(outLenPointer);
    Module._free(out);
    throw new Error('malloc failed');
  }
  var keyMemory = new Uint8Array(Module.HEAPU8.buffer, keyPointer, keyLen);
  keyMemory.set(key);

  Module._wz_aes_ecb_encrypt(source, srclen, keyPointer, out, outLenPointer);

  var ret = new Uint8Array(Module.HEAPU8.buffer, out, outLen).slice();
  Module._free(source);
  Module._free(outLenPointer);
  Module._free(out);
  Module._free(keyPointer);
  return ret;
}
