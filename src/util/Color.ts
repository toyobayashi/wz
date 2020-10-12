export class Color {
  public r!: number
  public g!: number
  public b!: number
  public a!: number
  private constructor (r: number, g: number, b: number, a: number) {
    Object.defineProperties(this, {
      r: createGetSetDescriptor(r),
      g: createGetSetDescriptor(g),
      b: createGetSetDescriptor(b),
      a: createGetSetDescriptor(a)
    })
  }

  public static fromRgb (r: number, g: number, b: number): Color {
    assertByteRange(r)
    assertByteRange(g)
    assertByteRange(b)
    return new Color(r, g, b, 255)
  }

  public static fromArgb (a: number, r: number, g: number, b: number): Color {
    assertByteRange(a)
    assertByteRange(r)
    assertByteRange(g)
    assertByteRange(b)
    return new Color(r, g, b, a)
  }

  public static fromAc (a: number, color: Color): Color {
    assertByteRange(a)
    return new Color(color.r, color.g, color.b, a)
  }

  public static readonly black: Color = new Color(0, 0, 0, 255)
}

function createGetSetDescriptor (val: number): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: true,
    get: () => val,
    set: (v) => {
      assertByteRange(v)
      val = v
    }
  }
}

function assertByteRange (n: number): void {
  if (n >>> 8 !== 0 || Number.isNaN(n)) throw new RangeError('RGB out of range')
}
