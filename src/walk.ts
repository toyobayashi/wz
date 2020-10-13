/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { IPropertyContainer } from './IPropertyContainer'
import { WzDirectory } from './WzDirectory'
import { WzFile } from './WzFile'
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

  // wz.wzDirectory.parseImages()
  let stop = false
  walkDirectory(wz.wzDirectory as WzDirectory, callback)

  wz.dispose()

  function walkPropertyContainer (container: WzImageProperty | IPropertyContainer, callback: <T extends WzObject>(obj: T) => boolean | undefined): void {
    if (container.wzProperties == null) return
    for (const prop of container.wzProperties) {
      // console.log(prop.fullPath, WzPropertyType[prop.propertyType])
      stop = !!callback(prop)
      if (stop) return
      if (prop.wzProperties != null) {
        walkPropertyContainer(prop, callback)
        prop.dispose()
        if (stop) return
      }
    }
    if (typeof (container as any).dispose === 'function') {
      (container as any).dispose()
    }
  }

  function walkDirectory (dir: WzDirectory, callback: <T extends WzObject>(obj: T) => boolean | undefined): void {
    stop = !!callback(dir)
    if (stop) return
    for (const img of dir.wzImages) {
      img.parseImage()
      stop = !!callback(img)
      if (stop) return
      walkPropertyContainer(img, callback)
      img.dispose()
      if (stop) return
    }
    for (const subdir of dir.wzDirectories) {
      stop = !!callback(subdir)
      if (stop) return
      walkDirectory(subdir, callback)
      subdir.dispose()
      if (stop) return
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

  async function walkPropertyContainer (container: WzImageProperty | IPropertyContainer, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<void> {
    if (container.wzProperties == null) return
    for (const prop of container.wzProperties) {
      // console.log(prop.fullPath, WzPropertyType[prop.propertyType])
      stop = !!(await Promise.resolve(callback(prop)))
      if (stop) return
      if (prop.wzProperties != null) {
        await walkPropertyContainer(prop, callback)
        prop.dispose()
        if (stop) return
      }
    }
    if (typeof (container as any).dispose === 'function') {
      (container as any).dispose()
    }
  }

  async function walkDirectory (dir: WzDirectory, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<void> {
    stop = !!(await Promise.resolve(callback(dir)))
    if (stop) return
    for (const img of dir.wzImages) {
      img.parseImage()
      stop = !!(await Promise.resolve(callback(img)))
      if (stop) return
      await walkPropertyContainer(img, callback)
      img.dispose()
      if (stop) return
    }
    for (const subdir of dir.wzDirectories) {
      stop = !!(await Promise.resolve(callback(subdir)))
      if (stop) return
      await walkDirectory(subdir, callback)
      subdir.dispose()
      if (stop) return
    }
    dir.dispose()
  }
}
