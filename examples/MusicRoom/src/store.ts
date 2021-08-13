import { createStore } from '@tybys/reactive-react'
import type { ITreeNode } from 'react-treebeard'
import type { WzFile } from '../../..'
import { WzMapleVersion, WzImage, init } from '../../..'
import { ObjectId } from '@tybys/oid'

import { wasmBinary } from './wzwasm'
import { debugLog } from './util'

async function initWz (): Promise<void> {
  const emscriptenModuleOverrides: Partial<EmscriptenModule> = {
    locateFile () {
      return `data:application/wasm;base64,${wasmBinary()}`
    }
  }
  await init(emscriptenModuleOverrides)
}

const store = createStore({
  state: {
    entries: [] as (WzFile | WzImage)[],
    mapleVersion: WzMapleVersion.BMS,
    trees: [] as ITreeNode[]
  },
  getters: {},
  actions: {
    async parseImg ({ state }, file: File): Promise<void> {
      await initWz()
      const img = WzImage.createFromFile(file, state.mapleVersion)
      const r = await img.parseImage()
      if (r) {
        state.entries.push(img)
        debugLog(img)

        const children: ITreeNode[] = []
        for (const prop of img.wzProperties.values()) {
          const node: ITreeNode = {
            id: new ObjectId().toHexString(),
            name: prop.name,
            active: false,
            data: () => prop
          }
          children.push(node)
        }
        const tree: ITreeNode = {
          id: new ObjectId().toHexString(),
          name: img.name,
          children: children,
          active: false,
          toggled: false,
          data: () => img
        }
        state.trees.push(tree)
      } else {
        throw new Error('Image parse failed. Ensure it is a valid img or try to change the maple version')
      }
    }
  }
})

export default store
