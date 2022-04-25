import * as React from 'react'
import { useRecoilState } from 'recoil'
import { mapleVersion } from './store'
// import { useRender } from '@tybys/reactive-react'

const MapleVersionSelect = React.lazy(async () => {
  const { WzMapleVersion } = await import('@tybys/wz')
  return {
    default: function () {
      const [mapleVersionValue, setMapleVersion] = useRecoilState(mapleVersion)
      const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMapleVersion(Number(e.target!.value))
      }
      return <div>
        MapleVersion: <select value={mapleVersionValue} onChange={onSelectChange}>
          {
            Object.keys(WzMapleVersion).filter((e) => {
              return Number.isNaN(Number(e)) && e !== 'UNKNOWN' && e !== 'GETFROMZLZ'
            }).map((e) => {
              const k = e as keyof typeof WzMapleVersion
              return <option value={WzMapleVersion[k]} key={WzMapleVersion[k]}>{k}</option>
            })
          }
        </select> ({mapleVersionValue})
      </div>
    }
  }
})

export default MapleVersionSelect
