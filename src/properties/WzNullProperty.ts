import { WzPropertyType } from '../WzPropertyType'
import type { WzObject } from '../WzObject'
import { NotImplementedError } from '../util/NotImplementedError'
import { WzImageProperty } from '../WzImageProperty'

/**
 * @public
 */
export class WzNullProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Null
  }

  public dispose (): void {
    if (this._disposed) return
    this._disposed = true
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '') {
    super()
  }

  public setValue (_value: unknown): void {
    throw new NotImplementedError('[WzNullProperty#setValue]')
  }
}
