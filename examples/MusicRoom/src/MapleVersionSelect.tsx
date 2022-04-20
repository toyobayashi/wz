import * as React from 'react'
import store from './store'
import { useRender } from '@tybys/reactive-react'

const MapleVersionSelect = React.lazy(async () => {
  const { WzMapleVersion } = await import('@tybys/wz')
  return {
    default: function () {
      const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        store.state.mapleVersion = Number(e.target!.value)
      }
      return useRender(() => <div>
        MapleVersion: <select value={store.state.mapleVersion} onChange={onSelectChange}>
          {
            Object.keys(WzMapleVersion).filter((e) => {
              return Number.isNaN(Number(e)) && e !== 'UNKNOWN' && e !== 'GETFROMZLZ'
            }).map((e) => {
              const k = e as keyof typeof WzMapleVersion
              return <option value={WzMapleVersion[k]} key={WzMapleVersion[k]}>{k}</option>
            })
          }
        </select> ({store.state.mapleVersion})
      </div>)
    }
  }
})

export default MapleVersionSelect
