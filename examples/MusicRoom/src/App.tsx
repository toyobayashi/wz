import * as React from 'react'
import FileInput from './FileInput'
import MapleVersionSelect from './MapleVersionSelect'
import Player from './Player'
import Tree from './Tree'

const App: React.FC<{}> = function () {
  return <>
    <div style={stypes.topLine}>
      <MapleVersionSelect />
      <a href='https://github.com/toyobayashi/wz' target='_blank'>https://github.com/toyobayashi/wz</a>
    </div>
    <FileInput />
    <Player />
    <Tree />
  </>
}

const stypes = {
  topLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8
  }
}

export default App
