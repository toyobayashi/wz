import { WzBinaryReader } from './util/WzBinaryReader'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'

export class WzDirectory extends WzObject {
  private readonly images: Map<string, WzImage> = new Map()
  private readonly subDirs: Map<string, WzDirectory> = new Map()
  public reader: WzBinaryReader
  public offset: number = 0
  public name: string
  public hash: number
  public blockSize: number = 0
  public checksum: number = 0
  // private offsetSize: number = 0
  private readonly wzIv: Buffer
  public parent: WzObject | null = null
  private wzFile: WzFile

  public dispose (): void {
    this.name = ''
    // this.reader.dispose()
    for (const [, img] of this.images) {
      img.dispose()
    }
    for (const [, dir] of this.subDirs) {
      dir.dispose()
    }
    this.images.clear()
    this.subDirs.clear()
  }

  public get objectType (): WzObjectType {
    return WzObjectType.Directory
  }

  public get wzFileParent (): WzFile | null {
    return this.wzFile
  }

  public get wzImages (): Map<string, WzImage> {
    return this.images
  }

  public get wzDirectories (): Map<string, WzDirectory> {
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
    if (this.images.has(name)) {
      return this.images.get(name) ?? null
    }
    if (this.subDirs.has(name)) {
      return this.subDirs.get(name) ?? null
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
    this.subDirs.set(dir.name, dir)
    dir.wzFile = this.wzFile
    dir.parent = this
  }

  public addImage (img: WzImage): void {
    this.images.set(img.name, img)
    img.parent = this
  }

  public clearDirectories (): void {
    for (const [, dir] of this.subDirs) {
      dir.parent = null
    }
    this.subDirs.clear()
  }

  public clearImages (): void {
    for (const [, img] of this.images) {
      img.parent = null
    }
    this.images.clear()
  }

  public getImageByName (name: string): WzImage | null {
    return this.images.get(name) ?? null
  }

  public getDirectoryByName (name: string): WzDirectory | null {
    return this.subDirs.get(name) ?? null
  }

  public getChildImages (): Map<string, WzImage> {
    const imgFiles = new Map<string, WzImage>()
    for (const img of this.images) {
      imgFiles.set(img[0], img[1])
    }
    for (const [, subDir] of this.subDirs) {
      const list = subDir.getChildImages()
      for (const img of list) {
        imgFiles.set(img[0], img[1])
      }
    }
    return imgFiles
  }

  public setVersionHash (newHash: number): void {
    this.hash = newHash
    for (const [, dir] of this.subDirs) {
      dir.setVersionHash(newHash)
    }
  }

  public parseImages (): void {
    for (const [, img] of this.images) {
      if (this.reader.pos !== img.offset) {
        this.reader.pos = img.offset
      }
      img.parseImage()
    }
    for (const [, subdir] of this.subDirs) {
      if (this.reader.pos !== subdir.offset) {
        this.reader.pos = subdir.offset
      }
      subdir.parseImages()
    }
  }

  public parseDirectory (lazyParse: boolean = false): void {
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
        this.subDirs.set(fname, subDir)

        if (lazyParse) break
      } else {
        const img = new WzImage(fname, reader, checksum)
        img.blockSize = fsize
        img.offset = offset
        img.parent = this
        this.images.set(fname, img)

        if (lazyParse) break
      }
    }
    for (const [, subdir] of this.subDirs) {
      reader.pos = subdir.offset
      subdir.parseDirectory()
    }
  }
}
