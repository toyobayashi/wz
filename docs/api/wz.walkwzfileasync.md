<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/wz](./wz.md) &gt; [walkWzFileAsync](./wz.walkwzfileasync.md)

## walkWzFileAsync() function

**Signature:**

```typescript
export declare function walkWzFileAsync(filepath: string | File, mapleVersion: WzMapleVersion, callback: <T extends WzObject>(obj: T) => boolean | undefined | Promise<boolean | undefined>): Promise<boolean>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  filepath | string \| File |  |
|  mapleVersion | [WzMapleVersion](./wz.wzmapleversion.md) |  |
|  callback | &lt;T extends [WzObject](./wz.wzobject.md)<!-- -->&gt;(obj: T) =&gt; boolean \| undefined \| Promise&lt;boolean \| undefined&gt; |  |

**Returns:**

Promise&lt;boolean&gt;

`true` if stop manually

