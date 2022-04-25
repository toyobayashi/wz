import * as React from 'react'
import { RecoilRoot } from 'recoil'
import FileInput from './FileInput'
import MapleVersionSelect from './MapleVersionSelect'
import Player from './Player'
import { useDeleteTree } from './store'
import Tree from './Tree'

const App: React.FC<{}> = function () {
  const deleteTree = useDeleteTree()

  React.useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        deleteTree()
      }
    }
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [deleteTree])

  return <>
    <div style={stypes.topLine}>
      <React.Suspense fallback={false} >
        <MapleVersionSelect />
      </React.Suspense>
      <a href='https://github.com/toyobayashi/wz' target='_blank'>https://github.com/toyobayashi/wz</a>
    </div>
    <FileInput />
    <Player />
    <React.Suspense fallback={false} >
      <Tree />
    </React.Suspense>
  </>
}

const AppRecoilRoot: React.FC<{}> = () => {
  return (
    <RecoilRoot>
      <App />
    </RecoilRoot>
  )
}

const stypes = {
  topLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8
  }
}

export default AppRecoilRoot
