import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzBinaryReader } from '../util/WzBinaryReader'
import * as Jimp from 'jimp'
import * as zlib from 'zlib'
import { BinaryReader } from '@tybys/binreader'
import { Color } from '../util/Color'
import { ErrorLevel, ErrorLogger } from '../util/ErrorLogger'
import { NotImplementedError } from '../util/NotImplementedError'
import { _Buffer } from '../util/node'
import { wasminit } from '../util/wasminit'
import * as zlibwasm from '../util/zlibwasm'

/**
 * @public
 */
export class WzPngProperty extends WzExtended {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.PNG
  }

  public dispose (): void {
    if (this._disposed) return
    this.compressedImageBytes = null
    if (this.png != null) {
      this.png = null
    }
    this._disposed = true
  }

  public get wzValue (): Promise<Jimp | null> {
    return this.getImage(false)
  }

  public parent: WzObject | null = null

  public get name (): string {
    return 'PNG'
  }

  public width: number
  public height: number
  public format1: number
  public format2: number
  public offs: number
  private readonly wzReader: WzBinaryReader

  private compressedImageBytes: Uint8Array | null = null
  private png: Jimp | null = null
  private listWzUsed: boolean = false

  public constructor (reader: WzBinaryReader/* , parseNow: boolean = false */) {
    super()
    this.width = reader.readWzInt()
    this.height = reader.readWzInt()
    this.format1 = reader.readWzInt()
    this.format2 = reader.readUInt8()
    reader.pos += 4
    this.offs = reader.pos
    const len = reader.readInt32LE() - 1
    reader.pos += 1

    if (len > 0) {
      /* if (parseNow) {
        if (this.wzReader == null) {
          this.compressedImageBytes = reader.read(len)
        } else {
          this.compressedImageBytes = this.wzReader.read(len)
        }

        // this.parsePng()
      } else { */
      reader.pos += len
      /* } */
    }
    this.wzReader = reader

    Object.defineProperty(this, 'format', {
      configurable: true,
      enumerable: true,
      get: () => this.format1 + this.format2,
      set: (value: number) => {
        this.format1 = value
        this.format2 = 0
      }
    })
  }

  public setValue (_value: Uint8Array): void {
    throw new NotImplementedError('[WzPngProperty#setValue]')
  }

  public async getImage (saveInMemory: boolean = false): Promise<Jimp | null> {
    if (this.png == null) {
      const compressedImageBytes = this.getCompressedBytes(saveInMemory)
      this.png = await this.parsePng(compressedImageBytes)
    }
    if (!saveInMemory) {
      const png = this.png
      this.png = null
      return png
    }
    return this.png
  }

  public getCompressedBytes (saveInMemory: boolean = false): Uint8Array {
    if (this.compressedImageBytes == null) {
      const pos = this.wzReader.pos
      this.wzReader.pos = this.offs
      const len = this.wzReader.readInt32LE() - 1
      if (len <= 0) {
        // possibility an image written with the wrong wzIv
        throw new Error('The length of the image is negative. WzPngProperty.')
      }

      this.wzReader.pos += 1

      /* if (len > 0) */ this.compressedImageBytes = this.wzReader.read(len)
      this.wzReader.pos = pos
    }
    if (!saveInMemory) {
      // were removing the referance to compressedBytes, so a backup for the ret value is needed
      const returnBytes = this.compressedImageBytes
      this.compressedImageBytes = null
      return returnBytes
    }

    return this.compressedImageBytes
  }

  private async parsePng (compressedImageBytes: Uint8Array): Promise<Jimp | null> {
    const reader = new BinaryReader(compressedImageBytes)

    const header = reader.readUInt16LE()
    this.listWzUsed = header !== 0x9C78 && header !== 0xDA78 && header !== 0x0178 && header !== 0x5E78

    let data: Uint8Array
    if (!this.listWzUsed) {
      data = compressedImageBytes
    } else {
      reader.pos -= 2
      const dataStream: number[] = []
      let blocksize = 0
      const endOfPng = compressedImageBytes.length

      while (reader.pos < endOfPng) {
        blocksize = reader.readInt32LE()
        for (let i = 0; i < blocksize; i++) {
          dataStream.push(((reader.readUInt8() ^ this.parentImage!.reader.wzKey.at(i)) >>> 0) & 0xFF)
        }
      }
      data = new Uint8Array(dataStream)
    }
    reader.dispose()

    const format = this.format1 + this.format2
    switch (format) {
      case 1: {
        const uncompressedSize = this.width * this.height * 2
        const decBuf = await inflate(data, uncompressedSize)

        const decoded = WzPngProperty.getPixelDataBgra4444(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        // img.colorType(6)
        bgra8888(img, decoded, decoded.length)
        return img
      }
      case 2: {
        const uncompressedSize = this.width * this.height * 4
        const decBuf = await inflate(data, uncompressedSize)

        const img = new Jimp(this.width, this.height)
        bgra8888(img, decBuf, decBuf.length)
        return img
      }
      case 3: {
        const uncompressedSize = this.width * this.height * 4
        const decBuf = await inflate(data, uncompressedSize)

        const decoded = WzPngProperty.getPixelDataDXT3(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        bgra8888(img, decoded, this.width * this.height)
        return img
      }
      case 513: {
        const uncompressedSize = this.width * this.height * 2
        const decBuf = await inflate(data, uncompressedSize)

        const img = new Jimp(this.width, this.height)
        rgb565(img, decBuf, decBuf.length)
        return img
      }
      case 517: {
        const uncompressedSize: number = (parseInt as any)(this.width * this.height / 128)
        const decBuf = await inflate(data, uncompressedSize)

        const decoded = WzPngProperty.getPixelDataForm517(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        rgb565(img, decoded, decoded.length)
        return img
      }
      case 1026: {
        const uncompressedSize = this.width * this.height * 4
        const decBuf = await inflate(data, uncompressedSize)

        const decoded = WzPngProperty.getPixelDataDXT3(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        bgra8888(img, decoded, decoded.length)
        return img
      }
      case 2050: {
        const uncompressedSize = this.width * this.height
        const decBuf = await inflate(data, uncompressedSize)

        const decoded = WzPngProperty.getPixelDataDXT5(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        bgra8888(img, decoded, decoded.length)
        return img
      }
      default: {
        ErrorLogger.log(ErrorLevel.MissingFeature, `Unknown PNG format ${this.format1} ${this.format2}`)
        return null
      }
    }
  }

  private static getPixelDataBgra4444 (rawData: Uint8Array, width: number, height: number): Uint8Array {
    let b: number, g: number

    const uncompressedSize = width * height * 2
    const argb = new Uint8Array(uncompressedSize * 2)
    for (let i = 0; i < uncompressedSize; i++) {
      b = rawData[i] & 0x0F
      b |= (b << 4)

      argb[i * 2] = (b >>> 0) & 0xff

      g = rawData[i] & 0xF0
      g |= (g >> 4)

      argb[i * 2 + 1] = (g >>> 0) & 0xff
    }
    return argb
  }

  private static getPixelDataForm517 (rawData: Uint8Array, width: number, height: number): Uint8Array {
    const pixel = new Uint8Array(width * height * 2)
    let lineIndex = 0
    for (let j0 = 0, j1 = parseInt((height / 16) as any); j0 < j1; j0++) {
      let dstIndex = lineIndex
      for (let i0 = 0, i1 = parseInt((width / 16) as any); i0 < i1; i0++) {
        const idx = (i0 + j0 * i1) * 2
        const b0 = rawData[idx]
        const b1 = rawData[idx + 1]
        for (let k = 0; k < 16; k++) {
          pixel[dstIndex++] = b0
          pixel[dstIndex++] = b1
        }
      }

      for (let k = 1; k < 16; k++) {
        const src = new Uint8Array(pixel.buffer, pixel.byteOffset + lineIndex, width * 2)
        pixel.set(src, dstIndex)
        // pixel.copy(pixel, dstIndex, lineIndex, lineIndex + (width * 2))
        dstIndex += width * 2
      }

      lineIndex += width * 32
    }
    return pixel
  }

  private static getPixelDataDXT5 (rawData: Uint8Array, width: number, height: number): Uint8Array {
    const pixel = new Uint8Array(width * height * 4)

    const colorTable = [
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0)
    ]
    const colorIdxTable = Array(16).fill(0)
    const alphaTable = new Uint8Array(8)
    const alphaIdxTable = Array(16).fill(0)

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const off = x * 4 + y * width
        WzPngProperty.expandAlphaTableDXT5(alphaTable, rawData[off + 0], rawData[off + 1])
        WzPngProperty.expandAlphaIndexTableDXT5(alphaIdxTable, rawData, off + 2)
        const r = new BinaryReader(rawData)
        r.seek(off + 8)
        const u0 = r.readUInt16LE() // rawData.readUInt16LE(off + 8)
        const u1 = r.readUInt16LE() // rawData.readUInt16LE(off + 10)
        r.dispose()
        WzPngProperty.expandColorTable(colorTable, u0, u1)
        WzPngProperty.expandColorIndexTable(colorIdxTable, rawData, off + 12)

        for (let j = 0; j < 4; j++) {
          for (let i = 0; i < 4; i++) {
            WzPngProperty.setPixel(pixel,
              x + i,
              y + j,
              width,
              colorTable[colorIdxTable[j * 4 + i]],
              alphaTable[alphaIdxTable[j * 4 + i]])
          }
        }
      }
    }
    return pixel
  }

  private static expandAlphaTableDXT5 (alpha: Uint8Array, a0: number, a1: number): void {
    alpha[0] = a0
    alpha[1] = a1
    if (a0 > a1) {
      for (let i = 2; i < 8; i++) {
        alpha[i] = ((parseInt as any)(((8 - i) * a0 + (i - 1) * a1 + 3) / 7) >>> 0) & 0xff
      }
    } else {
      for (let i = 2; i < 6; i++) {
        alpha[i] = ((parseInt as any)(((6 - i) * a0 + (i - 1) * a1 + 2) / 5) >>> 0) & 0xff
      }
      alpha[6] = 0
      alpha[7] = 255
    }
  }

  private static expandAlphaIndexTableDXT5 (alphaIndex: number[], rawData: Uint8Array, offset: number): void {
    for (let i = 0; i < 16; i += 8, offset += 3) {
      const flags = rawData[offset] |
                    (rawData[offset + 1] << 8) |
                    (rawData[offset + 2] << 16)
      for (let j = 0; j < 8; j++) {
        const mask = 0x07 << (3 * j)
        alphaIndex[i + j] = (flags & mask) >> (3 * j)
      }
    }
  }

  private static getPixelDataDXT3 (rawData: Uint8Array, width: number, height: number): Uint8Array {
    const pixel = new Uint8Array(width * height * 4)

    const colorTable = [
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0)
    ]
    const colorIdxTable = Array(16).fill(0)
    const alphaTable = new Uint8Array(16)
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const off = x * 4 + y * width
        WzPngProperty.expandAlphaTableDXT3(alphaTable, rawData, off)
        const r = new BinaryReader(rawData)
        r.seek(off + 8)
        const u0 = r.readUInt16LE() // rawData.readUInt16LE(off + 8)
        const u1 = r.readUInt16LE() // rawData.readUInt16LE(off + 10)
        r.dispose()
        WzPngProperty.expandColorTable(colorTable, u0, u1)
        WzPngProperty.expandColorIndexTable(colorIdxTable, rawData, off + 12)

        for (let j = 0; j < 4; j++) {
          for (let i = 0; i < 4; i++) {
            WzPngProperty.setPixel(pixel,
              x + i,
              y + j,
              width,
              colorTable[colorIdxTable[j * 4 + i]],
              alphaTable[j * 4 + i])
          }
        }
      }
    }
    return pixel
  }

  private static expandAlphaTableDXT3 (alpha: Uint8Array, rawData: Uint8Array, offset: number): void {
    for (let i = 0; i < 16; i += 2, offset++) {
      alpha[i + 0] = (rawData[offset] & 0x0f) >>> 0
      alpha[i + 1] = ((rawData[offset] & 0xf0) >> 4) >>> 0
    }
    for (let i = 0; i < 16; i++) {
      alpha[i] = ((alpha[i] | (alpha[i] << 4)) >>> 0) & 0xff
    }
  }

  private static setPixel (pixelData: Uint8Array, x: number, y: number, width: number, color: Color, alpha: number): void {
    const offset = (y * width + x) * 4
    pixelData[offset + 0] = color.b
    pixelData[offset + 1] = color.g
    pixelData[offset + 2] = color.r
    pixelData[offset + 3] = (alpha >>> 0) & 0xff
  }

  private static expandColorTable (color: Color[], c0: number, c1: number): void {
    color[0] = rgb565ToColor(c0)
    color[1] = rgb565ToColor(c1)
    if (c0 > c1) {
      color[2] = Color.fromArgb(0xff,
        (parseInt as any)((color[0].r * 2 + color[1].r + 1) / 3),
        (parseInt as any)((color[0].g * 2 + color[1].g + 1) / 3),
        (parseInt as any)((color[0].b * 2 + color[1].b + 1) / 3))
      color[3] = Color.fromArgb(0xff,
        (parseInt as any)((color[0].r + color[1].r * 2 + 1) / 3),
        (parseInt as any)((color[0].g + color[1].g * 2 + 1) / 3),
        (parseInt as any)((color[0].b + color[1].b * 2 + 1) / 3))
    } else {
      color[2] = Color.fromArgb(0xff,
        (parseInt as any)((color[0].r + color[1].r) / 2),
        (parseInt as any)((color[0].g + color[1].g) / 2),
        (parseInt as any)((color[0].b + color[1].b) / 2))
      color[3] = Color.fromAc(0xff, Color.black)
    }
  }

  private static expandColorIndexTable (colorIndex: number[], rawData: Uint8Array, offset: number): void {
    for (let i = 0; i < 16; i += 4, offset++) {
      colorIndex[i + 0] = (rawData[offset] & 0x03)
      colorIndex[i + 1] = (rawData[offset] & 0x0c) >> 2
      colorIndex[i + 2] = (rawData[offset] & 0x30) >> 4
      colorIndex[i + 3] = (rawData[offset] & 0xc0) >> 6
    }
  }

  public getBitmap (): Promise<Jimp | null> {
    return this.getImage(false)
  }

  public async saveToFile (file: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      throw new NotImplementedError('Can not save to file in browser')
    }
    if (this.png != null) {
      await this.png.writeAsync(file)
      return true
    }
    const png = await this.getImage(false)
    if (png != null) {
      await png.writeAsync(file)
      return true
    }
    return false
  }
}

