import * as React from 'react'
import type { ITreeNode } from 'react-treebeard'
import { useRecoilValue } from 'recoil'
// import { useRender, useData, makeReactive } from '@tybys/reactive-react'
import { trees, treeLoading, useTryExpandNode, useUpdateTrees } from './store'
import { debugError, debugLog } from './util'

const Tree = React.lazy(async () => {
  const { Treebeard } = await import('react-treebeard')

  return {
    default: function () {
      debugLog('<Tree>')

      const [lastNode, setLastNode] = React.useState<ITreeNode | null>(null)
      const tryExpandNode = useTryExpandNode()
      const treesValue = useRecoilValue(trees)
      const treeLoadingValue = useRecoilValue(treeLoading)
      const updateTrees = useUpdateTrees()

      const onToggle = async (node: ITreeNode, toggled: boolean): Promise<void> => {
        await updateTrees([node, lastNode!], async (newNode, origin) => {
          if (origin === node) {
            if (lastNode === node) {
              if (node.children) {
                newNode.toggled = toggled;
              }
              return newNode
            }
            newNode.active = true
            if (node.children) {
              newNode.toggled = toggled;
            }
            setLastNode(newNode)
            try {
              await tryExpandNode(newNode)
            } catch (err: any) {
              debugError(err)
              window.alert(err.message)
            }
          } else if (origin === lastNode) {
            newNode.active = false
          }

          return newNode
        })
      }

      return <div style={styles.treeContainer}>
        {
          treesValue.map(tree => {
            return <Treebeard data={tree} onToggle={onToggle} key={tree.id} />
          })
        }
        {treeLoadingValue ? <p>Loading...</p> : null}
      </div>
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
