import * as React from 'react'
import FileInput from './FileInput'
import MapleVersionSelect from './MapleVersionSelect'
import Player from './Player'
import Tree from './Tree'

const App: React.FC<{}> = function () {
  return <>
    <MapleVersionSelect />
    <FileInput />
    <Player />
    <Tree />
  </>
}

export default App
