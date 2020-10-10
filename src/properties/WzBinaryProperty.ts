import * as fs from 'fs'
import { WzBinaryReader } from '../util/WzBinaryReader'
import { WzExtended } from '../WzExtended'
import { WzObject } from '../WzObject'
import { WzPropertyType } from '../WzPropertyType'

/**
 * @public
 */
export class WzBinaryProperty extends WzExtended {
  public static soundHeader = [
    0x02,
    0x83, 0xEB, 0x36, 0xE4, 0x4F, 0x52, 0xCE, 0x11, 0x9F, 0x53, 0x00, 0x20, 0xAF, 0x0B, 0xA7, 0x70,
    0x8B, 0xEB, 0x36, 0xE4, 0x4F, 0x52, 0xCE, 0x11, 0x9F, 0x53, 0x00, 0x20, 0xAF, 0x0B, 0xA7, 0x70,
    0x00,
    0x01,
    0x81, 0x9F, 0x58, 0x05, 0x56, 0xC3, 0xCE, 0x11, 0xBF, 0x01, 0x00, 0xAA, 0x00, 0x55, 0x59, 0x5A]

  public parent: WzObject | null = null

  public name: string

  private readonly wzReader: WzBinaryReader

  private mp3bytes: Buffer | null = null

  private readonly soundDataLen: number
  public length: number
  public header: Buffer
  private readonly offs: number

  public constructor (name: string, reader: WzBinaryReader, parseNow: boolean) {
    super()
    this.name = name
    this.wzReader = reader

    this.wzReader.pos++
    // note - soundDataLen does NOT include the length of the header.
    this.soundDataLen = this.wzReader.readWzInt()
    this.length = this.wzReader.readWzInt()

    const headerOff = this.wzReader.pos
    this.wzReader.pos += WzBinaryProperty.soundHeader.length
    const wavFormatLen = this.wzReader.readUInt8()
    this.wzReader.pos = headerOff

    this.header = this.wzReader.read(WzBinaryProperty.soundHeader.length + 1 + wavFormatLen)
    // this.parseWzSoundPropertyHeader()

    // sound file offs
    this.offs = this.wzReader.pos
    if (parseNow) {
      this.mp3bytes = this.wzReader.read(this.soundDataLen)
    } else {
      this.wzReader.pos += this.soundDataLen
    }
  }

  public setValue (_value: unknown): void {}

  public get wzValue (): Buffer {
    return this.getBytes(false)
  }

  public getBytes (saveInMemory: boolean = false): Buffer {
    if (this.mp3bytes != null) {
      return this.mp3bytes
    }

    // if (this.wzReader == null) return null

    const currentPos = this.wzReader.pos
    this.wzReader.pos = this.offs
    this.mp3bytes = this.wzReader.read(this.soundDataLen)
    this.wzReader.pos = currentPos
    if (saveInMemory) {
      return this.mp3bytes
    }

    const result = this.mp3bytes
    this.mp3bytes = null
    return result
  }

  public saveToFile (file: string): void {
    fs.writeFileSync(file, this.getBytes(false))
  }

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Sound
  }

  public dispose (): void {
    this.name = ''
    this.mp3bytes = null
  }
}
