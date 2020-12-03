/**
 * @public
 */
export class WzHeader {
  private static readonly DEFAULT_WZ_HEADER_COPYRIGHT: string = 'Package file v1.0 Copyright 2002 Wizet, ZMS'
  public ident: string = ''
  public fsize: bigint = BigInt(0)
  public fstart: number = 0
  public copyright: string = ''

  public recalculateFileStart (): void {
    this.fstart = this.ident.length + 8 + 4 + this.copyright.length + 1
  }

  public static getDefault (): WzHeader {
    const header = new WzHeader()
    header.ident = 'PKG1'
    header.copyright = WzHeader.DEFAULT_WZ_HEADER_COPYRIGHT
    header.fstart = 60
    header.fsize = BigInt(0)
    return header
  }
}
