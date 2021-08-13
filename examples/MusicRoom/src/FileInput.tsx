import * as React from 'react'
import { audio } from './audio'
import store from './store'

const emptyDep: React.DependencyList = []

const FileInput: React.FC<{}> = function () {
  const onFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const files = input.files
    if (files && files.length) {
      const file = files[0]
      input.value = ''
      if (file.name.endsWith('.wz')) {
        try {
          await store.actions.parseWz(file)
        } catch (err) {
          input.value = ''
          window.alert(err.message)
        }
      } else if (file.name.endsWith('.img')) {
        try {
          await store.actions.parseImg(file)
        } catch (err) {
          input.value = ''
          window.alert(err.message)
        }
      } else {
        input.value = ''
        window.alert('Invalid file type')
      }
    }
  }, emptyDep)

  const onLabelClick = React.useCallback(async (e: React.MouseEvent<HTMLLabelElement, MouseEvent>) => {
    if (store.state.treeLoading) {
      e.preventDefault()
    }
    await audio.resume()
  }, emptyDep)

  return <div>
    <label style={styles.fileInput} htmlFor='fileInput' onClick={onLabelClick}>Select Sound*.wz or IMG file
      <input
        id='fileInput'
        style={styles.hide}
        type='file'
        accept='.wz,.img'
        onChange={onFileChange}
      />
    </label>
  </div>
}

const styles = {
  hide: {
    display: 'none'
  },
  fileInput: {
    display: 'inline-block',
    marginTop: 10,
    cursor: 'pointer',
    color: 'blue',
    textDecoration: 'underline'
  }
}

export default FileInput
