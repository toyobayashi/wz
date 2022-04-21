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
int wz_aes_ecb_encrypt(const uint8_t* data,
                       size_t data_len,
                       const uint8_t* key,
                       uint8_t* out,
                       size_t* out_len) {
  if (data == NULL || out_len == NULL) {
    return 1;
  }

  uint8_t* data_buf = NULL;

  size_t padding = data_len % 16;
  size_t encrypt_len = 0;
  if (padding != 0) {
    padding = 16 - padding;
    encrypt_len = data_len + padding;
    if (out == NULL) {
      *out_len = encrypt_len;
      return 0;
    }
    if (key == NULL) return 2;
    data_buf = (uint8_t*) malloc(encrypt_len);  // NOLINT
    memcpy(data_buf, data, data_len);
    memset(data_buf + data_len, padding, padding);
  } else {
    encrypt_len = data_len;
    if (out == NULL) {
      *out_len = encrypt_len;
      return 0;
    }
    if (key == NULL) return 2;
    data_buf = (uint8_t*) malloc(encrypt_len);  // NOLINT=
    memcpy(data_buf, data, data_len);
  }

  AES_KEY k;
  AES_set_encrypt_key(key, 256, &k);
  AES_ecb_encrypt(data_buf, out, &k, AES_ENCRYPT);

  free(data_buf);

  return 0;
}
