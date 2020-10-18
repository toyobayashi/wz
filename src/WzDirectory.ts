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
  private readonly wzIv: Uint8Array
  public parent: WzObject | null = null
  public wzFile: WzFile

  private parsed: boolean = false

  public dispose (): void {
    if (this._disposed) return
    this._clearAllChildren()
    this._disposed = true
  }

  private _clearAllChildren (): void {
    for (const img of this.images) {
      img.dispose()
    }
    for (const dir of this.subDirs) {
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

  public get wzImages (): Set<WzImage> {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    return this.images
  }

  public get wzDirectories (): Set<WzDirectory> {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    return this.subDirs
  }

  public constructor (reader: WzBinaryReader, name: string, hash: number, wzIv: Uint8Array, wzFile: WzFile) {
    super()
    this.reader = reader
    this.name = name
    this.hash = hash
    this.wzIv = wzIv
    this.wzFile = wzFile
  }

  public at (name: string): WzObject | null {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
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
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    const nameLower = name.toLowerCase()
    for (const img of this.images) {
      if (img.name.toLowerCase() === nameLower) return img
    }
    return null
  }

  public getDirectoryByName (name: string): WzDirectory | null {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    const nameLower = name.toLowerCase()
    for (const dir of this.subDirs) {
      if (dir.name.toLowerCase() === nameLower) return dir
    }
    return null
  }

  public getChildImages (): Set<WzImage> {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
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
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    this.hash = newHash
    for (const dir of this.subDirs) {
      dir.setVersionHash(newHash)
    }
  }

  public async parseImages (): Promise<void> {
    if (!this.parsed) throw new Error('Directory has not been parsed yet')
    for (const img of this.images) {
      if (this.reader.pos !== img.offset) {
        this.reader.pos = img.offset
      }
      await img.parseImage()
    }
    for (const subdir of this.subDirs) {
      if (this.reader.pos !== subdir.offset) {
        this.reader.pos = subdir.offset
      }
      await subdir.parseImages()
    }
  }

  public async parseDirectory (lazyParse: boolean = false): Promise<void> {
    if (this.parsed) return
    this._clearAllChildren()
    if (this.reader.pos !== this.offset) {
      this.reader.pos = this.offset
    }
    const reader = this.reader
    const entryCount = await reader.readWzInt()
    if (entryCount < 0 || entryCount > 100000) throw new Error('Invalid wz version used for decryption, try parsing other version numbers.')

    for (let i = 0; i < entryCount; i++) {
      let type = await reader.readUInt8()
      let fname = ''
      var fsize: number
      var checksum: number
      var offset: number
      let rememberPos = 0
      switch (type) {
        case 1: {
          /* const unknown =  */await reader.readInt32LE()
          await reader.readInt16LE()
          /* const offs =  */await reader.readWzOffset()
          continue
        }
        case 2: {
          const stringOffset = await reader.readInt32LE()
          rememberPos = reader.pos
          reader.pos = reader.header.fstart + stringOffset
          type = await reader.readUInt8()
          fname = await reader.readWzString()
          break
        }
        case 3:
        case 4: {
          fname = await reader.readWzString()
          rememberPos = reader.pos
          break
        }
        default: break
      }
      reader.pos = rememberPos
      fsize = await reader.readWzInt()
      checksum = await reader.readWzInt()
      offset = await reader.readWzOffset()
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
    this.parsed = true
    if (!lazyParse) {
      for (const subdir of this.subDirs) {
        // reader.pos = subdir.offset
        await subdir.parseDirectory(lazyParse)
      }
    }
  }
}
