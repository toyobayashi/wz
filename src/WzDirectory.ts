import { WzBinaryReader } from './util/WzBinaryReader'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'

/**
 * @public
 */
export class WzDirectory extends WzObject {
  private readonly images: Set<WzImage> = new Set()
  private readonly subDirs: Set<WzDirectory> = new Set()
  public reader: WzBinaryReader
  public offset: number = 0
  public name: string
  public hash: number
  public blockSize: number = 0
  public checksum: number = 0
  // private offsetSize: number = 0
  private readonly wzIv: Buffer
  public parent: WzObject | null = null
  public wzFile: WzFile

  public dispose (): void {
    if (this._disposed) return
    for (const img of this.images) {
      img.dispose()
    }
    for (const dir of this.subDirs) {
      dir.dispose()
    }
    this.images.clear()
    this.subDirs.clear()
    this._disposed = true
  }

  public get objectType (): WzObjectType {
    return WzObjectType.Directory
  }

  public get wzFileParent (): WzFile | null {
    return this.wzFile
  }

  public get wzImages (): Set<WzImage> {
    return this.images
  }

  public get wzDirectories (): Set<WzDirectory> {
    return this.subDirs
  }

  public constructor (reader: WzBinaryReader, name: string, hash: number, wzIv: Buffer, wzFile: WzFile) {
    super()
    this.reader = reader
    this.name = name
    this.hash = hash
    this.wzIv = wzIv
    this.wzFile = wzFile
  }

  public at (name: string): WzObject | null {
    const nameLower = name.toLowerCase()
    for (const img of this.images) {
      if (img.name.toLowerCase() === nameLower) return img
    }
    for (const dir of this.subDirs) {
      if (dir.name.toLowerCase() === nameLower) return dir
    }
    return null
  }

  public set (name: string, value: WzObject): void {
    if (value != null) {
      value.name = name
      if (value instanceof WzDirectory) {
        this.addDirectory(value)
      } else if (value instanceof WzImage) {
        this.addImage(value)
      } else {
        throw new TypeError('Value must be a Directory or Image')
      }
    }
  }

  public addDirectory (dir: WzDirectory): void {
    this.subDirs.add(dir)
    dir.wzFile = this.wzFile
    dir.parent = this
  }

  public addImage (img: WzImage): void {
    this.images.add(img)
    img.parent = this
  }

  public clearDirectories (): void {
    for (const dir of this.subDirs) {
      dir.parent = null
    }
    this.subDirs.clear()
  }

  public clearImages (): void {
    for (const img of this.images) {
      img.parent = null
    }
    this.images.clear()
  }

  public getImageByName (name: string): WzImage | null {
    const nameLower = name.toLowerCase()
    for (const img of this.images) {
      if (img.name.toLowerCase() === nameLower) return img
    }
    return null
  }

  public getDirectoryByName (name: string): WzDirectory | null {
    const nameLower = name.toLowerCase()
    for (const dir of this.subDirs) {
      if (dir.name.toLowerCase() === nameLower) return dir
    }
    return null
  }

  public getChildImages (): Set<WzImage> {
    const imgFiles = new Set<WzImage>()
    for (const img of this.images) {
      imgFiles.add(img)
    }
    for (const subDir of this.subDirs) {
      const list = subDir.getChildImages()
      for (const img of list) {
        imgFiles.add(img)
      }
    }
    return imgFiles
  }

  public setVersionHash (newHash: number): void {
    this.hash = newHash
    for (const dir of this.subDirs) {
      dir.setVersionHash(newHash)
    }
  }

  public parseImages (): void {
    for (const img of this.images) {
      if (this.reader.pos !== img.offset) {
        this.reader.pos = img.offset
      }
      img.parseImage()
    }
    for (const subdir of this.subDirs) {
      if (this.reader.pos !== subdir.offset) {
        this.reader.pos = subdir.offset
      }
      subdir.parseImages()
    }
  }

  public parseDirectory (/* lazyParse: boolean = false */): void {
    this.subDirs.clear()
    this.images.clear()
    if (this.reader.pos !== this.offset) {
      this.reader.pos = this.offset
    }
    const reader = this.reader
    const entryCount = reader.readWzInt()
    if (entryCount < 0 || entryCount > 100000) throw new Error('Invalid wz version used for decryption, try parsing other version numbers.')

    for (let i = 0; i < entryCount; i++) {
      let type = reader.readUInt8()
      let fname = ''
      var fsize: number
      var checksum: number
      var offset: number
      let rememberPos = 0
      switch (type) {
        case 1: {
          /* const unknown =  */reader.readInt32LE()
          reader.readInt16LE()
          /* const offs =  */reader.readWzOffset()
          continue
        }
        case 2: {
          const stringOffset = reader.readInt32LE()
          rememberPos = reader.pos
          reader.pos = reader.header.fstart + stringOffset
          type = reader.readUInt8()
          fname = reader.readWzString()
          break
        }
        case 3:
        case 4: {
          fname = reader.readWzString()
          rememberPos = reader.pos
          break
        }
        default: break
      }
      reader.pos = rememberPos
      fsize = reader.readWzInt()
      checksum = reader.readWzInt()
      offset = reader.readWzOffset()
      if (type === 3) {
        const subDir = new WzDirectory(reader, fname, this.hash, this.wzIv, this.wzFile)
        subDir.blockSize = fsize
        subDir.checksum = checksum
        subDir.offset = offset
        subDir.parent = this
        this.subDirs.add(subDir)

        // if (lazyParse) break
      } else {
        const img = new WzImage(fname, reader, checksum)
        img.blockSize = fsize
        img.offset = offset
        img.parent = this
        this.images.add(img)

        // if (lazyParse) break
      }
    }
    for (const subdir of this.subDirs) {
      reader.pos = subdir.offset
      subdir.parseDirectory()
    }
  }
}
