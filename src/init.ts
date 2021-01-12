/**
 * @public
 */
export async function init (): Promise<void> {
  if (typeof window !== 'undefined') {
    const wzWasm = await import('./util/wz')
    await wzWasm.default()
  } else {
    await Promise.resolve()
  }
}
