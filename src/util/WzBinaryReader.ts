import { WzHeader } from '../WzHeader'
import { AsyncBinaryReader } from '@tybys/binreader'
import { WZ_OffsetConstant } from './MapleCryptoConstants'
import { generateWzKey } from './WzKeyGenerator'
import type { WzMutableKey } from './WzMutableKey'
import { rotateLeft } from './WzTool'
import type { IDisposable } from './IDisposable'
import { asciiTextDecoder, utf16leTextDecoder } from './node'

/**
 * @public
 */
export class WzBinaryReader extends AsyncBinaryReader implements IDisposable {
  public wzKey: WzMutableKey
  public hash: number
  public header: WzHeader

  public constructor (filePath: string | File, wzIv: Uint8Array) {
    super(filePath)
    this.wzKey = generateWzKey(wzIv)
    this.hash = 0
    this.header = WzHeader.getDefault()
  }

  public async readWzStringAtOffset (offset: number, readByte: boolean = false): Promise<string> {
    const currentOffset = this.pos
    this.pos = offset
    if (readByte) {
      await this.read()
    }
    const returnString = await this.readWzString()
    this.pos = currentOffset
    return returnString
  }

  public async readWzString (): Promise<string> {
    const smallLength = await this.readInt8()

    if (smallLength === 0) {
      return ''
    }

    let length: number
    const u8arr = []

    if (smallLength > 0) {
      let mask = 0xAAAA
      if (smallLength === 127) {
        length = await this.readInt32LE()
      } else {
        length = smallLength
      }
      if (length <= 0) {
        return ''
      }

      for (let i = 0; i < length; i++) {
        let encryptedChar = await this.readUInt16LE()
        encryptedChar = ((encryptedChar ^ mask) >>> 0) & 0xffff
        encryptedChar = ((encryptedChar ^ (((this.wzKey.at(i * 2 + 1) << 8) >>> 0) + this.wzKey.at(i * 2))) >>> 0) & 0xffff
        u8arr.push(encryptedChar & 0xff)
        u8arr.push(encryptedChar >>> 8)
        mask++
      }
      return utf16leTextDecoder.decode(new Uint8Array(u8arr))
    } else { // ASCII
      let mask = 0xAA
      if (smallLength === -128) {
        length = await this.readInt32LE()
      } else {
        length = -smallLength
      }
      if (length <= 0) {
        return ''
      }

      for (let i = 0; i < length; i++) {
        let encryptedChar = await this.readUInt8()
        encryptedChar = (encryptedChar ^ mask) >>> 0
        encryptedChar = (encryptedChar ^ this.wzKey.at(i)) >>> 0
        u8arr.push(encryptedChar)
        mask++
      }
      return asciiTextDecoder.decode(new Uint8Array(u8arr))
    }
  }

  public async readStringBlock (offset: number): Promise<string> {
    const type = await this.readUInt8()
    switch (type) {
      case 0:
      case 0x73:
        return await this.readWzString()
      case 1:
      case 0x1B:
        return await this.readWzStringAtOffset(offset + await this.readInt32LE())
      default:
        return ''
    }
  }

  public readNullTerminatedString (): Promise<string> {
    return super.readString()
  }

  public async readWzInt (): Promise<number> {
    const sb = await this.readInt8()
    if (sb === -128) {
      return await this.readInt32LE()
    }
    return sb
  }

  public async readWzLong (): Promise<bigint> {
    const sb = await this.readInt8()
    if (sb === -128) {
      return await this.readBigInt64LE()
    }
    return BigInt(sb)
  }

  public async readWzOffset (): Promise<number> {
    let offset = this.pos
    offset = ((offset - this.header.fstart) ^ 0xFFFFFFFF) >>> 0
    offset = ((offset * this.hash) & 0xFFFFFFFF) >>> 0
    offset -= WZ_OffsetConstant
    offset = rotateLeft(offset, offset & 0x1F) & 0xFFFFFFFF
    const encryptedOffset = await this.readUInt32LE()
    offset = ((offset ^ encryptedOffset) & 0xFFFFFFFF) >>> 0
    offset = ((offset + this.header.fstart * 2) & 0xFFFFFFFF) >>> 0
    return offset
  }

  public decryptString (stringToDecrypt: string): string {
    let outputString: string = ''
    for (let i = 0; i < stringToDecrypt.length; i++) {
      outputString += String.fromCharCode(
        ((stringToDecrypt.charCodeAt(i) ^ (((this.wzKey.at(i * 2 + 1) << 8) >>> 0) + this.wzKey.at(i * 2))) >>> 0) & 0xFFFF
      )
    }
    return outputString
  }

  public decryptNonUnicodeString (stringToDecrypt: string): string {
    let outputString: string = ''
    for (let i = 0; i < stringToDecrypt.length; i++) {
      outputString += String.fromCharCode(((stringToDecrypt.charCodeAt(i) ^ this.wzKey.at(i)) >>> 0) & 0xFFFF)
    }
    return outputString
  }
}
