declare module 'react-treebeard' {
  import { PureComponent } from 'react'
  export interface ITreeNode<T = any> {
    id?: string
    name: string
    children?: ITreeNode[]
    toggled?: boolean
    active?: boolean
    loading?: boolean
    decorators?: any
    animations?: any
    data?: () => T
  }
  export class Treebeard extends PureComponent<{
    data: ITreeNode
    style?: any
    onToggle?: (node: ITreeNode, toggled: boolean) => any
  }> {}
}

declare module '@tybys/wz/dist/wz.wasm' {
  const dataUrl: string
  export default dataUrl
}
