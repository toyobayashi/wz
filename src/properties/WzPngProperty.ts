import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzBinaryReader } from '../util/WzBinaryReader'
import * as Jimp from 'jimp'
import * as zlib from 'zlib'
import { BinaryReader } from '../util/BinaryReader'
import { Transform } from 'stream'
import { NotImplementedError } from '../util/NotImplementedError'
import { Color } from '../util/Color'

/**
 * @public
 */
export class WzPngProperty extends WzExtended {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.PNG
  }

  public dispose (): void {
    this.compressedImageBytes = null
    if (this.png != null) {
      this.png = null
    }
  }

  public get wzValue (): Promise<Jimp> {
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

  private compressedImageBytes: Buffer | null = null
  public png: Jimp | null = null
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

  public setValue (value: Buffer): void {
    this.compressedImageBytes = value
  }

  public async getImage (saveInMemory: boolean = false): Promise<Jimp> {
    if (this.png == null) {
      this.compressedImageBytes = this.getCompressedBytes(saveInMemory)
      await this.parsePng()
    }
    return this.png as Jimp
  }

  public getCompressedBytes (saveInMemory: boolean = false): Buffer {
    if (this.compressedImageBytes == null) {
      const pos = this.wzReader.pos
      this.wzReader.pos = this.offs
      const len = this.wzReader.readInt32LE() - 1
      if (len <= 0) {
        // possibility an image written with the wrong wzIv
        throw new Error('The length of the image is negative. WzPngProperty.')
      }

      this.wzReader.pos += 1

      if (len > 0) this.compressedImageBytes = this.wzReader.read(len)
      this.wzReader.pos = pos

      if (!saveInMemory) {
        // were removing the referance to compressedBytes, so a backup for the ret value is needed
        const returnBytes = this.compressedImageBytes as Buffer
        this.compressedImageBytes = null
        return returnBytes
      }
    }
    return this.compressedImageBytes as Buffer
  }

  private async parsePng (): Promise<void> {
    const reader = new BinaryReader(this.compressedImageBytes!)

    const header = reader.readUInt16LE()
    this.listWzUsed = header !== 0x9C78 && header !== 0xDA78 && header !== 0x0178 && header !== 0x5E78

    let data: Buffer
    if (!this.listWzUsed) {
      data = this.compressedImageBytes!
    } else {
      reader.pos -= 2
      const dataStream: number[] = []
      let blocksize = 0
      const endOfPng = this.compressedImageBytes!.length

      while (reader.pos < endOfPng) {
        blocksize = reader.readInt32LE()
        for (let i = 0; i < blocksize; i++) {
          dataStream.push(((reader.readUInt8() ^ this.parentImage!.reader.wzKey.at(i)) >>> 0) & 0xFF)
        }
      }
      data = Buffer.from(dataStream)
    }
    reader.dispose()

    const format = this.format1 + this.format2
    switch (format) {
      case 1: {
        const inflateStream = zlib.createInflate()
        const uncompressedSize = this.width * this.height * 2
        await writeAsync(inflateStream, data)
        const decBuf: Buffer = inflateStream.read(uncompressedSize)
        inflateStream.close()

        const decoded = WzPngProperty.getPixelDataBgra4444(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        // img.colorType(6)
        bgra8888(img, decoded)
        this.png = img
        break
      }
      case 2: {
        const inflateStream = zlib.createInflate()
        const uncompressedSize = this.width * this.height * 4
        await writeAsync(inflateStream, data)
        const decBuf = inflateStream.read(uncompressedSize)
        inflateStream.close()

        const img = new Jimp(this.width, this.height)
        bgra8888(img, decBuf)
        this.png = img
        break
      }
      case 3: {
        const inflateStream = zlib.createInflate()
        const uncompressedSize = this.width * this.height * 4
        await writeAsync(inflateStream, data)
        const decBuf = inflateStream.read(uncompressedSize)
        inflateStream.close()

        const decoded = WzPngProperty.getPixelDataDXT3(decBuf, this.width, this.height)
        const img = new Jimp(this.width, this.height)
        bgra8888(img, decoded)
        this.png = img
        break
      }
      default: {
        throw new NotImplementedError(`PNG format: ${format}.`)
      }
    }
  }

  private static rgb565ToColor (val: number): Color {
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

  private static getPixelDataBgra4444 (rawData: Buffer, width: number, height: number): Buffer {
    let b: number, g: number

    const uncompressedSize = width * height * 2
    const argb = Buffer.alloc(uncompressedSize * 2)
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

  private static getPixelDataDXT3 (rawData: Buffer, width: number, height: number): Buffer {
    const pixel = Buffer.alloc(width * height * 4)

    const colorTable = [
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0),
      Color.fromRgb(0, 0, 0)
    ]
    const colorIdxTable = Array(16).fill(0)
    const alphaTable = Buffer.alloc(16)
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const off = x * 4 + y * width
        WzPngProperty.expandAlphaTableDXT3(alphaTable, rawData, off)
        const u0 = rawData.readUInt16LE(off + 8)
        const u1 = rawData.readUInt16LE(off + 10)
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

  private static expandAlphaTableDXT3 (alpha: Buffer, rawData: Buffer, offset: number): void {
    for (let i = 0; i < 16; i += 2, offset++) {
      alpha[i + 0] = (rawData[offset] & 0x0f) >>> 0
      alpha[i + 1] = ((rawData[offset] & 0xf0) >> 4) >>> 0
    }
    for (let i = 0; i < 16; i++) {
      alpha[i] = ((alpha[i] | (alpha[i] << 4)) >>> 0) & 0xff
    }
  }

  private static setPixel (pixelData: Buffer, x: number, y: number, width: number, color: Color, alpha: number): void {
    const offset = (y * width + x) * 4
    pixelData[offset + 0] = color.b
    pixelData[offset + 1] = color.g
    pixelData[offset + 2] = color.r
    pixelData[offset + 3] = (alpha >>> 0) & 0xff
  }

  private static expandColorTable (color: Color[], c0: number, c1: number): void {
    color[0] = WzPngProperty.rgb565ToColor(c0)
    color[1] = WzPngProperty.rgb565ToColor(c1)
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

  private static expandColorIndexTable (colorIndex: number[], rawData: Buffer, offset: number): void {
    for (let i = 0; i < 16; i += 4, offset++) {
      colorIndex[i + 0] = (rawData[offset] & 0x03)
      colorIndex[i + 1] = (rawData[offset] & 0x0c) >> 2
      colorIndex[i + 2] = (rawData[offset] & 0x30) >> 4
      colorIndex[i + 3] = (rawData[offset] & 0xc0) >> 6
    }
  }

  public getBitmap (): Promise<Jimp> {
    return this.getImage(false)
  }

  public async saveToFile (file: string): Promise<boolean> {
    if (this.png != null) {
      await this.png.writeAsync(file)
      return true
    }
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
function writeAsync (stream: Transform, data: Buffer): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const r = stream.write(data, 'binary', (err) => {
      if (err != null) {
        reject(err)
      } else {
        if (r) {
          resolve()
        }
      }
    })
    if (!r) {
      stream.once('drain', () => {
        resolve()
      })
    }
  })
}

function bgra8888 (img: Jimp, data: Buffer): void {
  let x = 0
  let y = 0
  const width = img.getWidth()
  for (let i = 0; i < data.length; i += 4) {
    img.setPixelColor(Jimp.rgbaToInt(data[i + 2], data[i + 1], data[i + 0], data[i + 3]), x, y)
    x++
    if (x >= width) { x = 0; y++ }
  }
}
