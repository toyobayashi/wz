import { IDisposable } from './util/BinaryReader'
import { NotImplementedError } from './util/NotImplementedError'
import { WzFile } from './WzFile'
import { WzObjectType } from './WzObjectType'
import * as Jimp from 'jimp'

/**
 * @public
 */
export abstract class WzObject implements IDisposable {
  // public hcTag: any = null
  // public hcTag_spine: any = null
  // public msTag: any = null
  // public msTag_spine: any = null
  // public tag3: any = null

  public abstract dispose (): void

  public abstract name: string

  public abstract get objectType (): WzObjectType

  public abstract parent: WzObject | null

  public abstract get wzFileParent (): WzFile | null

  public abstract at (name: string): WzObject | null

  /**
   * @virtual
   */
  public get wzValue (): any {
    return null
  }

  /**
   * @virtual
   */
  public getBitmap (): Promise<Jimp | null> {
    throw new NotImplementedError('[WzObject#getBitmap]')
  }

  public getTopMostWzDirectory (): WzObject {
    let parent = this.parent
    if (parent == null) {
      return this
    }

    while (parent.parent != null) {
      parent = parent.parent
    }
    return parent
  }

  public get fullPath (): string {
    let result = this.name
    let currObj: WzObject = this
    while (currObj.parent != null) {
      currObj = currObj.parent
      result = currObj.name + '\\' + result
    }
    return result
  }

  // public abstract remove (): void
}
