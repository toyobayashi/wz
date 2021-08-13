import { ObjectId } from "@tybys/oid"
import type { ITreeNode } from "react-treebeard"
import type { WzDirectory, WzImageProperty } from "../../.."

export function debugLog (...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args)
  }
}

export function debugError (...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args)
  }
}

export function collectDir (dir: WzDirectory, tree: ITreeNode) {
  for (const subdir of dir.wzDirectories.values()) {
    const node: ITreeNode = {
      id: new ObjectId().toHexString(),
      name: subdir.name,
      active: false,
      toggled: false,
      children: [],
      data: () => subdir
    }
    collectDir(subdir, node)
    tree.children!.push(node)
  }

  for (const img of dir.wzImages.values()) {
    const node: ITreeNode = {
      id: new ObjectId().toHexString(),
      name: img.name,
      active: false,
      data: () => img
    }
    tree.children!.push(node)
  }
}

export async function parseProperties (prop: WzImageProperty, node: ITreeNode): Promise<void> {
  if (prop.wzProperties) {
    if (!node.children || !node.children.length) {
      node.children = node.children || []
      node.loading = true
      node.toggled = true
      for (const p of prop.wzProperties.values()) {
        const propNode: ITreeNode = {
          id: new ObjectId().toHexString(),
          name: p.name,
          active: false,
          data: () => p
        }
        node.children.push(propNode)
      }
      node.loading = false
    }
  }
}
