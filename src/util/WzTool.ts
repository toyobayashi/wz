import { WzMapleVersion } from '../WzMapleVersion'
import { MapleCryptoConstants } from './MapleCryptoConstants'

export class WzTool {
  public static rotateLeft (x: number, n: number): number {
    return ((((x) << (n)) >>> 0) | ((x) >>> (32 - (n)))) >>> 0
  }

  public static getIvByMapleVersion (ver: WzMapleVersion): Buffer {
    switch (ver) {
      case WzMapleVersion.EMS:
        return MapleCryptoConstants.WZ_MSEAIV
      case WzMapleVersion.GMS:
        return MapleCryptoConstants.WZ_GMSIV
      case WzMapleVersion.CUSTOM: {
        return Buffer.alloc(4)
      }
      case WzMapleVersion.GENERATE:
        return Buffer.alloc(4)

      case WzMapleVersion.BMS:
      case WzMapleVersion.CLASSIC:
      default:
        return Buffer.alloc(4)
    }
  }
}
