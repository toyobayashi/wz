import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { NotImplementedError } from '../util/NotImplementedError'
import { WzImageProperty } from '../WzImageProperty'

export class WzNullProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Null
  }

  public dispose (): void {
    this.name = ''
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '') {
    super()
  }

  public setValue (_value: unknown): void {
    throw new NotImplementedError()
  }
}
