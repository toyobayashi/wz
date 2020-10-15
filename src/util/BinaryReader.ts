import * as fs from 'fs'
import { IDisposable } from './IDisposable'

const methods = {
  readInt8: 1,
  readUInt8: 1,
  readInt16LE: 2,
  readUInt16LE: 2,
  readInt16BE: 2,
  readUInt16BE: 2,
  readInt32LE: 4,
  readUInt32LE: 4,
  readInt32BE: 4,
  readUInt32BE: 4,
  readBigInt64LE: 8,
  readBigUInt64LE: 8,
  readBigInt64BE: 8,
  readBigUInt64BE: 8,
  readFloatLE: 4,
  readFloatBE: 4,
  readDoubleLE: 8,
  readDoubleBE: 8
}

type MethodsReturnBigInt = 'readBigInt64LE' | 'readBigUInt64LE' | 'readBigInt64BE' | 'readBigUInt64BE'

const enum BinaryType {
  FILE,
  BUFFER
}

function readNumber<Reader extends BinaryReader> (reader: Reader, method: MethodsReturnBigInt): bigint
function readNumber<Reader extends BinaryReader> (reader: Reader, method: Exclude<keyof typeof methods, MethodsReturnBigInt>): number
function readNumber<Reader extends BinaryReader> (reader: Reader, method: keyof typeof methods): boolean | number | bigint {
  const buf = Buffer.alloc(methods[method])
  let readLength: number
  // @ts-expect-error
  if (reader._type === BinaryType.FILE) {
    // @ts-expect-error
    readLength = fs.readSync(reader._fd, buf, 0, methods[method], reader.pos)
  } else {
    // @ts-expect-error
    readLength = reader._buffer!.copy(buf, 0, reader.pos, reader.pos + methods[method])
  }
  reader.pos += readLength
  return buf[method](0)
}

/**
 * @public
 */
export class BinaryReader implements IDisposable {
  protected readonly _path: string
  protected readonly _size: number
  private readonly _fd: number
  private _buffer: Buffer | null
  private readonly _type: BinaryType
  public pos!: number
  private _opened: boolean

  public constructor (filePath: string | Buffer) {
    if (typeof filePath === 'string') {
      this._type = BinaryType.FILE
      this._size = fs.statSync(filePath).size
      this._path = filePath
      this._fd = fs.openSync(filePath, 'r')
      this._buffer = null
    } else if (Buffer.isBuffer(filePath)) {
      this._type = BinaryType.BUFFER
      this._size = filePath.length
      this._path = ''
      this._fd = 0
      this._buffer = filePath
    } else {
      throw new TypeError('[BinaryReader] Contructor parameter type error')
    }
    this._opened = true

    let pos = 0
    Object.defineProperty(this, 'pos', {
      configurable: true,
      enumerable: true,
      get: () => pos,
      set: (v: number) => {
        if (typeof v !== 'number' || Number.isNaN(v)) {
          throw new TypeError('Invalid position')
        }
        if (v < 0) {
          throw new RangeError(`Position out of range: ${v} < 0`)
        }
        if (v > this._size) {
          console.warn(`Position out of range: ${v} > ${this._size}, set position to the end`)
          pos = this._size
          return
        }
        pos = v
      }
    })
  }

  public seek (pos: number): void {
    this.pos = pos
  }

  public tell (): number {
    return this.pos
  }

  public close (): void {
    if (this._opened) {
      if (this._type === BinaryType.FILE) {
        fs.closeSync(this._fd)
      } else {
        this._buffer = null
      }
      this._opened = false
    }
  }

  public dispose (): void {
    this.close()
  }

  public read (len: number = 1): Buffer {
    if (this.pos + len > this._size) {
      len = this._size - this.pos
    }
    const buf = Buffer.alloc(len)
    let readLength: number
    if (this._type === BinaryType.FILE) {
      readLength = fs.readSync(this._fd, buf, 0, len, this.pos)
    } else {
      readLength = this._buffer!.copy(buf, 0, this.pos, this.pos + len)
    }
    this.pos += readLength
    return buf
  }

  public readToBuffer (buf: Buffer, bufStart: number = 0, len: number = 1): number {
    if (this.pos + len > this._size) {
      len = this._size - this.pos
    }
    let readLength: number
    if (this._type === BinaryType.FILE) {
      readLength = fs.readSync(this._fd, buf, bufStart, len, this.pos)
    } else {
      readLength = this._buffer!.copy(buf, bufStart, this.pos, this.pos + len)
    }
    this.pos += readLength
    return readLength
  }

  public readString (encoding: 'ascii' | 'utf8' = 'ascii', length: number = -1): string {
    if (length === -1) {
      let l = 0
      const buf = Buffer.alloc(1)
      do {
        let readLength: number
        if (this._type === BinaryType.FILE) {
          readLength = fs.readSync(this._fd, buf, 0, 1, this.pos + l)
        } else {
          readLength = this._buffer!.copy(buf, 0, this.pos + l, this.pos + l + 1)
        }
        // const readLength = fs.readSync(this._fd, buf, 0, 1, this.pos + l)
        if (readLength === 0) break
        l += readLength
      } while (buf[0] !== 0)
      const r = Buffer.alloc(l - 1)
      if (this._type === BinaryType.FILE) {
        fs.readSync(this._fd, r, 0, l - 1, this.pos)
      } else {
        this._buffer!.copy(r, 0, this.pos, this.pos + l - 1)
      }
      this.pos += l
      return r.toString(encoding)
    }
    return this.read(length).toString(encoding)
  }

  public readBoolean (): boolean {
    return this.readUInt8() !== 0
  }

  public readInt8 (): number {
    return readNumber(this, 'readInt8')
  }

  public readUInt8 (): number {
    return readNumber(this, 'readUInt8')
  }

  public readInt16LE (): number {
    return readNumber(this, 'readInt16LE')
  }

  public readUInt16LE (): number {
    return readNumber(this, 'readUInt16LE')
  }

  public readInt16BE (): number {
    return readNumber(this, 'readInt16BE')
  }

  public readUInt16BE (): number {
    return readNumber(this, 'readUInt16BE')
  }

  public readInt32LE (): number {
    return readNumber(this, 'readInt32LE')
  }

  public readUInt32LE (): number {
    return readNumber(this, 'readUInt32LE')
  }

  public readInt32BE (): number {
    return readNumber(this, 'readInt32BE')
  }

  public readUInt32BE (): number {
    return readNumber(this, 'readUInt32BE')
  }

  public readBigInt64LE (): bigint {
    return readNumber(this, 'readBigInt64LE')
  }

  public readBigUInt64LE (): bigint {
    return readNumber(this, 'readBigUInt64LE')
  }

  public readBigInt64BE (): bigint {
    return readNumber(this, 'readBigInt64BE')
  }

  public readBigUInt64BE (): bigint {
    return readNumber(this, 'readBigUInt64BE')
  }

  public readFloatLE (): number {
    return readNumber(this, 'readFloatLE')
  }

  public readFloatBE (): number {
    return readNumber(this, 'readFloatBE')
  }

  public readDoubleLE (): number {
    return readNumber(this, 'readDoubleLE')
  }

  public readDoubleBE (): number {
    return readNumber(this, 'readDoubleBE')
  }
}
