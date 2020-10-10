import { WzLuaProperty } from './properties/WzLuaProperty'
import { NotImplementedError } from './util/NotImplementedError'
import { WzBinaryReader } from './util/WzBinaryReader'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'
import { WzPropertyType } from './WzPropertyType'

export abstract class WzImageProperty extends WzObject {
  public get wzProperties (): Set<WzImageProperty> | null {
    return null
  }

  public abstract get propertyType (): WzPropertyType
  public getFromPath (): WzImageProperty | null {
    return null
  }

  public at (_name: string): WzImageProperty | null {
    return null
  }

  public set (_name: string, _value: WzImageProperty): void {
    throw new NotImplementedError()
  }

  public get objectType (): WzObjectType {
    return WzObjectType.Property
  }

  public get parentImage (): WzImage | null {
    let parent = this.parent
    while (parent != null) {
      if (parent instanceof WzImage) return parent
      else parent = parent.parent
    }
    return null
  }

  public get wzFileParent (): WzFile | null {
    if (this.parentImage != null) {
      return this.parentImage.wzFileParent
    }
    return null
  }

  static ParseLuaProperty<P extends WzObject>(_offset: number, reader: WzBinaryReader, parent: P, _parentImg: WzImage): WzLuaProperty {
    // 28 71 4F EF 1B 65 F9 1F A7 48 8D 11 73 E7 F0 27 55 09 DD 3C 07 32 D7 38 21 57 84 70 C1 79 9A 3F 49 F7 79 03 41 F4 9D B9 1B 5F CF 26 80 3D EC 25 5F 9C
    // [compressed int] [bytes]
    const length = reader.readWzInt()
    const rawEncBytes = reader.read(length)

    const lua = new WzLuaProperty('Script', rawEncBytes)
    lua.parent = parent
    return lua
  }
}
