import * as path from 'path'
import { BinaryReader } from './util/BinaryReader'
import { WzBinaryReader } from './util/WzBinaryReader'
import { WzKeyGenerator } from './util/WzKeyGenerator'
import { WzTool } from './util/WzTool'
import { WzDirectory } from './WzDirectory'
import { WzHeader } from './WzHeader'
import { WzImage } from './WzImage'
import { WzMapleVersion } from './WzMapleVersion'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'

export class WzFile extends WzObject {
  public name: string = ''
  public parent: WzObject | null = null
  public filepath: string
  public header: WzHeader = WzHeader.getDefault()
  private version: number = 0
  private versionHash: number = 0
  public mapleStoryPatchVersion: number = 0
  public maplepLocalVersion: WzMapleVersion
  private wzIv: Buffer
  private wzDir: WzDirectory | null = null

  public get wzDirectory (): WzDirectory | null {
    return this.wzDir
  }

  public constructor (filepath: string, version: WzMapleVersion, gameVersion: number = -1) {
    super()
    this.filepath = filepath
    this.name = filepath
    this.mapleStoryPatchVersion = gameVersion
    this.maplepLocalVersion = version

    if (version === WzMapleVersion.GETFROMZLZ) {
      const r = new BinaryReader(path.join(path.dirname(filepath), 'ZLZ.dll'))
      this.wzIv = WzKeyGenerator.getIvFromZlz(r)
      r.close()
    } else {
      this.wzIv = WzTool.getIvByMapleVersion(version)
    }
  }

  public dispose (): void {
    if (this.wzDir != null) {
      this.wzDir.reader.dispose()
      this.wzDir.dispose()
    }
    this.header = WzHeader.getDefault()
    this.filepath = ''
    this.name = ''
  }

  public get objectType (): WzObjectType {
    return WzObjectType.File
  }

  public get wzFileParent (): WzFile {
    return this
  }

  public at (name: string): WzObject | null {
    return this.wzDir != null ? this.wzDir.at(name) : null
  }

  public get fullPath (): string {
    return this.wzDirectory != null ? this.wzDirectory.name : ''
  }

  public parseWzFile (out: { message: string }, wzIv: Buffer | null = null): boolean {
    if (wzIv != null) {
      this.wzIv = wzIv
    }
    return this.parseMainWzDirectory(out, false)
  }

  public lazyParseWzFile (out: { message: string }): boolean {
    return this.parseMainWzDirectory(out, true)
  }

  public parseMainWzDirectory (out: { message: string }, lazyParse: boolean = false): boolean {
    if (this.filepath === '') {
      out.message = 'Invalid path'
      return false
    }

    const reader = new WzBinaryReader(this.filepath, this.wzIv)
    this.header = new WzHeader()
    this.header.ident = reader.readString('ascii', 4)
    this.header.fsize = reader.readBigUInt64LE()
    this.header.fstart = reader.readUInt32LE()
    this.header.copyright = reader.readNullTerminatedString()

    reader.read(this.header.fstart - reader.pos)
    reader.header = this.header
    this.version = reader.readInt16LE()

    if (this.mapleStoryPatchVersion === -1) {
      const MAX_PATCH_VERSION = 10000
      for (let j = 0; j < MAX_PATCH_VERSION; j++) {
        this.mapleStoryPatchVersion = j
        this.versionHash = this.checkAndGetVersionHash(this.version, this.mapleStoryPatchVersion)
        if (this.versionHash === 0) {
          continue
        }
        reader.hash = this.versionHash
        const position = reader.pos // save position to rollback to, if should parsing fail from here
        let testDirectory: WzDirectory
        try {
          testDirectory = new WzDirectory(reader, this.name, this.versionHash, this.wzIv, this)
          testDirectory.parseDirectory(lazyParse)
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
                const directory = new WzDirectory(reader, this.name, this.versionHash, this.wzIv, this)
                directory.parseDirectory(lazyParse)
                this.wzDir = directory

                out.message = 'Success'
                return true
              }
              default: {
                console.error(`New Wz image header found. checkByte = ${checkByte}`)
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
      this.versionHash = this.checkAndGetVersionHash(this.version, this.mapleStoryPatchVersion)
      reader.hash = this.versionHash
      const directory = new WzDirectory(reader, this.name, this.versionHash, this.wzIv, this)
      directory.parseDirectory()
      this.wzDir = directory
    }

    out.message = 'Success'
    return true
  }

  public checkAndGetVersionHash (wzVersionHeader: number, maplestoryPatchVersion: number): number {
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
}
