import { WzBinaryProperty } from './properties/WzBinaryProperty'
import { WzCanvasProperty } from './properties/WzCanvasProperty'
import { WzConvexProperty } from './properties/WzConvexProperty'
import { WzDoubleProperty } from './properties/WzDoubleProperty'
import { WzFloatProperty } from './properties/WzFloatProperty'
import { WzIntProperty } from './properties/WzIntProperty'
import { WzLongProperty } from './properties/WzLongProperty'
import { WzLuaProperty } from './properties/WzLuaProperty'
import { WzNullProperty } from './properties/WzNullProperty'
import { WzPngProperty } from './properties/WzPngProperty'
import { WzShortProperty } from './properties/WzShortProperty'
import { WzStringProperty } from './properties/WzStringProperty'
import { WzSubProperty } from './properties/WzSubProperty'
import { WzUOLProperty } from './properties/WzUOLProperty'
import { WzVectorProperty } from './properties/WzVectorProperty'
import { NotImplementedError } from './util/NotImplementedError'
import { WzBinaryReader } from './util/WzBinaryReader'
import { WzExtended } from './WzExtended'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import { WzObject } from './WzObject'
import { WzObjectType } from './WzObjectType'
import { WzPropertyType } from './WzPropertyType'

/**
 * @public
 */
export abstract class WzImageProperty extends WzObject {
  public get wzProperties (): Set<WzImageProperty> | null {
    return null
  }

  public abstract get propertyType (): WzPropertyType
  public getFromPath (_path: string): WzImageProperty | null {
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

  public static parseLuaProperty<P extends WzObject>(_offset: number, reader: WzBinaryReader, parent: P, _parentImg: WzImage): WzLuaProperty {
    // 28 71 4F EF 1B 65 F9 1F A7 48 8D 11 73 E7 F0 27 55 09 DD 3C 07 32 D7 38 21 57 84 70 C1 79 9A 3F 49 F7 79 03 41 F4 9D B9 1B 5F CF 26 80 3D EC 25 5F 9C
    // [compressed int] [bytes]
    const length = reader.readWzInt()
    const rawEncBytes = reader.read(length)

    const lua = new WzLuaProperty('Script', rawEncBytes)
    lua.parent = parent
    return lua
  }

  public static parsePropertyList<P extends WzObject>(offset: number, reader: WzBinaryReader, parent: P, parentImg: WzImage): Set<WzImageProperty> {
    const entryCount = reader.readWzInt()
    const properties = new Set<WzImageProperty>(/* entryCount */)
    for (let i = 0; i < entryCount; i++) {
      const name = reader.readStringBlock(offset)
      const ptype = reader.readUInt8()
      switch (ptype) {
        case 0: {
          const p = new WzNullProperty(name)
          p.parent = parent
          properties.add(p)
          break
        }
        case 11:
        case 2: {
          const p = new WzShortProperty(name, reader.readInt16LE())
          p.parent = parent
          properties.add(p)
          break
        }
        case 3:
        case 19: {
          const p = new WzIntProperty(name, reader.readWzInt())
          p.parent = parent
          properties.add(p)
          break
        }
        case 20: {
          const p = new WzLongProperty(name, reader.readWzLong())
          p.parent = parent
          properties.add(p)
          break
        }
        case 4: {
          const type = reader.readUInt8()
          let p: WzFloatProperty
          if (type === 0x80) {
            p = new WzFloatProperty(name, reader.readFloatLE())
            p.parent = parent
            properties.add(p)
          } else if (type === 0) {
            p = new WzFloatProperty(name, 0)
            p.parent = parent
            properties.add(p)
          }
          break
        }
        case 5: {
          const p = new WzDoubleProperty(name, reader.readDoubleLE())
          p.parent = parent
          properties.add(p)
          break
        }
        case 8: {
          const p = new WzStringProperty(name, reader.readStringBlock(offset))
          p.parent = parent
          properties.add(p)
          break
        }
        case 9: {
          const eob = reader.readUInt32LE() + reader.pos
          const exProp = this.parseExtendedProp(reader, offset, eob, name, parent, parentImg)
          properties.add(exProp)
          if (reader.pos !== eob) {
            reader.pos = eob
          }
          break
        }
        default:
          throw new Error(`Unknown property type at ParsePropertyList, ptype = ${ptype}`)
      }
    }
    return properties
  }

  public static parseExtendedProp<P extends WzObject> (reader: WzBinaryReader, offset: number, endOfBlock: number, name: string, parent: P, imgParent: WzImage): WzExtended {
    switch (reader.readUInt8()) {
      case 0x01:
      case 0x1B:
        return this.extractMore(reader, offset, endOfBlock, name, reader.readWzStringAtOffset(offset + reader.readInt32LE()), parent, imgParent)
      case 0x00:
      case 0x73:
        return this.extractMore(reader, offset, endOfBlock, name, '', parent, imgParent)
      default:
        throw new Error('Invalid byte read at ParseExtendedProp')
    }
  }

  public static extractMore<P extends WzObject> (reader: WzBinaryReader, offset: number, _eob: number, name: string, iname: string, parent: P, imgParent: WzImage): WzExtended {
    if (iname === '') {
      iname = reader.readWzString()
    }

    switch (iname) {
      case 'Property': {
        const subProp = new WzSubProperty(name)
        subProp.parent = parent
        reader.pos += 2 // Reserved?
        subProp.addProperties(WzImageProperty.parsePropertyList(offset, reader, subProp, imgParent))
        return subProp
      }
      case 'Canvas': {
        const canvasProp = new WzCanvasProperty(name)
        reader.pos++
        if (reader.readUInt8() === 1) {
          reader.pos += 2
          canvasProp.addProperties(WzImageProperty.parsePropertyList(offset, reader, canvasProp, imgParent))
        }
        canvasProp.pngProperty = new WzPngProperty(reader, imgParent.parseEverything)
        canvasProp.pngProperty.parent = canvasProp
        return canvasProp
      }
      case 'Shape2D#Vector2D': {
        const vecProp = new WzVectorProperty(name)
        vecProp.parent = parent
        vecProp.x = new WzIntProperty('X', reader.readWzInt())
        vecProp.x.parent = vecProp
        vecProp.y = new WzIntProperty('Y', reader.readWzInt())
        vecProp.y.parent = vecProp
        return vecProp
      }
      case 'Shape2D#Convex2D': {
        const convexProp = new WzConvexProperty(name)
        convexProp.parent = parent
        const convexEntryCount = reader.readWzInt()
        // convexProp.wzProperties.capacity = convexEntryCount
        for (let i = 0; i < convexEntryCount; i++) {
          convexProp.addProperty(this.parseExtendedProp(reader, offset, 0, name, convexProp, imgParent))
        }
        return convexProp
      }
      case 'Sound_DX8': {
        const soundProp = new WzBinaryProperty(name, reader, imgParent.parseEverything)
        soundProp.parent = parent
        return soundProp
      }
      case 'UOL':
        reader.pos++
        switch (reader.readUInt8()) {
          case 0: {
            const p = new WzUOLProperty(name, reader.readWzString())
            p.parent = parent
            return p
          }
          case 1: {
            const p = new WzUOLProperty(name, reader.readWzStringAtOffset(offset + reader.readInt32LE()))
            p.parent = parent
            return p
          }
        }
        throw new Error('Unsupported UOL type')
      default:
        throw new Error('Unknown iname: ' + iname)
    }
  }
}
