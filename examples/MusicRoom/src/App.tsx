import * as React from 'react'
import FileInput from './FileInput'
import MapleVersionSelect from './MapleVersionSelect'
import Tree from './Tree'

const App: React.FC<{}> = function () {
  return <div id='app'>
    <MapleVersionSelect />
    <FileInput />
    <Tree />
  </div>
}

export default App
