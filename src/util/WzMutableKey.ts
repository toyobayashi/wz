import * as crypto from 'crypto'

/**
 * @public
 */
export class WzMutableKey {
  private static readonly _batchSize = 4096
  private _keys: Buffer | null = null

  public constructor (private readonly _iv: Buffer, private readonly _aesKey: Buffer) {}

  public at (index: number): number {
    if (this._keys == null || this._keys.length <= index) {
      this.ensureKeySize(index + 1)
    }
    return (this._keys as Buffer)[index]
  }

  public ensureKeySize (size: number): void {
    if (this._keys != null && this._keys.length >= size) {
      return
    }

    size = Math.ceil(1.0 * size / WzMutableKey._batchSize) * WzMutableKey._batchSize
    const newKeys = Buffer.alloc(size)

    if (this._iv.readInt32LE(0) === 0) {
      this._keys = newKeys
      return
    }

    let startIndex = 0

    if (this._keys != null) {
      this._keys.copy(newKeys, 0, 0)
      startIndex = this._keys.length
    }

    const aes = crypto.createCipheriv('aes-256-ecb', this._aesKey, null)
    aes.setAutoPadding(true)

    const ms = newKeys.slice(startIndex, newKeys.length - startIndex)

    for (let i = startIndex; i < size; i += 16) {
      if (i === 0) {
        const block = Buffer.alloc(16)
        for (let j = 0; j < block.length; j++) {
          block[j] = this._iv[j % 4]
        }
        aes.update(block)
      } else {
        aes.update(newKeys.slice(i - 16, i))
      }
    }

    const finalBuffer = aes.final()
    finalBuffer.copy(ms, 0, 0)

    this._keys = newKeys
  }
}
