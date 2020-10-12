<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/wz](./wz.md) &gt; [WzBinaryReader](./wz.wzbinaryreader.md)

## WzBinaryReader class


<b>Signature:</b>

```typescript
export declare class WzBinaryReader extends BinaryReader 
```
<b>Extends:</b> [BinaryReader](./wz.binaryreader.md)

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(filePath, wzIv)](./wz.wzbinaryreader._constructor_.md) |  | Constructs a new instance of the <code>WzBinaryReader</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [hash](./wz.wzbinaryreader.hash.md) |  | number |  |
|  [header](./wz.wzbinaryreader.header.md) |  | [WzHeader](./wz.wzheader.md) |  |
|  [wzKey](./wz.wzbinaryreader.wzkey.md) |  | [WzMutableKey](./wz.wzmutablekey.md) |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [decryptNonUnicodeString(stringToDecrypt)](./wz.wzbinaryreader.decryptnonunicodestring.md) |  |  |
|  [decryptString(stringToDecrypt)](./wz.wzbinaryreader.decryptstring.md) |  |  |
|  [readNullTerminatedString()](./wz.wzbinaryreader.readnullterminatedstring.md) |  |  |
|  [readStringBlock(offset)](./wz.wzbinaryreader.readstringblock.md) |  |  |
|  [readWzInt()](./wz.wzbinaryreader.readwzint.md) |  |  |
|  [readWzLong()](./wz.wzbinaryreader.readwzlong.md) |  |  |
|  [readWzOffset()](./wz.wzbinaryreader.readwzoffset.md) |  |  |
|  [readWzString()](./wz.wzbinaryreader.readwzstring.md) |  |  |
|  [readWzStringAtOffset(offset, readByte)](./wz.wzbinaryreader.readwzstringatoffset.md) |  |  |
