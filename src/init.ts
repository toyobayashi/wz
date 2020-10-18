import { init as initWasm } from './util/zlibwasm'

/**
 * @public
 */
export async function init (): Promise<void> {
  if (typeof window !== 'undefined') {
    await initWasm()
  } else {
    await Promise.resolve()
  }
}
