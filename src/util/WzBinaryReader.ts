import { WzHeader } from '../WzHeader'
import { BinaryReader } from '@tybys/binreader'
import { MapleCryptoConstants } from './MapleCryptoConstants'
import { WzKeyGenerator } from './WzKeyGenerator'
import { WzMutableKey } from './WzMutableKey'
import { WzTool } from './WzTool'
import { IDisposable } from './IDisposable'
import { asciiTextDecoder, utf16leTextDecoder } from './node'

/**
 * @public
 */
export class WzBinaryReader extends BinaryReader implements IDisposable {
  public wzKey: WzMutableKey
  public hash: number
  public header: WzHeader

  public constructor (filePath: string, wzIv: Uint8Array) {
    super(filePath)
    this.wzKey = WzKeyGenerator.generateWzKey(wzIv)
    this.hash = 0
    this.header = WzHeader.getDefault()
  }

  public readWzStringAtOffset (offset: number, readByte: boolean = false): string {
    const currentOffset = this.pos
    this.pos = offset
    if (readByte) {
      this.read()
    }
    const returnString = this.readWzString()
    this.pos = currentOffset
    return returnString
  }

  public readWzString (): string {
    const smallLength = this.readInt8()

    if (smallLength === 0) {
      return ''
    }

    let length
    const u8arr = []

    if (smallLength > 0) {
      let mask = 0xAAAA
      if (smallLength === 127) {
        length = this.readInt32LE()
      } else {
        length = smallLength
      }
      if (length <= 0) {
        return ''
      }

      for (let i = 0; i < length; i++) {
        let encryptedChar = this.readUInt16LE()
        encryptedChar = (encryptedChar ^ mask) >>> 0
        encryptedChar = (encryptedChar ^ (((this.wzKey.at(i * 2 + 1) << 8) >>> 0) + this.wzKey.at(i * 2))) >>> 0
        u8arr.push(encryptedChar & 0xff)
        u8arr.push(encryptedChar >>> 16)
        mask++
      }
      return utf16leTextDecoder.decode(new Uint8Array(u8arr))
    } else { // ASCII
      let mask = 0xAA
      if (smallLength === -128) {
        length = this.readInt32LE()
      } else {
        length = -smallLength
      }
      if (length <= 0) {
        return ''
      }

      for (let i = 0; i < length; i++) {
        let encryptedChar = this.readUInt8()
        encryptedChar = (encryptedChar ^ mask) >>> 0
        encryptedChar = (encryptedChar ^ this.wzKey.at(i)) >>> 0
        u8arr.push(encryptedChar)
        mask++
      }
      return asciiTextDecoder.decode(new Uint8Array(u8arr))
    }
  }

  public readStringBlock (offset: number): string {
    switch (this.readUInt8()) {
      case 0:
      case 0x73:
        return this.readWzString()
      case 1:
      case 0x1B:
        return this.readWzStringAtOffset(offset + this.readInt32LE())
      default:
        return ''
    }
  }

  public readNullTerminatedString (): string {
    return super.readString()
  }

  public readWzInt (): number {
    const sb = this.readInt8()
    if (sb === -128) {
      return this.readInt32LE()
    }
    return sb
  }

  public readWzLong (): bigint {
    const sb = this.readInt8()
    if (sb === -128) {
      return this.readBigInt64LE()
    }
    return BigInt(sb)
  }

  public readWzOffset (): number {
    let offset = this.pos
    offset = ((offset - this.header.fstart) ^ 0xFFFFFFFF) >>> 0
    offset = (offset * this.hash) & 0xFFFFFFFF
    offset -= MapleCryptoConstants.WZ_OffsetConstant
    offset = WzTool.rotateLeft(offset, offset & 0x1F)
    const encryptedOffset = this.readUInt32LE()
    offset = (offset ^ encryptedOffset) >>> 0
    offset = (offset + this.header.fstart * 2) & 0xFFFFFFFF
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
