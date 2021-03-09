/** @public */
export enum WzFileParseStatus {
  PATH_IS_NULL = -1,
  ERROR_GAME_VER_HASH = -2, // Error with game version hash : The specified game version is incorrect and WzLib was unable to determine the version itself

  FAILED_UNKNOWN = 0x0,
  SUCCESS = 0x1
}

/** @public */
export function getErrorDescription (status: WzFileParseStatus): string {
  switch (status) {
    case WzFileParseStatus.SUCCESS:
      return 'Success'
    case WzFileParseStatus.FAILED_UNKNOWN:
      return 'Failed, in this case the causes are undetermined.'

    case WzFileParseStatus.PATH_IS_NULL:
      return 'Path is null'
    case WzFileParseStatus.ERROR_GAME_VER_HASH:
      return 'Error with game version hash : The specified game version is incorrect and WzLib was unable to determine the version itself'
    default: return ''
  }
}
