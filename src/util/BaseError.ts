/** @public */
export class BaseError extends Error {
  constructor (message?: string) {
    super(message)
    this.name = typeof (new.target as any).name === 'string'
      ? (new.target as any).name
      : 'Error'
    if (!(this instanceof BaseError)) {
      // ES5 Code
      if (typeof Object.setPrototypeOf === 'function') {
        Object.setPrototypeOf(this, new.target.prototype)
      } else {
        // eslint-disable-next-line no-proto
        (this as any).__proto__ = new.target.prototype
      }
      if (typeof (Error as any).captureStackTrace === 'function') {
        (Error as any).captureStackTrace(this, new.target)
      }
    }
  }
}
