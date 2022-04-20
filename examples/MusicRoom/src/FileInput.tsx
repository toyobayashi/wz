import * as React from 'react'
import { audio } from './audio'
import store from './store'

const FileInput: React.FC<{}> = function () {
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const files = input.files
    if (files && files.length) {
      const file = files[0]
      input.value = ''
      if (file.name.endsWith('.wz')) {
        try {
          await store.actions.parseWz(file)
        } catch (err: any) {
          input.value = ''
          window.alert(err.message)
        }
      } else if (file.name.endsWith('.img')) {
        try {
          await store.actions.parseImg(file)
        } catch (err: any) {
          input.value = ''
          window.alert(err.message)
        }
      } else {
        input.value = ''
        window.alert('Invalid file type')
      }
    }
  }

  const onLabelClick = async (e: React.MouseEvent<HTMLLabelElement, MouseEvent>) => {
    if (store.state.treeLoading) {
      e.preventDefault()
    }
    await audio.resume()
  }

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
