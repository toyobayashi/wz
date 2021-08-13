export function debugLog (...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args)
  }
}
