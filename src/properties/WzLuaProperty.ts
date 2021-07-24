import { WzKeyGenerator } from '../util/WzKeyGenerator'
import type { WzMutableKey } from '../util/WzMutableKey'
import { WzImageProperty } from '../WzImageProperty'
import type { WzObject } from '../WzObject'
import { WzPropertyType } from '../WzPropertyType'
import { asciiTextDecoder } from '../util/node'

/**
 * @public
 */
export class WzLuaProperty extends WzImageProperty {
  public wzKey: WzMutableKey

  public parent: WzObject | null = null

  public constructor (public name: string, public encryptedBytes: Uint8Array | null) {
    super()
    this.wzKey = WzKeyGenerator.generateLuaWzKey()
  }

  public setValue (value: Uint8Array): void {
    this.encryptedBytes = value
  }

  public get wzValue (): Uint8Array | null {
    return this.value
  }

  public get value (): Uint8Array | null {
    return this.encryptedBytes
  }

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Lua
  }

  public toString (): string {
    if (this.encryptedBytes == null) return ''
    return asciiTextDecoder.decode(this.encodeDecode(this.encryptedBytes))
  }

  private encodeDecode (input: Uint8Array): Uint8Array {
    const newArray = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const encryptedChar = ((input[i] ^ this.wzKey.at(i)) & 0xFF)
      newArray[i] = encryptedChar
    }
    return newArray
  }

  public dispose (): void {
    if (this._disposed) return
    this.encryptedBytes = null
    this._disposed = true
  }
}
