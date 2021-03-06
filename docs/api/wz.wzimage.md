<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/wz](./wz.md) &gt; [WzImage](./wz.wzimage.md)

## WzImage class


<b>Signature:</b>

```typescript
export declare class WzImage extends WzObject implements IPropertyContainer 
```
<b>Extends:</b> [WzObject](./wz.wzobject.md)

<b>Implements:</b> [IPropertyContainer](./wz.ipropertycontainer.md)

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(name, reader, checksum)](./wz.wzimage._constructor_.md) |  | Constructs a new instance of the <code>WzImage</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [blockSize](./wz.wzimage.blocksize.md) |  | number |  |
|  [blockStart](./wz.wzimage.blockstart.md) |  | number |  |
|  [changed](./wz.wzimage.changed.md) |  | boolean |  |
|  [checksum](./wz.wzimage.checksum.md) |  | number |  |
|  [isLuaImage](./wz.wzimage.isluaimage.md) |  | boolean |  |
|  [name](./wz.wzimage.name.md) |  | string |  |
|  [objectType](./wz.wzimage.objecttype.md) |  | [WzObjectType](./wz.wzobjecttype.md) |  |
|  [offset](./wz.wzimage.offset.md) |  | number |  |
|  [parent](./wz.wzimage.parent.md) |  | [WzObject](./wz.wzobject.md) \| null |  |
|  [parsed](./wz.wzimage.parsed.md) |  | boolean |  |
|  [parseEverything](./wz.wzimage.parseeverything.md) |  | boolean |  |
|  [reader](./wz.wzimage.reader.md) |  | [WzBinaryReader](./wz.wzbinaryreader.md) |  |
|  [tempFileEnd](./wz.wzimage.tempfileend.md) |  | bigint |  |
|  [tempFileStart](./wz.wzimage.tempfilestart.md) |  | bigint |  |
|  [wzFileParent](./wz.wzimage.wzfileparent.md) |  | [WzFile](./wz.wzfile.md) \| null |  |
|  [wzProperties](./wz.wzimage.wzproperties.md) |  | Set&lt;[WzImageProperty](./wz.wzimageproperty.md)<!-- -->&gt; |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [addProperties(props)](./wz.wzimage.addproperties.md) |  |  |
|  [addProperty(prop)](./wz.wzimage.addproperty.md) |  |  |
|  [at(name)](./wz.wzimage.at.md) |  |  |
|  [calculateAndSetImageChecksum(bytes)](./wz.wzimage.calculateandsetimagechecksum.md) |  |  |
|  [clearProperties()](./wz.wzimage.clearproperties.md) |  |  |
|  [dispose()](./wz.wzimage.dispose.md) |  |  |
|  [getFromPath(path)](./wz.wzimage.getfrompath.md) |  |  |
|  [parseImage(forceReadFromData)](./wz.wzimage.parseimage.md) |  |  |
|  [removeProperty(prop)](./wz.wzimage.removeproperty.md) |  |  |
|  [set(name, value)](./wz.wzimage.set.md) |  |  |

