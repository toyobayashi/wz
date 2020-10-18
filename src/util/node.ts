import { tryGetRequireFunction } from '@tybys/native-require'
import { mod } from './zlibwasm'

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

export const zlib: typeof import('zlib') = (function () {
  try {
    return _require!('zlib')
  } catch (_) {
    return null
  }
})()

export const crypto: typeof import('crypto') = (function () {
  try {
    return _require!('crypto')
  } catch (_) {
    return {
      createCipheriv (_a: 'aes-256-ecb', key: Uint8Array, _iv: null) {
        return {
          update (content: Uint8Array): Uint8Array {
            return mod.aesEnc(content, key)
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

export const Jimp: typeof import('jimp') = (function () {
  try {
    return _require!('jimp')
  } catch (_) {
    return null
  }
})()
