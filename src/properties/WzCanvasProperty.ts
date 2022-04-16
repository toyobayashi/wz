import { WzPropertyType } from '../WzPropertyType'
import type { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import type { IPropertyContainer } from '../IPropertyContainer'
import { WzImageProperty } from '../WzImageProperty'
import type { WzPngProperty } from './WzPngProperty'
import type { WzStringProperty } from './WzStringProperty'
import { WzImage } from '../WzImage'
import { WzDirectory } from '../WzDirectory'
import type { Canvas } from '../util/Canvas'

/**
 * @public
 */
export class WzCanvasProperty extends WzExtended implements IPropertyContainer {
  public get inlinkPropertyName (): string { return '_inlink' }
  public get outlinkPropertyName (): string { return '_outlink' }
  public get originPropertyName (): string { return 'origin' }
  public get headPropertyName (): string { return 'head' }
  public get ltPropertyName (): string { return 'lt' }
  public get animationDelayPropertyName (): string { return 'delay' }

  private readonly properties: Set<WzImageProperty> = new Set()

  public get wzProperties (): Set<WzImageProperty> {
    return this.properties
  }

  public addProperty (prop: WzImageProperty): void {
    prop.parent = this
    this.properties.add(prop)
  }

  public removeProperty (prop: WzImageProperty): void {
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

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Canvas
  }

  public dispose (): void {
    if (this._disposed) return
    for (const prop of this.properties) {
      prop.dispose()
    }
    this.properties.clear()
    if (this.pngProperty != null) {
      this.pngProperty.dispose()
      this.pngProperty = null
    }
    this._disposed = true
  }

  public parent: WzObject | null = null

  public pngProperty: WzPngProperty | null = null

  public get wzValue (): WzPngProperty | null {
    return this.pngProperty
  }

  public constructor (public name: string = '') {
    super()
  }

  public getProperty (name: string): WzImageProperty | null {
    const nameLower = name.toLowerCase()
    for (const iwp of this.properties) {
      if (iwp.name.toLowerCase() === nameLower) return iwp
    }
    return null
  }

  public at (name: string): WzImageProperty | null {
    if (name === 'PNG') return this.pngProperty
    const nameLower = name.toLowerCase()
    for (const iwp of this.properties) {
      if (iwp.name.toLowerCase() === nameLower) return iwp
    }
    return null
  }

  public set (name: string, value: WzImageProperty | null): void {
    if (value != null) {
      if (name === 'PNG') {
        this.pngProperty = value as WzPngProperty
        return
      }
      value.name = name
      this.addProperty(value)
    }
  }

  public setValue (value: Uint8Array): void {
    if (this.pngProperty != null) {
      this.pngProperty.setValue(value)
    }
  }

  public getFromPath (path: string): WzImageProperty | null {
    const segments = path.split(/[\\/]/)
    if (segments[0] === '..') {
      return (this.parent as WzImageProperty).at(segments.slice(1).join('/'))
    }
    let ret: WzImageProperty = this
    for (let x = 0; x < segments.length; x++) {
      let foundChild = false
      if (segments[x] === 'PNG') {
        return this.pngProperty
      }
      const list: Set<WzImageProperty> | null = ret.wzProperties
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

  public haveInlinkProperty (): boolean {
    return this.at(this.inlinkPropertyName) != null
  }

  public haveOutlinkProperty (): boolean {
    return this.at(this.outlinkPropertyName) != null
  }

  public async getLinkedWzCanvasBitmap (): Promise<Canvas | null> {
    const _inlink = (this.at(this.inlinkPropertyName) as WzStringProperty)?.value // could get nexon'd here. In case they place an _inlink that's not WzStringProperty
    const _outlink = (this.at(this.outlinkPropertyName) as WzStringProperty)?.value // could get nexon'd here. In case they place an _outlink that's not WzStringProperty

    if (_inlink != null) {
      let currentWzObj: WzObject | null = this // first object to work with
      while ((currentWzObj = currentWzObj.parent) != null) {
        if (!(currentWzObj instanceof WzImage)) continue // keep looping if its not a WzImage

        const wzImageParent = currentWzObj
        const foundProperty = wzImageParent.getFromPath(_inlink)
        if (foundProperty != null && foundProperty instanceof WzImageProperty) {
          return await foundProperty.getBitmap()
        }
      }
    } else if (_outlink != null) {
      let currentWzObj: WzObject | null = this // first object to work with
      while ((currentWzObj = currentWzObj.parent) != null) {
        if (!(currentWzObj instanceof WzDirectory)) continue // keep looping if its not a WzImage

        const wzFileParent = (currentWzObj).wzFile
        const match = wzFileParent.name.match(/^([A-Za-z]+)([0-9]*)\.wz/)!
        const prefixWz = match[1] + '/'
        let foundProperty: WzObject | null

        if (_outlink.indexOf(prefixWz) === 0) {
          // fixed root path
          const realpath = _outlink.replace(prefixWz, wzFileParent.name.replace('.wz', '') + '/')
          foundProperty = wzFileParent.getObjectFromPath(realpath)
        } else {
          foundProperty = wzFileParent.getObjectFromPath(_outlink)
        }
        if (foundProperty != null && foundProperty instanceof WzImageProperty) {
          return await foundProperty.getBitmap()
        }
      }
    }
    return await this.getBitmap()
  }

  public async getBitmap (): Promise<Canvas | null> {
    if (this.pngProperty != null) {
      return await this.pngProperty.getBitmap()
    }
    return null
  }
}
