import { Jimp } from './node'

/**
 * @public
 */
export class Canvas {
  public static rgbaToInt (r: number, g: number, b: number, a: number): number {
    if (typeof window === 'undefined') {
      return Jimp.rgbaToInt(r, g, b, a)
    }
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') {
      throw new TypeError('r, g, b and a must be numbers')
    }

    if (r < 0 || r > 255) {
      throw new RangeError('r must be between 0 and 255')
    }

    if (g < 0 || g > 255) {
      throw new RangeError('g must be between 0 and 255')
    }

    if (b < 0 || b > 255) {
      throw new RangeError('b must be between 0 and 255')
    }

    if (a < 0 || a > 255) {
      throw new RangeError('a must be between 0 and 255')
    }

    r = Math.round(r)
    b = Math.round(b)
    g = Math.round(g)
    a = Math.round(a)
    const i = r * Math.pow(256, 3) + g * Math.pow(256, 2) + b * Math.pow(256, 1) + a * Math.pow(256, 0)

    return i
  }

  private _canvas: HTMLCanvasElement | InstanceType<typeof Jimp>

  public constructor (width: number, height: number) {
    if (typeof window === 'undefined') {
      this._canvas = new Jimp(width, height)
    } else {
      this._canvas = window.document.createElement('canvas')
      this._canvas.width = width
      this._canvas.height = height
    }
  }

  public setPixelColor (rgba: number, x: number, y: number): Canvas {
    if (typeof window === 'undefined') {
      (this._canvas as InstanceType<typeof Jimp>).setPixelColor(rgba, x, y)
      return this
    }
    const context = (this._canvas as HTMLCanvasElement).getContext('2d')!
    const imageData = context.createImageData(1, 1)
    imageData.data[0] = rgba >>> 24
    imageData.data[1] = (rgba >>> 16) & 0xff
    imageData.data[2] = (rgba >>> 8) & 0xff
    imageData.data[3] = rgba & 0xff
    context.putImageData(imageData, x, y)
    return this
  }

  public getWidth (): number {
    if (typeof window === 'undefined') {
      return (this._canvas as InstanceType<typeof Jimp>).getWidth()
    }
    return (this._canvas as HTMLCanvasElement).width
  }

  public getBufferAsync (mime: string): Promise<Uint8Array> {
    if (typeof window === 'undefined') {
      return new Promise((resolve, reject) => {
        toBlob(this._canvas as HTMLCanvasElement, mime).then(blob => {
          if (blob == null) {
            reject(new Error('getBufferAsync() failed'))
            return
          }
          const fr = new FileReader()
          fr.addEventListener('error', () => { reject(fr.error) })
          fr.addEventListener('load', () => {
            const readBuffer = new Uint8Array(fr.result as ArrayBuffer)
            resolve(readBuffer)
          })
          fr.readAsArrayBuffer(blob)
        }).catch(reject)
      })
    } else {
      return (this._canvas as InstanceType<typeof Jimp>).getBufferAsync(mime)
    }
  }

  public async writeAsync (file: string): Promise<Canvas> {
    if (typeof window === 'undefined') {
      await (this._canvas as InstanceType<typeof Jimp>).writeAsync(file)
      return this
    }
    const blob = await toBlob(this._canvas as HTMLCanvasElement)
    if (blob == null) {
      throw new Error('Write image failed')
    }

    const a = window.document.createElement('a')
    a.download = file
    a.href = URL.createObjectURL(blob)
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })
    a.dispatchEvent(event)
    a.remove()
    return this
  }

  public dispose (): void {
    this._canvas = null!
  }
}

function toBlob (canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, type)
  })
}
