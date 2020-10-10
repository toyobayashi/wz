import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { IPropertyContainer } from '../IPropertyContainer'
import { WzImageProperty } from '../WzImageProperty'
import { NotImplementedError } from '../util/NotImplementedError'
import { WzPngProperty } from './WzPngProperty'

export class WzCanvasProperty extends WzExtended implements IPropertyContainer {
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
    this.name = ''
    for (const prop of this.properties) {
      prop.dispose()
    }
    this.properties.clear()
    if (this.pngProperty != null) {
      this.pngProperty.dispose()
      this.pngProperty = null
    }
  }

  public parent: WzObject | null = null

  public pngProperty: WzPngProperty | null = null

  public constructor (public name: string = '') {
    super()
    // TODO
  }

  public setValue (_value: unknown): void {
    throw new NotImplementedError()
  }
}
