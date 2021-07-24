import type { IPropertyContainer } from './IPropertyContainer'
import { ErrorLevel, ErrorLogger } from './util/ErrorLogger'
import type { WzBinaryReader } from './util/WzBinaryReader'
import type { WzFile } from './WzFile'
import { WzImageProperty } from './WzImageProperty'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'

/**
 * @public
 */
export class WzImage extends WzObject implements IPropertyContainer {
  public parent: WzObject | null = null
  public name: string = ''
  public reader: WzBinaryReader
  public blockSize: number = 0
  public checksum: number = 0
  public offset: number = 0
  public blockStart: number

  public tempFileStart: bigint = BigInt(0)
  public tempFileEnd: bigint = BigInt(0)
  public changed: boolean = false
  public parseEverything: boolean = false

  public parsed: boolean = false

  public get isLuaImage (): boolean {
    return this.name.endsWith('.lua')
  }

  private readonly properties: Set<WzImageProperty> = new Set()
  public get wzProperties (): Set<WzImageProperty> {
    if (!this.parsed) throw new Error('Image has not been parsed yet')
    return this.properties
  }

  public get objectType (): WzObjectType {
    // if (!this.parsed) this.parseImage()
    return WzObjectType.Image
  }

  public constructor (name: string, reader: WzBinaryReader, checksum: number = 0) {
    super()
    this.name = name
    this.reader = reader
    this.blockStart = reader.pos
    this.checksum = checksum
  }

  public addProperty (prop: WzImageProperty): void {
    if (this.reader != null && !this.parsed) throw new Error('Image has not been parsed yet')
    prop.parent = this
    this.properties.add(prop)
  }

  public removeProperty (prop: WzImageProperty): void {
    if (!this.parsed) throw new Error('Image has not been parsed yet')
    prop.parent = null
    this.properties.delete(prop)
  }

  public addProperties (props: Set<WzImageProperty>): void {
    for (const prop of props) {
      this.addProperty(prop)
    }
  }

  public clearProperties (): void {
    for (const prop of this.properties) {
      prop.parent = null
    }
    this.properties.clear()
  }

  public set<T extends WzImageProperty> (name: string, value: T): void {
    if (value != null) {
      value.name = name
      this.addProperty(value)
    }
  }

  public dispose (): void {
    if (this._disposed) return
    for (const prop of this.properties) {
      prop.dispose()
    }
    this.properties.clear()
    this._disposed = true
  }

  public at (name: string): WzImageProperty | null {
    if (!this.parsed) throw new Error('Image has not been parsed yet')
    const nameLower = name.toLowerCase()
    for (const prop of this.properties) {
      if (prop.name.toLowerCase() === nameLower) return prop
    }
    return null
  }

  public get wzFileParent (): WzFile | null {
    if (this.parent != null) {
      return this.parent.wzFileParent
    }
    return null
  }

  public getFromPath (path: string): WzImageProperty | null {
    if (!this.parsed) throw new Error('Image has not been parsed yet')
    const segments = path.split(/[\\/]/)
    if (segments[0] === '..') return null
    let ret: WzImageProperty | null = null
    for (let x = 0; x < segments.length; x++) {
      let foundChild = false
      const list: Set<WzImageProperty> | null = (ret == null ? this.properties : ret.wzProperties)
      if (list != null) {
        const l: Set<WzImageProperty> = list
        for (const iwp of l) {
          if (iwp.name === segments[x]) {
            ret = iwp
            foundChild = true
            break
          }
        }
      }
      if (!foundChild) {
        return null
      }
    }
    return ret
  }

  public calculateAndSetImageChecksum (bytes: Uint8Array): void {
    this.checksum = 0
    for (let i = 0; i < bytes.length; i++) {
      this.checksum += bytes[i]
    }
  }

  public async parseImage (forceReadFromData: boolean = false): Promise<boolean> {
    if (!forceReadFromData) { // only check if parsed or changed if its not false read
      if (this.parsed) {
        return true
      } else if (this.changed) {
        this.parsed = true
        return true
      }
    }

    const reader = this.reader
    // const originalPos = reader.pos
    reader.pos = this.offset
    const b = await reader.readUInt8()
    switch (b) {
      case 0x1: {
        if (this.isLuaImage) {
          const lua = await WzImageProperty.parseLuaProperty(this.offset, reader, this, this)
          this.properties.add(lua)
          this.parsed = true
          return true
        }

        return false
      }
      case 0x73: {
        const prop = await reader.readWzString()
        const val = await reader.readUInt16LE()
        if (prop !== 'Property' || val !== 0) {
          return false
        }
        break
      }
      default: {
        ErrorLogger.log(ErrorLevel.MissingFeature, `[WzImage] New Wz image header found. b = ${b}`)
        return false
      }
    }

    const images = await WzImageProperty.parsePropertyList(this.offset, reader, this, this)
    for (const img of images) {
      this.properties.add(img)
    }

    this.parsed = true
    return true
  }
}
