import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzImageProperty } from '../WzImageProperty'

export class WzIntProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Int
  }

  public dispose (): void {
    this.name = ''
    this.val = 0
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
