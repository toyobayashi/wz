import { useData, useForceUpdate, useRender } from '@tybys/reactive-react'
import { computed, ref } from '@vue/reactivity'
import * as React from 'react'
import { audio } from './audio'
import store from './store'
import { filterTime } from './util'

const Player: React.FC<{}> = function () {
  const forceUpdate = useForceUpdate()

  const rangeInput = React.useRef<HTMLInputElement>(null)

  const data = useData(() => {
    const duration = ref(0)
    const currentTime = ref(0)
    const rangeInputMouseDown = ref(false)

    const timeString = computed(() => {
      return `${filterTime(Math.floor(currentTime.value))} / ${filterTime(Math.floor(duration.value))}`
    })

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      currentTime.value = Number(e.target.value)
    }
    const onMouseUp = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      rangeInputMouseDown.value = false
      audio.currentTime = Number((e.target as HTMLInputElement).value)
    }
    const onMouseDown = () => {
      rangeInputMouseDown.value = true
    }

    const onClickPause = async () => {
      if (audio.isPlaying) {
        audio.pause()
        forceUpdate()
      } else {
        try {
          await audio.play()
          forceUpdate()
        } catch (_) {}
      }
    }

    const onSaveMp3 = () => {
      return store.actions.saveMp3()
    }

    return {
      duration,
      currentTime,
      rangeInputMouseDown,
      timeString,
      onChange,
      onMouseUp,
      onMouseDown,
      onClickPause,
      onSaveMp3
    }
  })

  React.useEffect(() => {
    const onDurationChange = () => {
      data.duration.value = audio.duration
    }
    audio.on('durationchange', onDurationChange)
    return () => {
      audio.off('durationchange', onDurationChange)
    }
  }, [])

  React.useEffect(() => {
    const onTimeupdate = () => {
      if (!data.rangeInputMouseDown.value) {
        data.currentTime.value = audio.currentTime
        rangeInput.current!.value = audio.currentTime.toString()
      }
    }
    audio.on('timeupdate', onTimeupdate)
    return () => {
      audio.off('timeupdate', onTimeupdate)
    }
  }, [])

  return useRender(() => <div>
    <button style={styles.btn} onClick={data.onClickPause}>{audio.isPlaying ? 'PAUSE' : 'PLAY'}</button>
    <input
      style={styles.vam}
      ref={rangeInput}
      type='range'
      min={0}
      max={data.duration.value}
      onChange={data.onChange}
      onMouseUp={data.onMouseUp}
      onMouseDown={data.onMouseDown}
    />
    <span style={styles.vam}>
      {data.timeString.value} {store.getters.playingName.value}
    </span> {store.getters.playingName.value ? <button style={styles.btn} onClick={data.onSaveMp3}>SAVE</button> : null}
  </div>)
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
