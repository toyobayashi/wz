import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzImageProperty } from '../WzImageProperty'
import { WzImage } from '../WzImage'
import { WzDirectory } from '../WzDirectory'
import * as Jimp from 'jimp'

/**
 * @public
 */
export class WzUOLProperty extends WzExtended {
  public static UOLRES: boolean = true

  public get propertyType (): WzPropertyType {
    return WzPropertyType.UOL
  }

  private linkVal: WzObject | null = null

  public dispose (): void {
    this.name = ''
    this.val = ''
  }

  public get value (): string {
    return this.val
  }

  public get wzValue (): WzObject | null {
    if (WzUOLProperty.UOLRES) {
      return this.linkValue
    }
    return this
  }

  public get wzProperties (): Set<WzImageProperty> | null {
    return this.linkValue instanceof WzImageProperty ? this.linkValue.wzProperties : null
  }

  public at (name: string): WzImageProperty | null {
    return this.linkValue instanceof WzImageProperty ? this.linkValue.at(name) : this.linkValue instanceof WzImage ? this.linkValue.at(name) : null
  }

  public getFromPath (path: string): WzImageProperty | null {
    return this.linkValue instanceof WzImageProperty ? this.linkValue.getFromPath(path) : this.linkValue instanceof WzImage ? this.linkValue.getFromPath(path) : null
  }

  public get linkValue (): WzObject | null {
    if (this.linkVal == null) {
      const paths = this.val.split('/')
      this.linkVal = this.parent as WzObject
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const asdf = (this.parent as WzObject).fullPath
      for (const path of paths) {
        if (path === '..') {
          this.linkVal = this.linkVal!.parent as WzObject
        } else {
          if (this.linkVal instanceof WzImageProperty) {
            this.linkVal = this.linkVal.at(path)
          } else if (this.linkVal instanceof WzImage) {
            this.linkVal = this.linkVal.at(path)
          } else if (this.linkVal instanceof WzDirectory) {
            this.linkVal = this.linkVal.at(path)
          } else {
            console.error(`UOL got nexon'd at property: ${this.fullPath}`)
            return null
          }
        }
      }
    }
    return this.linkVal
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '', private val: string = '') {
    super()
  }

  public setValue (value: string): void {
    this.val = value
  }

  public toString (): string {
    return this.val
  }

  public async getBitmap (): Promise<Jimp | null> {
    if (this.linkValue != null) {
      return await this.linkValue.getBitmap()
    }
    return null
  }
}
