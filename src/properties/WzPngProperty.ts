import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzBinaryReader } from '../util/WzBinaryReader'
import * as Jimp from 'jimp'
import * as zlib from 'zlib'
import { BinaryReader } from '../util/BinaryReader'
import { Transform } from 'stream'
import { NotImplementedError } from '../util/NotImplementedError'

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

        const decoded = this.getPixelDataBgra4444(decBuf, this.width, this.height)
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
      default: {
        throw new NotImplementedError(`PNG format: ${format}.`)
      }
    }
  }

  public getPixelDataBgra4444 (rawData: Buffer, width: number, height: number): Buffer {
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
