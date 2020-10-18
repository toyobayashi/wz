import { WzBinaryReader } from '../util/WzBinaryReader'
import { WzExtended } from '../WzExtended'
import { WzObject } from '../WzObject'
import { WzPropertyType } from '../WzPropertyType'
import { fs, path } from '../util/node'

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

  private mp3bytes: Uint8Array | null = null

  private soundDataLen: number = 0
  public length: number = 0
  public header!: Uint8Array
  private offs: number = 0

  public static async create (name: string, reader: WzBinaryReader, parseNow: boolean): Promise<WzBinaryProperty> {
    const self = new WzBinaryProperty(name, reader)

    self.wzReader.pos++
    // note - soundDataLen does NOT include the length of the header.
    self.soundDataLen = await self.wzReader.readWzInt()
    self.length = await self.wzReader.readWzInt()

    const headerOff = self.wzReader.pos
    self.wzReader.pos += WzBinaryProperty.soundHeader.length
    const wavFormatLen = await self.wzReader.readUInt8()
    self.wzReader.pos = headerOff

    self.header = await self.wzReader.read(WzBinaryProperty.soundHeader.length + 1 + wavFormatLen)
    // this.parseWzSoundPropertyHeader()

    // sound file offs
    self.offs = self.wzReader.pos
    if (parseNow) {
      self.mp3bytes = await self.wzReader.read(self.soundDataLen)
    } else {
      self.wzReader.pos += self.soundDataLen
    }

    return self
  }

  private constructor (name: string, reader: WzBinaryReader) {
    super()
    this.name = name
    this.wzReader = reader
    this.offs = 0
  }

  public setValue (_value: unknown): void {}

  public get wzValue (): Promise<Uint8Array> {
    return this.getBytes(false)
  }

  public async getBytes (saveInMemory: boolean = false): Promise<Uint8Array> {
    if (this.mp3bytes != null) {
      return this.mp3bytes
    }

    // if (this.wzReader == null) return null

    const currentPos = this.wzReader.pos
    this.wzReader.pos = this.offs
    this.mp3bytes = await this.wzReader.read(this.soundDataLen)
    this.wzReader.pos = currentPos
    if (saveInMemory) {
      return this.mp3bytes
    }

    const result = this.mp3bytes
    this.mp3bytes = null
    return result
  }

  public async saveToFile (file: string): Promise<void> {
    if (typeof window !== 'undefined') {
      const a = window.document.createElement('a')
      a.download = file
      a.href = URL.createObjectURL(new Blob([await this.getBytes(false)], { type: 'audio/mp3' }))
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      })
      a.dispatchEvent(event)
      a.remove()
      return
    }
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true })
    } catch (_) {}
    fs.writeFileSync(file, await this.getBytes(false))
  }

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Sound
  }

  public dispose (): void {
    if (this._disposed) return
    this.mp3bytes = null
    this._disposed = true
  }
}
