export declare namespace mod {
  export function inflate (data: Uint8Array, len: number): Uint8Array
  export function aesEnc (data: Uint8Array, key: Uint8Array): Uint8Array
}

declare function init (): Promise<typeof mod>

export default init
