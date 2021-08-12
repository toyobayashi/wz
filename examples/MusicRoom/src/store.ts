import { createStore } from '@tybys/reactive-react'
import type { ITreeNode } from 'react-treebeard'
import type { WzFile } from '../../..'
import { WzMapleVersion, WzImage, init } from '../../..'

import { wasmBinary } from './wzwasm'

const uri = `data:application/wasm;base64,${wasmBinary}`

const store = createStore({
  state: {
    entries: [] as (WzFile | WzImage)[],
    mapleVersion: WzMapleVersion.BMS,
    trees: [] as ITreeNode[]
  },
  getters: {},
  actions: {
    async parseImg ({ state }, file: File): Promise<void> {
      await init({
        locateFile () {
          return uri
        }
      })
      const img = WzImage.createFromFile(file, state.mapleVersion)
      const r = await img.parseImage()
      if (r) {
        state.entries.push(img)
        console.log(img)

        const children: ITreeNode[] = []
        for (const prop of img.wzProperties.values()) {
          const node: ITreeNode = {
            name: prop.name,
            active: false,
            data: () => prop
          }
          children.push(node)
        }
        const tree: ITreeNode = {
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
