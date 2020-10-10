import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzExtended } from '../WzExtended'
import { WzIntProperty } from './WzIntProperty'

/**
 * @public
 */
export class WzVectorProperty extends WzExtended {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Vector
  }

  public dispose (): void {
    this.name = ''
    if (this.x != null) {
      this.x.dispose()
      this.x = null
    }
    if (this.y != null) {
      this.y.dispose()
      this.y = null
    }
  }

  public get wzValue (): { x: number; y: number } {
    return {
      x: this.x != null ? this.x.value : 0,
      y: this.y != null ? this.y.value : 0
    }
  }

  public name: string = ''
  public parent: WzObject | null = null
  public x: WzIntProperty | null = null
  public y: WzIntProperty | null = null

  public constructor (name: string = '', x?: number, y?: number) {
    super()
    this.name = name
    if (x != null) this.x = new WzIntProperty('', x)
    if (y != null) this.y = new WzIntProperty('', y)
  }

  public setValue (value: { x: number; y: number }): void {
    if (this.x != null) this.x.setValue(value.x)
    if (this.y != null) this.y.setValue(value.y)
  }

  public toString (): string {
    if (this.x != null && this.y != null) {
      return 'X: ' + this.x.value.toString() + ', Y: ' + this.y.value.toString()
    }
    return ''
  }
}
