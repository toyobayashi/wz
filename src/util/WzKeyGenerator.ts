import type { BinaryReader } from '@tybys/binreader'
import { WZ_MSEAIV, getTrimmedUserKey, MAPLESTORY_USERKEY_DEFAULT, userKeyWzLib } from './MapleCryptoConstants'
import { WzMutableKey } from './WzMutableKey'

export function getIvFromZlz (zlzStream: BinaryReader): Uint8Array {
  zlzStream.seek(0x10040)
  const iv = zlzStream.read(4)
  return iv
}

/* function getAesKeyFromZlz (zlzStream: BinaryReader): Uint8Array {
  const aes = new Uint8Array(32)

  zlzStream.seek(0x10060)
  for (let i = 0; i < 8; i++) {
    zlzStream.readToBuffer(aes, i * 4, 4)
    zlzStream.pos += 12
  }
  return aes
} */

export function generateLuaWzKey (): WzMutableKey {
  return new WzMutableKey(
    WZ_MSEAIV,
    getTrimmedUserKey(MAPLESTORY_USERKEY_DEFAULT))
}

export function generateWzKey (wzIv: Uint8Array): WzMutableKey {
  return new WzMutableKey(wzIv, getTrimmedUserKey(userKeyWzLib))
}
