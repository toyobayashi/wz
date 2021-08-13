import * as React from 'react'
import { Treebeard } from 'react-treebeard'
import type { ITreeNode } from 'react-treebeard'
import { useRender, useData, makeReactive } from '@tybys/reactive-react'
import store from './store'
import { WzBinaryProperty } from '../../..'
import { audio } from './audio'
import { debugLog } from './util'

const ReactiveTreebeard = makeReactive<{
  data: ITreeNode
  style?: any
  onToggle?: (node: ITreeNode, toggled: boolean) => any
}>(Treebeard, (props) => props.data)

const Tree: React.FC<{}> = function () {
  debugLog('<Tree>')
  const data = useData(() => {
    let lastNode: ITreeNode | null = null
    const onToggle = async (node: ITreeNode, toggled: boolean): Promise<void> => {
      if (lastNode) {
        lastNode.active = false
      }
      node.active = true
      if (node.children) {
        node.toggled = toggled;
      }
      lastNode = node
      const wzData = node.data ? node.data() : null
      if (wzData) {
        if (wzData instanceof WzBinaryProperty) {
          const buffer = await wzData.getBytes(false)
          await audio.playRaw(buffer)
        }
      }
    }
    return {
      onToggle
    }
  })
  return useRender(() => {
    return <div>
      {
        store.state.trees.map(tree => {
          return <ReactiveTreebeard data={tree} onToggle={data.onToggle} key={tree.name} />
        })
      }
    </div>
  })
}

export default Tree
