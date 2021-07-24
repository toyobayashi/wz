import { WzPropertyType } from '../WzPropertyType'
import type { WzObject } from '../WzObject'
import { WzImageProperty } from '../WzImageProperty'

/**
 * @public
 */
export class WzIntProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Int
  }

  public dispose (): void {
    if (this._disposed) return
    this._disposed = true
  }

  public get value (): number {
    return this.val
  }

  public get wzValue (): number {
    return this.val
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '', private val: number = 0) {
    super()
  }

  public setValue (value: number): void {
    this.val = value
  }

  public toString (): string {
    return this.val.toString()
  }
}
