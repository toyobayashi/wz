// import { useData, useForceUpdate, useRender } from '@tybys/reactive-react'
// import { computed, ref } from '@vue/reactivity'
import * as React from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { audio } from './audio'
import { useSaveMp3, playingName, isPlaying } from './store'
import { filterTime } from './util'

const Player: React.FC<{}> = function () {
  // const forceUpdate = useForceUpdate()

  const rangeInput = React.useRef<HTMLInputElement>(null)

  const [isPlayingValue, setIsPlaying] = useRecoilState(isPlaying)
  const [duration, setDuration] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [rangeInputMouseDown, setRangeInputMouseDown] = React.useState(false)
  const timeString = React.useMemo(() => {
    return `${filterTime(Math.floor(currentTime))} / ${filterTime(Math.floor(duration))}`
  }, [currentTime, duration])
  const saveMp3 = useSaveMp3()
  const playingNameValue = useRecoilValue(playingName)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value))
  }
  const onMouseUp = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    setRangeInputMouseDown(false)
    audio.currentTime = Number((e.target as HTMLInputElement).value)
  }
  const onMouseDown = () => {
    setRangeInputMouseDown(true)
  }
  const onClickPause = async () => {
    if (audio.isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (_) {}
    }
  }
  const onSaveMp3 = () => {
    return saveMp3()
  }

  React.useEffect(() => {
    const onDurationChange = () => {
      setDuration(audio.duration)
    }
    audio.on('durationchange', onDurationChange)
    return () => {
      audio.off('durationchange', onDurationChange)
    }
  }, [])

  React.useEffect(() => {
    const onTimeupdate = () => {
      if (!rangeInputMouseDown) {
        setCurrentTime(audio.currentTime)
        rangeInput.current!.value = audio.currentTime.toString()
      }
    }
    audio.on('timeupdate', onTimeupdate)
    return () => {
      audio.off('timeupdate', onTimeupdate)
    }
  }, [rangeInputMouseDown])

  return <div>
    <button style={styles.btn} onClick={onClickPause}>{isPlayingValue ? 'PAUSE' : 'PLAY'}</button>
    <input
      style={styles.vam}
      ref={rangeInput}
      type='range'
      min={0}
      max={duration}
      onChange={onChange}
      onMouseUp={onMouseUp}
      onMouseDown={onMouseDown}
    />
    <span style={styles.vam}>
      {timeString} {playingNameValue}
    </span> {playingNameValue ? <button style={styles.btn} onClick={onSaveMp3}>SAVE</button> : null}
  </div>
}

const styles = {
  vam: {
    verticalAlign: 'middle'
  },
  btn: {
    width: 60
  }
}

export default Player
