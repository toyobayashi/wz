#include <cstring>
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>
#include "zlib.h"
#include "openssl/aes.h"

#include <emscripten/bind.h>
#include <emscripten/val.h>

int inf(unsigned char *source, size_t srclen, unsigned char *dest, size_t destlen) {
  z_stream infstream;
  infstream.zalloc = Z_NULL;
  infstream.zfree = Z_NULL;
  infstream.opaque = Z_NULL;
  infstream.avail_in = (uInt)(srclen); // size of input
  infstream.next_in = (Bytef *)source; // input char array
  infstream.avail_out = (uInt)(destlen); // size of output
  infstream.next_out = (Bytef *)dest; // output char array

  inflateInit(&infstream);
  int r = inflate(&infstream, Z_NO_FLUSH);
  inflateEnd(&infstream);
  return r;
}

emscripten::val js_inflate(emscripten::val u8arr, emscripten::val len) {
  int srclen = u8arr["length"].as<int>();
  unsigned char* src = new unsigned char[srclen];
  memset(src, 0, srclen);
  for (int i = 0; i < srclen; i++) {
    *(src + i) = u8arr[i].as<unsigned char>();
  }
  
  int dstlen = len.as<int>();
  unsigned char* dst = new unsigned char[dstlen];
  memset(dst, 0, dstlen);

  int r = inf(src, srclen, dst, dstlen);
  if (r == 0) {
    emscripten::val dstu8arr = emscripten::val::global("Uint8Array").new_(len);
    for (int i = 0; i < dstlen; i++) {
      dstu8arr.set(emscripten::val(i), emscripten::val(dst[i]));
    }

    delete[] src;
    delete[] dst;

    return dstu8arr;
  } else {
    delete[] src;
    delete[] dst;
    emscripten::val::global("Error").new_(emscripten::val("Inflate failed")).throw_();
    return emscripten::val::undefined();
  }
}

static size_t pkcs7cut(uint8_t *p, size_t plen) {
  uint8_t last = p[plen - 1];
  if (last > 0 && last <= 16) {
    for (size_t x = 2; x <= last; x++) {
      if (p[plen - x] != last) {
        return plen;
      }
    }
    return plen - last;
  }

  return plen;
}

std::vector<uint8_t> enc(const std::vector<uint8_t>& data,
                         const std::vector<uint8_t>& key) {
  if (key.size() != 32) {
    throw std::runtime_error("Invalid key");
  }

  size_t dataLength = data.size();
  const uint8_t* strBuf = (const uint8_t*) data.data();

  uint8_t* dataBuf = nullptr;

  size_t padding = dataLength % 16;
  size_t encryptLength = 0;
  if (padding != 0) {
      padding = 16 - padding;
      encryptLength = dataLength + padding;
      dataBuf = new uint8_t[encryptLength];
      memcpy(dataBuf, strBuf, dataLength);
      memset(dataBuf + dataLength, padding, padding);
  } else {
      encryptLength = dataLength;
      dataBuf = new uint8_t[dataLength];
      memcpy(dataBuf, strBuf, dataLength);
  }

  AES_KEY k;
  AES_set_encrypt_key(key.data(), 256, &k);

  std::vector<uint8_t> out(encryptLength);

  AES_ecb_encrypt(dataBuf, out.data(), &k, AES_ENCRYPT);

  delete[] dataBuf;
  dataBuf = nullptr;

  return out;
}

emscripten::val js_aes_256_ecb(emscripten::val u8arr, emscripten::val key) {
  int srclen = u8arr["length"].as<int>();
  unsigned char* src = new unsigned char[srclen];
  memset(src, 0, srclen);
  for (int i = 0; i < srclen; i++) {
    *(src + i) = u8arr[i].as<unsigned char>();
  }

  int keylen = key["length"].as<int>();
  unsigned char* k = new unsigned char[keylen];
  memset(k, 0, keylen);
  for (int i = 0; i < keylen; i++) {
    *(k + i) = key[i].as<unsigned char>();
  }

  std::vector<uint8_t> result = enc(std::vector<uint8_t>(src, src + srclen), std::vector<uint8_t>(k, k + keylen));
  delete[] src;
  delete[] k;

  auto l = result.size();
  emscripten::val ret = emscripten::val::global("Uint8Array").new_(l);
  for (int i = 0; i < l; i++) {
    ret.set(emscripten::val(i), emscripten::val(result[i]));
  }

  return ret;
}

EMSCRIPTEN_BINDINGS(wz) {
  emscripten::function("inflate", js_inflate);
  emscripten::function("aesEnc", js_aes_256_ecb);
}
