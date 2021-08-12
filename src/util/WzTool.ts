import { WzMapleVersion } from '../WzMapleVersion'
import { WZ_MSEAIV, WZ_GMSIV } from './MapleCryptoConstants'

export function rotateLeft (x: number, n: number): number {
  return ((((x) << (n)) >>> 0) | ((x) >>> (32 - (n)))) >>> 0
}

export function getIvByMapleVersion (ver: WzMapleVersion): Uint8Array {
  switch (ver) {
    case WzMapleVersion.EMS:
      return WZ_MSEAIV
    case WzMapleVersion.GMS:
      return WZ_GMSIV
    case WzMapleVersion.CUSTOM: {
      return new Uint8Array(4)
    }
    case WzMapleVersion.GENERATE:
      return new Uint8Array(4)

    case WzMapleVersion.BMS:
    case WzMapleVersion.CLASSIC:
    default:
      return new Uint8Array(4)
  }
}
