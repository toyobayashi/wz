import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { IPropertyContainer } from '../IPropertyContainer'
import { WzImageProperty } from '../WzImageProperty'
import { NotImplementedError } from '../util/NotImplementedError'

/**
 * @public
 */
export class WzSubProperty extends WzExtended implements IPropertyContainer {
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
    return WzPropertyType.SubProperty
  }

  public dispose (): void {
    if (this._disposed) return
    for (const prop of this.properties) {
      prop.dispose()
    }
    this.properties.clear()
    this._disposed = true
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '') {
    super()
  }

  public setValue (_value: unknown): void {
    throw new NotImplementedError('[WzSubProperty#setValue]')
  }

  public set<T extends WzImageProperty> (name: string, value: T): void {
    if (value != null) {
      value.name = name
      this.addProperty(value)
    }
  }

  public at (name: string): WzImageProperty | null {
    const nameLower = name.toLowerCase()
    for (const prop of this.properties) {
      if (prop.name.toLowerCase() === nameLower) return prop
    }
    return null
  }

  public getFromPath (path: string): WzImageProperty | null {
    const segments = path.split('/')
    if (segments[0] === '..') {
      return (this.parent as WzImageProperty).at(path.substring(this.name.indexOf('/') + 1))
    }
    let ret: WzImageProperty = this
    for (let x = 0; x < segments.length; x++) {
      let foundChild = false
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
}
