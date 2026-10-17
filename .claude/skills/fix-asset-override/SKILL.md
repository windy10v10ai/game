---
name: fix-asset-override
description: 原版特效或模型在 Tools 里不显示、控制台报 is masking dota / Cannot recompile，或要修我们覆盖原版路径的编译资源。
---

# 修覆盖原版路径的资源

`game/` 里有与原版同路径的编译文件（`.vpcf_c` 等），但源文件不在我们的 `content/`。Tools 判定它过期又不能跨 mod 重编，于是加载失败。修法：反编译成源文件放进 `content/` 同路径，让 Tools 在我们的 mod 里重编。

仓库 `game/`、`content/` 是指向 Dota addon 目录的 junction，在仓库里改即可。批量处理、模型、工具找不到时读 `references/batch-and-tools.md`。

## 工具

| 工具 | 位置 |
|---|---|
| Source 2 Viewer CLI | 环境变量 `S2V_CLI`，未设置时 `C:\App\Source2Viewer-CLI.exe` |
| `resourcecompiler.exe` | `<Dota 2 beta>/game/bin/win64/` |
| 原版资源包 | `<Dota 2 beta>/game/dota/pak01_dir.vpk` |

- CLI 读不了 Dota 刚编译的新文件时（报 `Unknown KVType for variable 'datatype'`），用第四步的 `grep -a` 验证
- CLI 报错会在当前目录写 `exceptions.txt`，用完删掉

## 第一步：判断是否故意覆盖

```bash
"$CLI" -i game/<path>.vpcf_c -d -o <scratch>/ours/<name>.vpcf
# --vpk_filepath 前缀匹配，会连带导出同前缀文件
"$CLI" -i "$VPK" --vpk_filepath "<path 去掉 .vpcf_c>" -d -o <scratch>/stock
diff <scratch>/ours/<name>.vpcf <scratch>/stock/<path>.vpcf
```

- 引用了 `particles/econ/`、`models/items/`、`materials/models/items/`：故意覆盖，继续第二步
- 只有写法和版本号差异：原样拷贝，问用户后删掉该编译文件，让原版生效

完成条件：每个目标文件都已判定为故意覆盖或原样拷贝。

## 第二步：放源文件

反编译结果原样放到 `content/<path>.vpcf`，不需要手改。

完成条件：每个故意覆盖的 `game/<path>.vpcf_c` 在 `content/` 同路径都有 `.vpcf`。

## 第三步：编译

Tools 开着时源文件一出现就自动重编。没开时：

```bash
"$RC" -i "<Dota 2 beta>/content/dota_addons/windy10v10ai/<path>.vpcf"
```

编译报错（部件被 Valve 删除、引用的饰品资源被删或改名）时，按报错改源文件或换成现存路径。

完成条件：每个 `game/<path>.vpcf_c` 的修改时间晚于对应源文件，且没有编译报错。

## 第四步：验证

```bash
grep -aoE "[a-z0-9_/]+\.(vpcf|vmdl)" game/<path>.vpcf_c | sort -u
```

引用路径应与第一步反编译结果一致。再让用户在 Tools 里触发该特效。

完成条件：引用路径一致，用户确认特效显示正常、控制台不再报 `Cannot recompile`。

## 第五步：提交

`content/` 源文件与 `game/` 编译文件都提交，玩家下载的是 `game/` 里的编译文件。

完成条件：`git status` 里每个改动的 `.vpcf_c` 都有对应 `.vpcf` 一起提交。

## 陷阱

`find content -name ...` 不会进入 junction 根目录，结果为空。用 `git ls-files content` 或 `find content/`。
