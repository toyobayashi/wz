// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="emscripten" />

/**
 * @public
 */
export async function init (moduleOverrides?: Partial<EmscriptenModule>): Promise<void> {
  if (typeof window !== 'undefined') {
    const wzWasm = await import('./util/wz')
    await wzWasm.default(moduleOverrides)
  } else {
    await Promise.resolve()
  }
}
