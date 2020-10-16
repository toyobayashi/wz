export function wasminit<T> (mod: T): Promise<T> {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if ((mod as any).__ready) {
      resolve(mod)
      return
    }
    (mod as any).print = function (o: any) {
      console.log(o)
    };
    (mod as any).onRuntimeInitialized = function () {
      resolve(mod)
    };
    (mod as any).__ready = true
  })
}
