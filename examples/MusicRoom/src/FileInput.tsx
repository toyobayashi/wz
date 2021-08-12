import * as React from 'react'
import store from './store'

const FileInput: React.FC<{}> = function () {
  const onFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const files = input.files
    if (files && files.length) {
      const file = files[0]
      if (file.name.endsWith('.wz')) {
        window.alert(file.name)
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
  }, [])

  return <input
    type='file'
    accept='.wz,.img'
    onChange={onFileChange}
  />
}

export default FileInput