function inflate (data: Uint8Array, len: number): Promise<Uint8Array> {
  if (typeof window !== 'undefined') {
    return inflateWasm(data, len)
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const inflateStream = zlib.createInflate()
    const buf = _Buffer!.alloc(len)
    const chunks: Buffer[] = []
    inflateStream.once('error', reject)
    inflateStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    inflateStream.on('finish', () => {
      const chunk = _Buffer!.concat(chunks)
      chunk.copy(buf, 0, 0, Math.min(chunk.length, len))
      resolve(buf)
      inflateStream.close()
    })

    inflateStream.end(data)
  })
}

async function inflateWasm (data: Uint8Array, len: number): Promise<Uint8Array> {
  const mod = await wasminit(zlibwasm)
  const buf = mod.inflate(data, len)
  return buf
}

function rgb565ToColor (val: number): Color {
  const rgb565maskR = 0xf800
  const rgb565maskG = 0x07e0
  const rgb565maskB = 0x001f
  const r = (val & rgb565maskR) >> 11
  const g = (val & rgb565maskG) >> 5
  const b = (val & rgb565maskB)
  var c = Color.fromRgb(
    (r << 3) | (r >> 2),
    (g << 2) | (g >> 4),
    (b << 3) | (b >> 2))
  return c
}

function bgra8888 (img: Jimp, data: Uint8Array, length: number): void {
  let x = 0
  let y = 0
  const width = img.getWidth()
  for (let i = 0; i < length; i += 4) {
    img.setPixelColor(Jimp.rgbaToInt(data[i + 2], data[i + 1], data[i + 0], data[i + 3]), x, y)
    x++
    if (x >= width) { x = 0; y++ }
  }
}

function rgb565 (img: Jimp, data: Uint8Array, length: number): void {
  // rrrrrggg gggbbbbb
  let x = 0
  let y = 0
  const width = img.getWidth()
  const r = new BinaryReader(data)
  for (let i = 0; i < length; i += 2) {
    const ushort = r.readUInt16LE() // data.readUInt16LE(i)
    const c = rgb565ToColor(ushort)
    img.setPixelColor(Jimp.rgbaToInt(c.r, c.g, c.b, c.a), x, y)
    x++
    if (x >= width) { x = 0; y++ }
  }
  r.dispose()
}
