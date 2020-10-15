import { BinaryReader } from '@tybys/binreader'
import { MapleCryptoConstants } from './MapleCryptoConstants'
import { WzMutableKey } from './WzMutableKey'

export class WzKeyGenerator {
  public static getIvFromZlz (zlzStream: BinaryReader): Buffer {
    zlzStream.seek(0x10040)
    const iv = Buffer.from(zlzStream.read(4))
    return iv
  }

  /* private static getAesKeyFromZlz (zlzStream: BinaryReader): Buffer {
    const aes = Buffer.alloc(32)

    zlzStream.seek(0x10060)
    for (let i = 0; i < 8; i++) {
      zlzStream.readToBuffer(aes, i * 4, 4)
      zlzStream.pos += 12
    }
    return aes
  } */

  public static generateWzKey (wzIv: Buffer): WzMutableKey {
    return new WzMutableKey(wzIv, MapleCryptoConstants.getTrimmedUserKey())
  }
}
