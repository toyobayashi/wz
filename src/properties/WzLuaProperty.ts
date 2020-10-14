import { MapleCryptoConstants } from '../util/MapleCryptoConstants'
import { WzKeyGenerator } from '../util/WzKeyGenerator'
import { WzMutableKey } from '../util/WzMutableKey'
import { WzImageProperty } from '../WzImageProperty'
import { WzObject } from '../WzObject'
import { WzPropertyType } from '../WzPropertyType'

/**
 * @public
 */
export class WzLuaProperty extends WzImageProperty {
  public wzKey: WzMutableKey

  public static readonly USE_IV_KEY: Buffer = MapleCryptoConstants.WZ_MSEAIV

  public parent: WzObject | null = null

  public constructor (public name: string, public encryptedBytes: Buffer | null) {
    super()
    this.wzKey = WzKeyGenerator.generateWzKey(WzLuaProperty.USE_IV_KEY)
  }

  public setValue (value: Buffer): void {
    this.encryptedBytes = value
  }

  public get wzValue (): Buffer | null {
    return this.value
  }

  public get value (): Buffer | null {
    return this.encryptedBytes
  }

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Lua
  }

  public toString (): string {
    if (this.encryptedBytes == null) return ''
    return this.encodeDecode(this.encryptedBytes).toString('ascii')
  }

  private encodeDecode (input: Buffer): Buffer {
    const newArray = Buffer.alloc(input.length)
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
