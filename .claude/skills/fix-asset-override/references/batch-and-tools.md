# 批量处理与工具获取

## 工具找不到时

问用户放在哪个目录，用户确认后从官方发布页下载：

```bash
gh release download <tag> -R ValveResourceFormat/ValveResourceFormat -p cli-windows-x64.zip -D <dir>
```

CLI 需要同目录的 `libSkiaSharp.dll`、`spirv-cross.dll`。

## 批量列出覆盖原版路径的编译文件

```bash
"$CLI" -i "$VPK" --vpk_list | grep -oE "^particles/[^ ]+\.vpcf_c" | sort -u > stock.txt
(cd game && find particles -name "*.vpcf_c" | sort) > ours.txt
comm -12 ours.txt stock.txt   # 覆盖原版路径的
```

只在 `ours.txt` 里的是自有路径，不会触发本问题。对覆盖列表逐个 `grep -aqE "particles/econ/|models/items/"`：命中的多半是故意覆盖，其余多半是原样拷贝，仍按第一步逐个确认。

被引用的子特效如果也在覆盖列表里，要和父特效一起修，否则父特效缺一部分。

## 批量编译

Tools 没开或文件多时，把源文件绝对路径一行一个写进 `list.txt`：

```bash
"$RC" -filelist list.txt
```

## 模型（`.vmdl_c`）

流程相同，但反编译会拆出网格、骨骼、动画多个文件，重编可能要手动调整。第一次实际修模型后把步骤补进本文件。
