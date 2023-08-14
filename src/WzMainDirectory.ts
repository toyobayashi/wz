import type { WzDirectory } from './WzDirectory'
import type { WzFile } from './WzFile'

/** @public */
export class WzMainDirectory {
  public file: WzFile
  private readonly _directory: WzDirectory | undefined

  public constructor (file: WzFile, directory?: WzDirectory) {
    this.file = file
    this._directory = directory
  }

  public get directory (): WzDirectory | null {
    return this._directory ?? this.file.wzDirectory
  }
}
