import { createStore, ActionHandler } from '@tybys/reactive-react'
import type { ITreeNode } from 'react-treebeard'
import type { WzFile } from '../../..'
import { WzMapleVersion, WzImage, init } from '../../..'

interface IState {
  entries: (WzFile | WzImage)[]
  mapleVersion: WzMapleVersion
  trees: ITreeNode[]
}

type G = {
}

type A = {
  parseImg: ActionHandler<IState, {}, {}, A, [File], void>
}

const store = createStore<IState, G, {}, A>({
  state: {
    entries: [],
    mapleVersion: WzMapleVersion.BMS,
    trees: []
  },
  getters: {},
  actions: {
    async parseImg ({ state }, file): Promise<void> {
      await init()
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
