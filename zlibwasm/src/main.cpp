#include <cstring>
#include <cstddef>
#include "zlib.h"

#include "emscripten/bind.h"
#include "emscripten/val.h"

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

EMSCRIPTEN_BINDINGS(zlibwasm) {
  emscripten::function("inflate", js_inflate);
}
