import * as path from 'path'
import { WzCanvasProperty } from './properties/WzCanvasProperty'
import { WzConvexProperty } from './properties/WzConvexProperty'
import { WzSubProperty } from './properties/WzSubProperty'
import { WzVectorProperty } from './properties/WzVectorProperty'
import { BinaryReader } from './util/BinaryReader'
import { ErrorLevel, ErrorLogger } from './util/ErrorLogger'
import { WzBinaryReader } from './util/WzBinaryReader'
import { WzKeyGenerator } from './util/WzKeyGenerator'
import { WzTool } from './util/WzTool'
import { WzDirectory } from './WzDirectory'
import { WzHeader } from './WzHeader'
import { WzImage } from './WzImage'
import { WzImageProperty } from './WzImageProperty'
import { WzMapleVersion } from './WzMapleVersion'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'
import { WzPropertyType } from './WzPropertyType'

/**
 * @public
 */
export interface IWzParseResult {
  message: string
}

/**
 * @public
 */
export class WzFile extends WzObject {
  public static createParseResult (): IWzParseResult {
    return { message: '' }
  }

  public name: string = ''
  public parent: WzObject | null = null
  public filepath: string
  public header: WzHeader = WzHeader.getDefault()
  private _version: number = 0
  private _versionHash: number = 0
  public mapleStoryPatchVersion: number = 0
  public maplepLocalVersion: WzMapleVersion
  private _wzIv: Buffer
  private _wzDir: WzDirectory | null = null

  public get wzDirectory (): WzDirectory | null {
    return this._wzDir
  }

  public constructor (filepath: string, version: WzMapleVersion, gameVersion: number = -1) {
    super()
    this.filepath = filepath
    this.name = filepath
    this.mapleStoryPatchVersion = gameVersion
    this.maplepLocalVersion = version

    if (version === WzMapleVersion.GETFROMZLZ) {
      const r = new BinaryReader(path.join(path.dirname(filepath), 'ZLZ.dll'))
      this._wzIv = WzKeyGenerator.getIvFromZlz(r)
      r.close()
    } else {
      this._wzIv = WzTool.getIvByMapleVersion(version)
    }
  }

  public dispose (): void {
    if (this._disposed) return
    if (this._wzDir != null) {
      this._wzDir.reader.dispose()
      this._wzDir.dispose()
      this._wzDir = null
    }
    this.header = WzHeader.getDefault()
    this._disposed = true
  }

  public get objectType (): WzObjectType {
    return WzObjectType.File
  }

  public get wzFileParent (): WzFile {
    return this
  }

  public at (name: string): WzObject | null {
    return this._wzDir != null ? this._wzDir.at(name) : null
  }

  public get fullPath (): string {
    return this.wzDirectory != null ? this.wzDirectory.name : ''
  }

  public parseWzFile (out: IWzParseResult, wzIv: Buffer | null = null): boolean {
    if (this._wzDir != null) {
      out.message = 'Already parsed wz file'
      return true
    }
    if (wzIv != null) {
      this._wzIv = wzIv
    }
    return this._parseMainWzDirectory(out/* , false */)
  }

  /* public lazyParseWzFile (out: IWzParseResult): boolean {
    return this.parseMainWzDirectory(out, true)
  } */

