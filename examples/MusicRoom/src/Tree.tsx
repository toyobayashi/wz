import * as React from 'react'
import type { ITreeNode } from 'react-treebeard'
import { useRender, useData, makeReactive } from '@tybys/reactive-react'
import store from './store'
import { debugError, debugLog } from './util'

const Tree = React.lazy(async () => {
  const { Treebeard } = await import('react-treebeard')
  const ReactiveTreebeard = makeReactive<{
    data: ITreeNode
    style?: any
    onToggle?: (node: ITreeNode, toggled: boolean) => any
  }>(Treebeard, (props) => props.data)

  return {
    default: function () {
      debugLog('<Tree>')
      const data = useData(() => {
        let lastNode: ITreeNode | null = null
        const onToggle = async (node: ITreeNode, toggled: boolean): Promise<void> => {
          if (lastNode === node) {
            if (node.children) {
              node.toggled = toggled;
            }
            return
          }
          if (lastNode) {
            lastNode.active = false
          }
          node.active = true
          if (node.children) {
            node.toggled = toggled;
          }
          lastNode = node
          try {
            await store.actions.tryExpandNode(node)
          } catch (err: any) {
            debugError(err)
            window.alert(err.message)
          }
        }
        return {
          onToggle
        }
      })
      return useRender(() => {
        return <div style={styles.treeContainer}>
          {
            store.state.trees.map(tree => {
              return <ReactiveTreebeard data={tree} onToggle={data.onToggle} key={tree.id} />
            })
          }
          {store.state.treeLoading ? <p>Loading...</p> : null}
        </div>
      })
    }
  }
})

const styles = {
  treeContainer: {
    marginTop: 10,
    flex: 1,
    overflow: 'auto'
  }
}

export default Tree
