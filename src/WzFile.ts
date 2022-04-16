import { path } from './util/node'
import type { WzCanvasProperty } from './properties/WzCanvasProperty'
import type { WzConvexProperty } from './properties/WzConvexProperty'
import type { WzSubProperty } from './properties/WzSubProperty'
import type { WzVectorProperty } from './properties/WzVectorProperty'
import { BinaryReader } from '@tybys/binreader'
import { ErrorLevel, ErrorLogger } from './util/ErrorLogger'
import { WzBinaryReader } from './util/WzBinaryReader'
import { getIvFromZlz } from './util/WzKeyGenerator'
import { getIvByMapleVersion } from './util/WzTool'
import { WzDirectory } from './WzDirectory'
import { WzHeader } from './WzHeader'
import type { WzImage } from './WzImage'
import type { WzImageProperty } from './WzImageProperty'
import { WzMapleVersion } from './WzMapleVersion'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'
import { WzPropertyType } from './WzPropertyType'
import { WzFileParseStatus } from './WzFileParseStatus'

/**
 * @public
 */
export interface IWzParseResult {
  message: string
}

/** @public */
export enum MapleStoryLocalisation {
  MapleStoryKorea = 1,
  MapleStoryKoreaTespia = 2,
  Unknown3 = 3,
  Unknown4 = 4,
  MapleStoryTespia = 5,
  Unknown6 = 6,
  MapleStorySEA = 7,
  MapleStoryGlobal = 8,
  MapleStoryEurope = 9,

  Not_Known = 999

  // TODO: other values
}

/**
 * @public
 */
export class WzFile extends WzObject {
  public name: string = ''
  public parent: WzObject | null = null
  public filepath: string | File
  public header: WzHeader = WzHeader.getDefault()
  private _wzVersionHeader: number = 0
  private readonly _wzVersionHeader64bit_start: number = 777
  private _versionHash: number = 0
  public mapleStoryPatchVersion: number = 0
  public maplepLocalVersion: WzMapleVersion
  private readonly _mapleLocaleVersion: MapleStoryLocalisation = MapleStoryLocalisation.Not_Known

  private _b64BitClient = false // KMS update after Q4 2021, ver 1.2.357
  private _b64BitClient_withVerHeader = false
  private _wzIv: Uint8Array
  private _wzDir: WzDirectory | null = null

  public get mapleLocaleVersion (): MapleStoryLocalisation {
    return this._mapleLocaleVersion
  }

  public get Is64BitWzFile (): boolean {
    return this._b64BitClient
  }

  public get wzDirectory (): WzDirectory | null {
    return this._wzDir
  }

  public constructor (filepath: string | File, version: WzMapleVersion, gameVersion: number = -1) {
    super()
    this.filepath = filepath
    this.name = typeof filepath === 'string' ? filepath : filepath.name
    this.mapleStoryPatchVersion = gameVersion
    this.maplepLocalVersion = version

    if (version === WzMapleVersion.GETFROMZLZ) {
      if (typeof window !== 'undefined') throw new Error('Not supported in browser')
      const r = new BinaryReader(path.join(path.dirname(filepath as string), 'ZLZ.dll'))
      this._wzIv = getIvFromZlz(r)
      r.close()
    } else {
      this._wzIv = getIvByMapleVersion(version)
    }

    // TODO: Find a better way of identifying 64-bit client/ WZ from the WZ files instead.
    // This might break if it isnt installed in the right path, esp. private servers
    if (typeof this.filepath === 'string') {
      this._b64BitClient = this.filepath.split(path.sep).includes('Data')
    } else {
      this._b64BitClient = this.filepath.name.split(path.sep).includes('Data')
    }
  }

