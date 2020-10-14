/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { WzUOLProperty } from './properties/WzUOLProperty'
import { WzDirectory } from './WzDirectory'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import { WzImageProperty } from './WzImageProperty'
import { WzMapleVersion } from './WzMapleVersion'
import { WzObject } from './WzObject'

/**
 * @public
 */
export function walkWzFile (filepath: string, mapleVersion: WzMapleVersion, callback: <T extends WzObject>(obj: T) => boolean | undefined): void {
  const wz = new WzFile(filepath, mapleVersion)
  const result = WzFile.createParseResult()
  const r = wz.parseWzFile(result)
  if (!r) {
    throw new Error(result.message)
  }

  let stop = false
  walkDirectory(wz.wzDirectory as WzDirectory, callback)

  wz.dispose()

  function walkPropertyContainer (container: WzImageProperty | WzImage, callback: <T extends WzObject>(obj: T) => boolean | undefined): void {
    stop = !!(callback(container))
    if (!stop && !(container instanceof WzUOLProperty) && container.wzProperties != null) {
      for (const prop of container.wzProperties) {
        walkPropertyContainer(prop, callback)
        if (stop) break
      }
    }
    container.dispose()
  }

  function walkDirectory (dir: WzDirectory, callback: <T extends WzObject>(obj: T) => boolean | undefined): void {
    stop = !!callback(dir)
    if (stop) {
      dir.dispose()
      return
    }
    for (const subdir of dir.wzDirectories) {
      walkDirectory(subdir, callback)
      if (stop) {
        dir.dispose()
        return
      }
    }
    for (const img of dir.wzImages) {
      img.parseImage()
      walkPropertyContainer(img, callback)
      if (stop) {
        dir.dispose()
        return
      }
    }
    dir.dispose()
  }
}

/**
 * @public
 */
export async function walkWzFileAsync (filepath: string, mapleVersion: WzMapleVersion, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<void> {
  await Promise.resolve() // next tick
  const wz = new WzFile(filepath, mapleVersion)
  const result = WzFile.createParseResult()
  const r = wz.parseWzFile(result)
  if (!r) {
    throw new Error(result.message)
  }

  let stop = false
  await walkDirectory(wz.wzDirectory as WzDirectory, callback)

  wz.dispose()

  async function walkPropertyContainer (container: WzImageProperty | WzImage, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<void> {
    stop = !!(await Promise.resolve(callback(container)))
    if (!stop && !(container instanceof WzUOLProperty) && container.wzProperties != null) {
      for (const prop of container.wzProperties) {
        await walkPropertyContainer(prop, callback)
        if (stop) break
      }
    }
    container.dispose()
  }

  async function walkDirectory (dir: WzDirectory, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<void> {
    stop = !!(await Promise.resolve(callback(dir)))
    if (stop) {
      dir.dispose()
      return
    }
    for (const subdir of dir.wzDirectories) {
      await walkDirectory(subdir, callback)
      if (stop) {
        dir.dispose()
        return
      }
    }
    for (const img of dir.wzImages) {
      img.parseImage()
      await walkPropertyContainer(img, callback)
      if (stop) {
        dir.dispose()
        return
      }
    }
    dir.dispose()
  }
}
