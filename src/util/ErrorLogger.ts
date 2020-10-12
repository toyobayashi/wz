import * as fs from 'fs'
import { dirname } from 'path'
import { EOL } from 'os'

/** @public */
export enum ErrorLevel {
  MissingFeature,
  IncorrectStructure,
  Critical,
  Crash
}

/** @public */
export class WzError extends Error {
  public constructor (public level: ErrorLevel, message: string) {
    super(message)
  }
}

/** @public */
export class ErrorLogger {
  private static readonly _errorList: Set<WzError> = new Set()

  public static log (level: ErrorLevel, message: string): void {
    this._errorList.add(new WzError(level, message))
  }

  public static errorsPresent (): boolean {
    return this._errorList.size > 0
  }

  public static clearErrors (): void {
    return this._errorList.clear()
  }

  public static saveToFile (file: string): void {
    try {
      fs.mkdirSync(dirname(file), { recursive: true })
    } catch (_) {}
    const fd = fs.openSync(file, 'w')
    fs.writeSync(fd, Buffer.from(`Starting error log on ${new Date().toLocaleString()}${EOL}`))
    for (const err of this._errorList) {
      fs.writeSync(fd, Buffer.from(`[${ErrorLevel[err.level]}] ${err.message}${EOL}`))
    }
    fs.closeSync(fd)
  }
}
