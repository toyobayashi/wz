import * as React from 'react'
import FileInput from './FileInput'
import MapleVersionSelect from './MapleVersionSelect'
import Tree from './Tree'

const App: React.FC<{}> = function () {
  return <>
    <MapleVersionSelect />
    <FileInput />
    <Tree />
  </>
}

export default App
