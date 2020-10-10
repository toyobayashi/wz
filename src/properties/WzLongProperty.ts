import { WzPropertyType } from '../WzPropertyType'
import { WzObject } from '../WzObject'
import { WzImageProperty } from '../WzImageProperty'

/**
 * @public
 */
export class WzLongProperty extends WzImageProperty {
  public get propertyType (): WzPropertyType {
    return WzPropertyType.Long
  }

  public dispose (): void {
    this.name = ''
    this.val = 0n
  }

  public get value (): bigint {
    return this.val
  }

  public get wzValue (): bigint {
    return this.val
  }

  public parent: WzObject | null = null

  public constructor (public name: string = '', private val: bigint = 0n) {
    super()
  }

  public setValue (value: bigint | number): void {
    this.val = BigInt(value)
  }

  public toString (): string {
    return this.val.toString()
  }
}
