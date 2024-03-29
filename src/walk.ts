/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { WzUOLProperty } from './properties/WzUOLProperty'
import type { WzDirectory } from './WzDirectory'
import { WzFile } from './WzFile'
import { WzImage } from './WzImage'
import type { WzImageProperty } from './WzImageProperty'
import type { WzMapleVersion } from './WzMapleVersion'
import type { WzObject } from './WzObject'
import { init } from './init'
import { WzFileParseStatus, getErrorDescription } from './WzFileParseStatus'

/**
 * @public
 * @returns `true` if stop manually
 */
export async function walkWzFileAsync (filepath: string | File, mapleVersion: WzMapleVersion, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<boolean> {
  await init()
  const wz = new WzFile(filepath, mapleVersion)
  const r = await wz.parseWzFile()
  if (r !== WzFileParseStatus.SUCCESS) {
    wz.dispose()
    throw new Error(getErrorDescription(r))
  }

  const stop = await walkDirectory(wz.wzDirectory as WzDirectory, callback)

  wz.dispose()
  return stop
}

/**
 * @public
 * @returns `true` if stop manually
 */
export async function walkDirectory (dir: WzDirectory, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<boolean> {
  let stop = !!(await Promise.resolve(callback(dir)))
  if (stop) {
    dir.dispose()
    return stop
  }
  for (const subdir of dir.wzDirectories) {
    stop = await walkDirectory(subdir, callback)
    if (stop) {
      dir.dispose()
      return stop
    }
  }
  for (const img of dir.wzImages) {
    stop = await walkPropertyContainer(img, callback)
    if (stop) {
      dir.dispose()
      return stop
    }
  }
  dir.dispose()
  return stop
}

/**
 * @public
 * @returns `true` if stop manually
 */
export async function walkPropertyContainer (container: WzImageProperty | WzImage, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<boolean> {
  if (container instanceof WzImage) {
    await container.parseImage()
  }
  let stop = !!(await Promise.resolve(callback(container)))
  if (!stop && !(container instanceof WzUOLProperty) && container.wzProperties != null) {
    for (const prop of container.wzProperties) {
      stop = await walkPropertyContainer(prop, callback)
      if (stop) break
    }
  }
  if (container instanceof WzImage) {
    container.dispose()
  }
  return stop
}
