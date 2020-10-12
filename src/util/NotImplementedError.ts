/**
 * @public
 */
export class NotImplementedError extends Error {
  constructor (where?: string) {
    super(`${typeof where === 'string' ? (where + ' ') : ''}Not implemented`)
  }
}
