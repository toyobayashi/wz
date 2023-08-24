#include <stddef.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <emscripten.h>
#include "zlib.h"
#include "openssl/aes.h"

EMSCRIPTEN_KEEPALIVE
int wz_zlib_inflate(uint8_t *source,
                    size_t srclen,
                    uint8_t *dest,
                    size_t destlen) {
  z_stream infstream;
  infstream.zalloc = Z_NULL;
  infstream.zfree = Z_NULL;
  infstream.opaque = Z_NULL;
  infstream.avail_in = (uInt) srclen;  // size of input
  infstream.next_in = (Bytef*) source;  // input char array NOLINT
  infstream.avail_out = (uInt) destlen;  // size of output
  infstream.next_out = (Bytef*) dest;  // output char array NOLINT

  inflateInit(&infstream);
  int r = inflate(&infstream, Z_NO_FLUSH);
  inflateEnd(&infstream);
  return r;
}

EMSCRIPTEN_KEEPALIVE
AES_KEY* wz_aes_ecb_create_key(const uint8_t* key) {
  if (key == NULL) return NULL;
  AES_KEY* k = (AES_KEY*) malloc(sizeof(AES_KEY));
  if (k == NULL) return NULL;
  int r = AES_set_encrypt_key(key, 256, k);
  if (r != 0) {
    free(k);
    return NULL;
  }
  return k;
}

EMSCRIPTEN_KEEPALIVE
void wz_aes_ecb_destroy_key(AES_KEY* k) {
  free(k);
}

EMSCRIPTEN_KEEPALIVE
void wz_aes_ecb_encrypt(const uint8_t* in,
                       uint8_t* out,
                       const AES_KEY* k) {
  AES_ecb_encrypt(in, out, k, AES_ENCRYPT);
}
