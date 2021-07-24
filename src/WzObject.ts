import type { Canvas } from './util/Canvas'
import type { IDisposable } from './util/IDisposable'
import { NotImplementedError } from './util/NotImplementedError'
import type { WzFile } from './WzFile'
import type { WzObjectType } from './WzObjectType'
import { path } from './util/node'

/**
 * @public
 */
export abstract class WzObject implements IDisposable {
  // public hcTag: any = null
  // public hcTag_spine: any = null
  // public msTag: any = null
  // public msTag_spine: any = null
  // public tag3: any = null

  protected _disposed: boolean = false

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
  public getBitmap (): Promise<Canvas | null> {
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
      result = currObj.name + path.sep + result
    }
    return result
  }

  // public abstract remove (): void
}
