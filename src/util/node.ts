import { tryGetRequireFunction } from '@tybys/native-require'
import { aesCreate } from './wz'

const _require = tryGetRequireFunction()

function throwError (): never {
  throw new Error('Node.js API is not supported')
}

export const fs: typeof import('fs') = (function () {
  try {
    return _require!('fs')
  } catch (_) {
    return {
      existsSync () { throwError() },
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
      // eslint-disable-next-line @typescript-eslint/prefer-includes
      sep: typeof navigator !== 'undefined' ? ((navigator.appVersion.indexOf('Win') !== -1) ? '\\' : '/') : '/',
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
    const platform = function (): 'win32' | 'linux' | 'darwin' | 'unknown' {
      if (window.navigator.userAgent.indexOf('Windows') !== -1) {
        return 'win32'
      }
      if (window.navigator.userAgent.indexOf('Linux') !== -1) {
        return 'linux'
      }
      if (window.navigator.userAgent.indexOf('Macintosh') !== -1) {
        return 'darwin'
      }
      return 'unknown'
    }
    return {
      EOL: window.navigator.userAgent.toLowerCase().indexOf('win') !== -1 ? '\r\n' : '\n',
      platform
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
      createCipheriv (algo: string, key: Uint8Array, _iv: null) {
        if (algo === 'aes-256-ecb') {
          return aesCreate(key)
        }
        throwError()
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

export const tybysWindowsFileVersionInfo: typeof import('@tybys/windows-file-version-info') = (function () {
  try {
    if (os.platform() !== 'win32') throwError()
    return _require!('@tybys/windows-file-version-info')
  } catch (_) {
    const FileVersionInfo = function (): void { throwError() }
    FileVersionInfo.getVersionInfo = function () {
      throwError()
    }
    return { FileVersionInfo }
  }
})()