  public dispose (): void {
    if (this._disposed) return
    if (this._wzDir != null) {
      this._wzDir.reader.dispose()
      this._wzDir.reader = null!
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

  public async parseWzFile (wzIv: Uint8Array | null = null): Promise<WzFileParseStatus> {
    if (this._wzDir != null) {
      return WzFileParseStatus.SUCCESS
    }
    if (wzIv != null) {
      this._wzIv = wzIv
    }
    return await this._parseMainWzDirectory(false)
  }

  /* public lazyParseWzFile (out: IWzParseResult): boolean {
    return this.parseMainWzDirectory(out, true)
  } */

  private async _parseMainWzDirectory (lazyParse: boolean = false): Promise<WzFileParseStatus> {
    if (this.filepath === '') {
      ErrorLogger.log(ErrorLevel.Critical, '[Error] Path is null')
      return WzFileParseStatus.PATH_IS_NULL
    }

    const reader = new WzBinaryReader(this.filepath, this._wzIv)
    this.header = new WzHeader()
    this.header.ident = await reader.readString('ascii', 4)
    this.header.fsize = await reader.readBigUInt64LE()
    this.header.fstart = await reader.readUInt32LE()
    this.header.copyright = await reader.readString('ascii', this.header.fstart - 17)

    /* const unk1 =  */await reader.read()
    /* const unk2 =  */await reader.read(this.header.fstart - reader.pos)
    reader.header = this.header

    await this._check64BitClient(reader) // update b64BitClient flag

    // the value of wzVersionHeader is less important. It is used for reading/writing from/to WzFile Header, and calculating the versionHash.
    // it can be any number if the client is 64-bit. Assigning 777 is just for convenience when calculating the versionHash.
    this._wzVersionHeader = this._b64BitClient && !this._b64BitClient_withVerHeader ? this._wzVersionHeader64bit_start : await reader.readInt16LE()

    if (this.mapleStoryPatchVersion === -1) {
      // for 64-bit client, return immediately if version 777 works correctly.
      // -- the latest KMS update seems to have changed it to 778? 779?
      if (this._b64BitClient) {
        for (let maplestoryVerToDecode = this._wzVersionHeader64bit_start; maplestoryVerToDecode < this._wzVersionHeader64bit_start + 10; maplestoryVerToDecode++) {
          if (await this._tryDecodeWithWZVersionNumber(reader, this._wzVersionHeader, maplestoryVerToDecode, lazyParse)) {
            return WzFileParseStatus.SUCCESS
          }
        }
      }
      // Attempt to get version from MapleStory.exe first
      // const out = {}
      // Object.defineProperty(out, 'value', {
      //   configurable: true,
      //   enumerable: true,
      //   get: () => this._mapleLocaleVersion,
      //   set: (value: MapleStoryLocalisation) => { this._mapleLocaleVersion = value }
      // })
      // const maplestoryVerDetectedFromClient = WzFile._getMapleStoryVerFromExe(this.filepath, out)
      const maplestoryVerDetectedFromClient = 0

      // this step is actually not needed if we know the maplestory patch version (the client .exe), but since we dont..
      // we'll need a bruteforce way around it.
      const MAX_PATCH_VERSION = 1000 // wont be reached for the forseeable future.

      for (let j = maplestoryVerDetectedFromClient; j < MAX_PATCH_VERSION; j++) {
        if (await this._tryDecodeWithWZVersionNumber(reader, this._wzVersionHeader, j, lazyParse)) {
          return WzFileParseStatus.SUCCESS
        }
      }
      // parseErrorMessage = "Error with game version hash : The specified game version is incorrect and WzLib was unable to determine the version itself";
      return WzFileParseStatus.ERROR_GAME_VER_HASH
    } else {
      this._versionHash = this._checkAndGetVersionHash(this._wzVersionHeader, this.mapleStoryPatchVersion)
      reader.hash = this._versionHash
      const directory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
      directory.offset = reader.pos
      await directory.parseDirectory(lazyParse)
      this._wzDir = directory
    }

    return WzFileParseStatus.SUCCESS
  }

  private async _tryDecodeWithWZVersionNumber (reader: WzBinaryReader, useWzVersionHeader: number, useMapleStoryPatchVersion: number, lazyParse: boolean): Promise<boolean> {
    this.mapleStoryPatchVersion = useMapleStoryPatchVersion
    this._versionHash = this._checkAndGetVersionHash(useWzVersionHeader, this.mapleStoryPatchVersion)
    if (this._versionHash === 0) {
      return false
    }
    reader.hash = this._versionHash
    const fallbackOffsetPosition = reader.pos // save position to rollback to, if should parsing fail from here
    let testDirectory: WzDirectory
    try {
      testDirectory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
      testDirectory.offset = reader.pos
      await testDirectory.parseDirectory(lazyParse)
    } catch (_) {
      reader.pos = fallbackOffsetPosition
      return false
    }

    let bCloseTestDirectory = true
    try {
      const testImage: WzImage | undefined = testDirectory.wzImages.values().next().value
      if (testImage != null) {
        try {
          reader.pos = testImage.offset
          const checkByte = await reader.readUInt8()
          reader.pos = fallbackOffsetPosition
          switch (checkByte) {
            case 0x73:
            case 0x1b: {
              const directory = new WzDirectory(reader, this.name, this._versionHash, this._wzIv, this)
              directory.offset = reader.pos
              await directory.parseDirectory(lazyParse)
              this._wzDir = directory

              return true
            }
            case 0x30:
            case 0x6C: // idk
            case 0xBC: // Map002.wz? KMST?
            default: {
              ErrorLogger.log(ErrorLevel.MissingFeature, `[WzFile.ts] New Wz image header found. checkByte = ${checkByte}. File Name = ${this.name}`)
              break
            }
          }
          reader.pos = fallbackOffsetPosition // reset
          return false
        } catch (_) {
          reader.pos = fallbackOffsetPosition // reset
          return false
        }
      } else { // if there's no image in the WZ file (new KMST Base.wz), test the directory instead
        // coincidentally in msea v194 Map001.wz, the hash matches exactly using mapleStoryPatchVersion of 113, and it fails to decrypt later on (probably 1 in a million chance? o_O).
        // damn, technical debt accumulating here
        if (this.mapleStoryPatchVersion === 113) {
          // hack for now
          reader.pos = fallbackOffsetPosition // reset
          return false
        } else {
          this._wzDir = testDirectory
          bCloseTestDirectory = false

          return true
        }
      }
    } finally {
      if (bCloseTestDirectory) {
        testDirectory.dispose()
      }
    }
  }

  private async _check64BitClient (reader: WzBinaryReader): Promise<void> {
    if (this.header.fsize >= 2) {
      this._wzVersionHeader = await reader.readUInt16LE()
      if (this._wzVersionHeader > 0xff) {
        this._b64BitClient = true
      } else if (this._wzVersionHeader === 0x80) {
        // there's an exceptional case that the first field of data part is a compressed int which determines the property count,
        // if the value greater than 127 and also to be a multiple of 256, the first 5 bytes will become to
        // 80 00 xx xx xx
        // so we additional check the int value, at most time the child node count in a WzFile won't greater than 65536 (0xFFFF).
        if (this.header.fsize >= 5) {
          reader.seek(this.header.fstart)
          const propCount = await reader.readWzInt()
          if (propCount > 0 && (propCount & 0xFF) === 0 && propCount <= 0xFFFF) {
            this._b64BitClient = true
          }
        }
      } else if (this._wzVersionHeader === 0x21) { // or 33
        this._b64BitClient = true
        // but read the header
        // the latest KMS seems to include this back in again.. damn
        this._b64BitClient_withVerHeader = true // ugly hack, but until i've found a better way without breaking compatibility of old WZs.
      }
    } else {
      // Obviously, if data part have only 1 byte, encVer must be deleted.
      this._b64BitClient = true
    }

    // reset position
    reader.seek(this.header.fstart)
  }

  private _checkAndGetVersionHash (wzVersionHeader: number, maplestoryPatchVersion: number): number {
    const VersionNumber = maplestoryPatchVersion
    let VersionHash = 0
    const VersionNumberStr = VersionNumber.toString()

    const l = VersionNumberStr.length
    for (let i = 0; i < l; i++) {
      VersionHash = (32 * VersionHash) + VersionNumberStr.charCodeAt(i) + 1
    }

    if (wzVersionHeader === this._wzVersionHeader64bit_start) {
      return VersionHash >>> 0 // always 59192
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
    const seperatedPath = path.split(/[\\/]/)

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
