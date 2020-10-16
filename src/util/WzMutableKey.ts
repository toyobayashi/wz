import { crypto } from './node'
import { BinaryReader } from '@tybys/binreader'

/**
 * @public
 */
export class WzMutableKey {
  private static readonly _batchSize = 4096
  private _keys: Uint8Array | null = null

  public constructor (private readonly _iv: Uint8Array, private readonly _aesKey: Uint8Array) {}

  public at (index: number): number {
    if (this._keys == null || this._keys.length <= index) {
      this.ensureKeySize(index + 1)
    }
    return (this._keys as Uint8Array)[index]
  }

  public ensureKeySize (size: number): void {
    if (this._keys != null && this._keys.length >= size) {
      return
    }

    size = Math.ceil(1.0 * size / WzMutableKey._batchSize) * WzMutableKey._batchSize
    const newKeys = new Uint8Array(size)

    const r = new BinaryReader(this._iv)
    // const tmp = this._iv.readInt32LE(0)
    const tmp = r.readInt32LE()
    r.dispose()
    if (tmp === 0) {
      this._keys = newKeys
      return
    }

    let startIndex = 0

    if (this._keys != null) {
      // this._keys.copy(newKeys, 0, 0)
      newKeys.set(this._keys, 0)
      startIndex = this._keys.length
    }

    const aes = crypto.createCipheriv('aes-256-ecb', this._aesKey, null)
    aes.setAutoPadding(true)

    // const ms = newKeys.slice(startIndex, newKeys.length - startIndex)
    const ms = newKeys.subarray(startIndex, newKeys.length - startIndex)

    for (let i = startIndex; i < size; i += 16) {
      if (i === 0) {
        const block = new Uint8Array(16)
        for (let j = 0; j < block.length; j++) {
          block[j] = this._iv[j % 4]
        }
        const buf = aes.update(block)
        ms.set(buf, i)
        // buf.copy(ms, i, 0)
      } else {
        // const buf = aes.update(newKeys.slice(i - 16, i))
        const buf = aes.update(newKeys.subarray(i - 16, i))
        ms.set(buf, i)
        // buf.copy(ms, i, 0)
      }
    }

    this._keys = newKeys
  }
}