  private _parseMainWzDirectory (out: IWzParseResult/* , lazyParse: boolean = false */): boolean {
    if (this.filepath === '') {
      const msg = 'Invalid path: ""'
      ErrorLogger.log(ErrorLevel.Critical, msg)
      out.message = msg
      return false
    }

    const reader = new WzBinaryReader(this.filepath, this._wzIv)
    this.header = new WzHeader()
    this.header.ident = reader.readString('ascii', 4)
    this.header.fsize = reader.readBigUInt64LE()
    this.header.fstart = reader.readUInt32LE()
    this.header.copyright = reader.readNullTerminatedString()

    reader.read(this.header.fstart - reader.pos)
    reader.header = this.header
    this._version = reader.readInt16LE()

    if (this.mapleStoryPatchVersion === -1) {
      const MAX_PATCH_VERSION = 10000
      for (let j = 0; j < MAX_PATCH_VERSION; j++) {
        this.mapleStoryPatchVersion = j
        this._versionHash = this._checkAndGetVersionHash(this._version, this.mapleStoryPatchVersion)
        if (this._versionHash === 0) {
          continue
        }
        reader.hash = this._versionHash
        const position = reader.pos // save position to rollback to, if should parsing fail from here
        let testDirectory: WzDirectory
        try {
          testDirectory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
          testDirectory.offset = reader.pos
          testDirectory.parseDirectory(/* lazyParse */)
        } catch (_) {
          reader.pos = position
          continue
        }

        try {
          const childImages = testDirectory.getChildImages()
          if (childImages.size === 0) {
            reader.pos = position
            continue
          }
          const testImage = childImages.values().next().value as WzImage
          try {
            reader.pos = testImage.offset
            const checkByte = reader.readUInt8()
            reader.pos = position
            switch (checkByte) {
              case 0x73:
              case 0x1b: {
                const directory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
                directory.offset = reader.pos
                directory.parseDirectory(/* lazyParse */)
                this._wzDir = directory

                out.message = 'Success'
                return true
              }
              default: {
                ErrorLogger.log(ErrorLevel.MissingFeature, `New Wz image header found. checkByte = ${checkByte}`)
                break
              }
            }
            reader.pos = position // reset
          } catch (_) {
            reader.pos = position // reset
          }
        } catch (_) {
          testDirectory.dispose()
        }
        testDirectory.dispose()
      }
    } else {
      this._versionHash = this._checkAndGetVersionHash(this._version, this.mapleStoryPatchVersion)
      reader.hash = this._versionHash
      const directory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
      directory.offset = reader.pos
      directory.parseDirectory()
      this._wzDir = directory
    }

    out.message = 'Success'
    return true
  }

  private _checkAndGetVersionHash (wzVersionHeader: number, maplestoryPatchVersion: number): number {
    const VersionNumber = maplestoryPatchVersion
    let VersionHash = 0
    const VersionNumberStr = VersionNumber.toString()

    const l = VersionNumberStr.length
    for (let i = 0; i < l; i++) {
      VersionHash = (32 * VersionHash) + VersionNumberStr.charCodeAt(i) + 1
    }

    const a = (VersionHash >> 24) & 0xFF
    const b = (VersionHash >> 16) & 0xFF
    const c = (VersionHash >> 8) & 0xFF
    const d = VersionHash & 0xFF
    const DecryptedVersionNumber = (0xff ^ a ^ b ^ c ^ d)

    if (wzVersionHeader === DecryptedVersionNumber) return (VersionHash >>> 0)

    return 0
  }

  public getObjectFromPath (path: string, checkFirstDirectoryName: boolean = true): WzObject | null {
    if (this._wzDir == null) return null
    const seperatedPath = path.split('/')

    if (checkFirstDirectoryName) {
      if (seperatedPath[0].toLowerCase() !== this._wzDir.name.toLowerCase() && seperatedPath[0].toLowerCase() !== this._wzDir.name.substring(0, this._wzDir.name.length - 3).toLowerCase()) return null
    }

    if (seperatedPath.length === 1) return this.wzDirectory
    let curObj: WzObject | null = this.wzDirectory
    for (let i = 1; i < seperatedPath.length; i++) {
      if (curObj == null) {
        return null
      }
      switch (curObj.objectType) {
        case WzObjectType.Directory:
          curObj = (curObj as WzDirectory).at(seperatedPath[i])
          continue
        case WzObjectType.Image:
          curObj = (curObj as WzImage).at(seperatedPath[i])
          continue
        case WzObjectType.Property:
          switch ((curObj as WzImageProperty).propertyType) {
            case WzPropertyType.Canvas:
              curObj = (curObj as WzCanvasProperty).at(seperatedPath[i])
              continue
            case WzPropertyType.Convex:
              curObj = (curObj as WzConvexProperty).at(seperatedPath[i])
              continue
            case WzPropertyType.SubProperty:
              curObj = (curObj as WzSubProperty).at(seperatedPath[i])
              continue
            case WzPropertyType.Vector:
              if (seperatedPath[i] === 'x') return (curObj as WzVectorProperty).x
              else if (seperatedPath[i] === 'y') return (curObj as WzVectorProperty).y
              else return null
            default: // Wut?
              return null
          }
      }
    }
    if (curObj == null) {
      return null
    }
    return curObj
  }
}
