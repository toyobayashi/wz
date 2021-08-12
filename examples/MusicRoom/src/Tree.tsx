import * as React from 'react'
import { Treebeard } from 'react-treebeard'
import type { ITreeNode } from 'react-treebeard'
import { useRender, useData } from '@tybys/reactive-react'
import store from './store'
import { isRef } from '@vue/reactivity'
import {
  isObject,
  isArray,
  isMap,
  isSet,
  isPlainObject
} from '@vue/shared'
import { WzBinaryProperty } from '../../..'
import { audio } from './audio'

const Tree: React.FC<{}> = function () {
  console.log('<Tree>')
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
          traverse(tree)
          return <Treebeard data={tree} onToggle={data.onToggle} key={tree.name} />
        })
      }
    </div>
  })
}

function traverse (value: unknown, seen: Set<unknown> = new Set()) {
  if (!isObject(value) || (value as any)['__v_skip']) {
    return value
  }
  seen = seen || new Set()
  if (seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse((value as any)[key], seen)
    }
  }
  return value
}

export default Tree
