import { tryGetRequireFunction } from '@tybys/native-require'

import { algo, mode, pad, lib } from 'crypto-js'

const _require = tryGetRequireFunction()

function throwError (): never {
  throw new Error('Node.js API is not supported')
}

export const fs: typeof import('fs') = (function () {
  try {
    return _require!('fs')
  } catch (_) {
    return {
      mkdirSync () { throwError() },
      writeFileSync () { throwError() },
      openSync () { throwError() },
      writeSync () { throwError() },
      closeSync () { throwError() }
    }
  }
})()

export const path: typeof import('path') = (function () {
  try {
    return _require!('path')
  } catch (_) {
    return {
      dirname () { throwError() },
      join () { throwError() }
    }
  }
})()

export const _Buffer: null | typeof Buffer = (function () {
  try {
    return _require!('buffer').Buffer
  } catch (_) {
    return null
  }
})()

export const os: typeof import('os') = (function () {
  try {
    return _require!('os')
  } catch (_) {
    return {
      // eslint-disable-next-line @typescript-eslint/prefer-includes
      EOL: window.navigator.userAgent.toLowerCase().indexOf('win') !== -1 ? '\r\n' : '\n'
    }
  }
})()

export const crypto: typeof import('crypto') = (function () {
  try {
    return _require!('crypto')
  } catch (_) {
    const wordArrayToUint8Array = (wordArray: lib.WordArray): Uint8Array => {
      var words = wordArray.words
      var sigBytes = wordArray.sigBytes
      var u8 = new Uint8Array(sigBytes)
      for (var i = 0; i < sigBytes; i++) {
        var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
        u8[i] = byte
      }
      return u8
    }

    const uint8ArrayToWordArray = (u8arr: Uint8Array): lib.WordArray => {
      var len = u8arr.length
      var words: number[] = []
      for (var i = 0; i < len; i++) {
        words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8)
      }
      return lib.WordArray.create(words, len)
    }
    return {
      createCipheriv (_a: 'aes-256-ecb', key: Uint8Array, _iv: null) {
        const kw = uint8ArrayToWordArray(key)
        const cipher = algo.AES.createEncryptor(kw, {
          mode: mode.ECB,
          padding: pad.Pkcs7
        })
        cipher.keySize = 8
        return {
          update (content: Uint8Array): Uint8Array {
            const wordArray = cipher.process(uint8ArrayToWordArray(content))
            return wordArrayToUint8Array(wordArray)
          },
          setAutoPadding () {}
        }
      }
    } as any
  }
})()

export const asciiTextDecoder: TextDecoder = (function () {
  try {
    return new TextDecoder('ascii')
  } catch (_) {
    return {
      decode (buf: Uint8Array) {
        return _Buffer!.from(buf).toString('ascii')
      }
    } as any
  }
})()

export const utf16leTextDecoder: TextDecoder = (function () {
  try {
    return new TextDecoder('utf-16le')
  } catch (_) {
    return {
      decode (buf: Uint8Array) {
        return _Buffer!.from(buf).toString('utf16le')
      }
    } as any
  }
})()
