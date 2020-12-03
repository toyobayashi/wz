import { BinaryReader } from '@tybys/binreader'
import { MapleCryptoConstants } from './MapleCryptoConstants'
import { WzMutableKey } from './WzMutableKey'

export class WzKeyGenerator {
  public static getIvFromZlz (zlzStream: BinaryReader): Uint8Array {
    zlzStream.seek(0x10040)
    const iv = zlzStream.read(4)
    return iv
  }

  /* private static getAesKeyFromZlz (zlzStream: BinaryReader): Uint8Array {
    const aes = new Uint8Array(32)

    zlzStream.seek(0x10060)
    for (let i = 0; i < 8; i++) {
      zlzStream.readToBuffer(aes, i * 4, 4)
      zlzStream.pos += 12
    }
    return aes
  } */

  public static generateLuaWzKey (): WzMutableKey {
    return new WzMutableKey(
      MapleCryptoConstants.WZ_MSEAIV,
      MapleCryptoConstants.getTrimmedUserKey(MapleCryptoConstants.MAPLESTORY_USERKEY_DEFAULT))
  }

  public static generateWzKey (wzIv: Uint8Array): WzMutableKey {
    return new WzMutableKey(wzIv, MapleCryptoConstants.getTrimmedUserKey(MapleCryptoConstants.userKeyWzLib))
  }
}
