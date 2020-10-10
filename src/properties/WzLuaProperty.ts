import { MapleCryptoConstants } from '../util/MapleCryptoConstants'
import { NotImplementedError } from '../util/NotImplementedError'
import { WzKeyGenerator } from '../util/WzKeyGenerator'
import { WzMutableKey } from '../util/WzMutableKey'
import { WzImageProperty } from '../WzImageProperty'
import { WzObject } from '../WzObject'
import { WzPropertyType } from '../WzPropertyType'

export class WzLuaProperty extends WzImageProperty {
  public wzKey: WzMutableKey

  public static USE_IV_KEY: Buffer = MapleCryptoConstants.WZ_MSEAIV

  public wzProperties: Set<WzImageProperty> = new Set()
  public parent: WzObject | null = null

  public constructor (public name: string, public encryptedBytes: Buffer) {
    super()
    this.wzKey = WzKeyGenerator.generateWzKey(WzLuaProperty.USE_IV_KEY)
  }

  public setValue (value: Buffer): void {
    this.encryptedBytes = value
  }

  public get wzValue (): Buffer {
    return this.value
  }

  public get value (): Buffer {
    return this.encryptedBytes
  }

  public get propertyType (): WzPropertyType {
    return WzPropertyType.Lua
  }

  public toString (): string {
    return this.encodeDecode(this.encryptedBytes).toString('ascii')
  }

  public encodeDecode (input: Buffer): Buffer {
    const newArray = Buffer.alloc(input.length)
    for (let i = 0; i < input.length; i++) {
      const encryptedChar = ((input[i] ^ this.wzKey.at(i)) & 0xFF)
      newArray[i] = encryptedChar
    }
    return newArray
  }

  public getFromPath (): WzImageProperty {
    throw new NotImplementedError()
  }

  public at (_name: string): WzImageProperty {
    throw new NotImplementedError()
  }

  public dispose (): void {
    this.name = ''
    this.encryptedBytes = Buffer.alloc(0)
  }
}
