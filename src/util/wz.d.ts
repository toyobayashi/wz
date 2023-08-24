/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="emscripten" />

declare namespace mod {
  export function _wz_zlib_inflate (source: number, srclen: number, dest: number, destlen: number): number
  export function _wz_aes_ecb_encrypt (data: number, dataLen: number, key: number, out: number, outLen: number): number
  export function _malloc (size: number): number
  export function _free (ptr: number): void
}

declare function init (moduleOverrides?: Partial<EmscriptenModule>): Promise<{ Module: typeof mod }>

export interface ICipher {
  setAutoPadding (autoPadding: boolean): this
  update (data: Uint8Array): Uint8Array
  final (): Uint8Array
  destroy (): this
}

export declare function inflate (data: Uint8Array, len: number): Uint8Array
export declare function aesCreate (key: Uint8Array): ICipher

export default init
