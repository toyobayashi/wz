import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzBinaryReader } from '../util/WzBinaryReader'

/**
 * @public
 */
export class WzPngProperty extends WzExtended {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.PNG
  }

  public dispose (): void {
    this.compressedImageBytes = null
    // TODO
  }

  public get wzValue (): any {
    // TODO
    return 0
  }

  public parent: WzObject | null = null

  public get name (): string {
    return 'PNG'
  }

  public width: number
  public height: number
  public format: number
  public format2: number
  public offs: number
  private readonly wzReader: WzBinaryReader | null = null
  // @ts-expect-error
  private compressedImageBytes: Buffer | null = null

  public constructor (reader: WzBinaryReader, parseNow: boolean) {
    super()
    this.width = reader.readWzInt()
    this.height = reader.readWzInt()
    this.format = reader.readWzInt()
    this.format2 = reader.readUInt8()
    reader.pos += 4
    this.offs = reader.pos
    const len = reader.readInt32LE() - 1
    reader.pos += 1

    if (len > 0) {
      if (parseNow) {
        if (this.wzReader == null) {
          this.compressedImageBytes = reader.read(len)
        } else {
          this.compressedImageBytes = this.wzReader.read(len)
        }
        // TODO
        // this.parsePng()
      } else {
        reader.pos += len
      }
    }
    this.wzReader = reader
  }

  public setValue (_value: string): void {
    // TODO
  }
}
