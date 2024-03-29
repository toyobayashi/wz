import { WzPropertyType } from '../WzPropertyType'
import type { WzObject } from '../WzObject'
import { WzImageProperty } from '../WzImageProperty'

/**
 * @public
 */
export class WzStringProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.String
  }

  public dispose (): void {
    if (this._disposed) return
    this._disposed = true
  }

  public get value (): string {
    return this.val
  }

  public get wzValue (): string {
    return this.val
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
}
