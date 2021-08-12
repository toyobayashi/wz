type BufferLike = ArrayBuffer | ArrayBufferView | Uint8Array

class MapleAudio {
  private _ctx: AudioContext = new AudioContext()

  private _startedAt: number = 0 // absolute time
  private _pausedAt: number = 0 // relative time
  private _duration: number = 0

  private _source: AudioBufferSourceNode | null = null
  private _audioBuffer: AudioBuffer | null = null

  public loop: boolean = true
  private _loopStart: number = 0
  private _loopEnd: number = 0
  private _timeupdateTimer = 0

  public get loopStart (): number {
    return this._loopStart
  }

  public set loopStart (value: number) {
    this._loopStart = value
    if (this._source) this._source.loopStart = value
  }

  public get loopEnd (): number {
    return this._loopEnd
  }

  public set loopEnd (value: number) {
    this._loopEnd = value
    if (this._source) this._source.loopEnd = value
  }

  public get currentTime (): number {
    let t = 0
    if (this._pausedAt) {
      t = this._pausedAt
      return t
    } else if (this._startedAt) {
      t = this._ctx.currentTime - this._startedAt
      if (this.loop) {
        if (this.loopEnd > 0) {
          while (t > this.loopEnd) {
            this._startedAt = this._ctx.currentTime - (this.loopStart + (t - this.loopEnd))
            t = this._ctx.currentTime - this._startedAt
          }
        }
        while (t > this.duration) {
          this._startedAt += this.duration
          t = this._ctx.currentTime - this._startedAt
        }
      } else {
        if (t > this.duration) t = this.duration
      }
      return t
    } else {
      return 0
    }
  }

  public set currentTime (value: number) {
    if (this._pausedAt) {
      this._pausedAt = value
      return
    }
    if (this._startedAt) {
      if (!this._audioBuffer) return
      this._initSource(this._audioBuffer, true)
      this._startedAt = this._ctx.currentTime - value
      this._pausedAt = 0
      this._source?.start(0, value)

      window.clearInterval(this._timeupdateTimer)
      this.emit('timeupdate')
      this._timeupdateTimer = window.setInterval(() => {
        this.emit('timeupdate')
      }, 250)
    }
  }

  public get duration (): number {
    return this._duration
  }

  private _initSource (audioBuffer: AudioBuffer, clearOnEnded = false): void {
    try {
      if (this._source) {
        if (clearOnEnded) this._source.onended = null
        this._source.stop()
        this._source.disconnect()
        this._source = null
      }
    } catch (_) {}
    this._source = this._ctx.createBufferSource()
    this._source.buffer = audioBuffer
    this._source.loop = this.loop
    this._source.loopStart = this.loopStart
    this._source.loopEnd = this.loopEnd
    this._source.onended = () => {
      this.emit('ended')
    }
    this._source.connect(this._ctx.destination)
  }

  public async playRawSide (src: BufferLike): Promise<void> {
    const audioBuffer = await decodeAudioBuffer(this._ctx, src)
    let source = this._ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this._ctx.destination)
    source.start(0)
    source.onended = () => {
      source.disconnect()
      source = null!
    }
  }

  public async setRawSrc (src: BufferLike): Promise<void> {
    this._audioBuffer = await decodeAudioBuffer(this._ctx, src)
    this._duration = this._audioBuffer.duration
    this._startedAt = 0
    this._pausedAt = 0
    this.emit('durationchange')
    this.emit('canplay')

    await this.play()
  }

  public async playRaw (src: BufferLike): Promise<void> {
    await this.setRawSrc(src)
    await this.play()
  }

  /**
   * Continue playing
   */
  public async play (): Promise<void> {
    if (!this._audioBuffer) {
      throw new Error('no source')
    }

    this._initSource(this._audioBuffer, true)
    const offset = this._pausedAt
    this._source?.start(0, offset)
    this._startedAt = this._ctx.currentTime - offset
    this._pausedAt = 0

    this.emit('play')

    window.clearInterval(this._timeupdateTimer)
    this.emit('timeupdate')
    this._timeupdateTimer = window.setInterval(() => {
      this.emit('timeupdate')
    }, 250)
  }

  public emit (_event: string, ..._payload: any[]) {
    // TODO
  }

  public pause (): void {
    if (this._source) {
      this._source.onended = null
      this._source.stop()
      this._source.disconnect()
      this._source = null
      this._pausedAt = this._ctx.currentTime - this._startedAt
      this._startedAt = 0
      this.emit('pause')
    }
    window.clearInterval(this._timeupdateTimer)
  }
}

async function decodeAudioBuffer (context: AudioContext, src: BufferLike): Promise<AudioBuffer> {
  let audioBuffer: AudioBuffer
  if (src instanceof ArrayBuffer) {
    audioBuffer = await context.decodeAudioData(src)
  } else {
    audioBuffer = await context.decodeAudioData(src.buffer)
  }
  return audioBuffer
}

export const audio = new MapleAudio()

export { MapleAudio }
