export class WzHeader {
  public ident: string = ''
  public fsize: bigint = 0n
  public fstart: number = 0
  public copyright: string = ''

  public recalculateFileStart (): void {
    this.fstart = this.ident.length + 8 + 4 + this.copyright.length + 1
  }

  public static getDefault (): WzHeader {
    const header = new WzHeader()
    header.ident = 'PKG1'
    header.copyright = 'Package file v1.0 Copyright 2002 Wizet, ZMS'
    header.fstart = 60
    header.fsize = 0n
    return header
  }
}
