import { useForceUpdate, useRender } from '@tybys/reactive-react'
import * as React from 'react'
import { audio } from './audio'
import store from './store'
import { filterTime } from './util'

const Player: React.FC<{}> = function () {
  const forceUpdate = useForceUpdate()
  const [duration, setDuration] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [rangeInputMouseDown, setRangeInputMouseDown] = React.useState(false)

  const rangeInput = React.useRef<HTMLInputElement>(null)

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

  const onChange = React.useCallback((e) => {
    setCurrentTime(Number(e.target.value))
  }, [])
  const onMouseUp = React.useCallback((e) => {
    setRangeInputMouseDown(false)
    audio.currentTime = e.target.value
  }, [])
  const onMouseDown = React.useCallback(() => {
    setRangeInputMouseDown(true)
  }, [])

  const onClickPause = React.useCallback(async () => {
    if (audio.isPlaying) {
      audio.pause()
      forceUpdate()
    } else {
      try {
        await audio.play()
        forceUpdate()
      } catch (_) {}
    }
  }, [audio.isPlaying])

  const timeString = React.useMemo(() => {
    return `${filterTime(Math.floor(currentTime))} / ${filterTime(Math.floor(duration))}`
  }, [duration, currentTime])

  return useRender(() => <div>
    <button onClick={onClickPause}>{audio.isPlaying ? 'PAUSE' : 'PLAY'}</button>
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
    <span style={styles.vam}>{timeString} {store.getters.playingName.value}</span>
  </div>)
}

const styles = {
  vam: {
    verticalAlign: 'middle'
  }
}

export default Player
