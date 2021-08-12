import { BaseError } from './BaseError'

/**
 * @public
 */
export class NotImplementedError extends BaseError {
  constructor (where?: string) {
    super(`${typeof where === 'string' ? (where + ' ') : ''}Not implemented`)
  }
}
