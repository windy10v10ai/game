---
name: fix-asset-override
description: 原版特效或模型在 Tools 里不显示、控制台报 is masking dota / Cannot recompile，或要修我们覆盖原版路径的编译资源。
---

# 修覆盖原版路径的资源

## 症状与原因

Tools 控制台出现：

```
Cannot recompile '<path>.vpcf': Active compiled file (.../game/dota_addons/windy10v10ai/<path>.vpcf_c) is in different mod than active content file (.../content/dota/<path>.vpcf) ... (dota_addons/windy10v10ai is masking dota)
Failed loading resource "<path>.vpcf_c" (ERROR_COMPILEFAIL: Tools mode - tried to (re)compile an asset but failed)
```

`game/` 里有一个与原版同路径的编译文件（`.vpcf_c` / `.vmdl_c` …），盖住了原版，但它的源文件不在我们的 `content/`。Tools 发现它与 `content/dota/` 里的原版源文件指纹不一致，想重编又不能跨 mod 编译，于是加载失败，特效不显示。

修法：把我们的编译文件反编译成源文件，放进 `content/` 同路径，让 Tools 在我们自己的 mod 里重编。

仓库 `game/`、`content/` 是指向 Dota 安装目录 `game/dota_addons/windy10v10ai`、`content/dota_addons/windy10v10ai` 的 junction（`src/scripts/install.js`），在仓库里改就等于改 Dota 目录。

## 工具

| 工具 | 位置 |
|---|---|
| Source 2 Viewer CLI（反编译、读 VPK） | 环境变量 `S2V_CLI`，未设置时用 `C:\App\Source2Viewer-CLI.exe`（同目录需 `libSkiaSharp.dll`、`spirv-cross.dll`） |
| `resourcecompiler.exe`（编译） | `<Dota 2 beta>/game/bin/win64/resourcecompiler.exe` |
| 原版资源包 | `<Dota 2 beta>/game/dota/pak01_dir.vpk` |

都找不到时，问用户放在哪个目录，再从官方发布页下载（要用户确认）：

```bash
gh release download <tag> -R ValveResourceFormat/ValveResourceFormat -p cli-windows-x64.zip -D <dir>
```

- 反编译旧编译文件和原版 VPK，较旧版本即可
- Dota 刚编译出的新文件，旧版 CLI 可能报 `Unknown KVType for variable 'datatype'`，读不了。验证时改用第 4 步的 `grep -a`，或升级 CLI
- CLI 报错时会在当前目录写一个 `exceptions.txt`，用完删掉，别提交

## 第一步：判断是否故意覆盖

```bash
CLI=/c/App/Source2Viewer-CLI.exe
VPK="/c/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk"
# 我们的版本
"$CLI" -i game/<path>.vpcf_c -d -o <scratch>/ours/<name>.vpcf
# 原版（--vpk_filepath 是前缀匹配，会连带导出同前缀的文件）
"$CLI" -i "$VPK" --vpk_filepath "<path 去掉 .vpcf_c>" -d -o <scratch>/stock
diff <scratch>/ours/<name>.vpcf <scratch>/stock/<path>.vpcf
```

- 引用了 `particles/econ/`、`models/items/`、`materials/models/items/`：故意把原版效果换成饰品效果，走第二步
- 只有格式差异（写法、版本号、编辑器预览字段）：旧的原样拷贝，问用户后删掉该编译文件，让原版生效

批量列出哪些编译文件覆盖了原版路径：

```bash
"$CLI" -i "$VPK" --vpk_list | grep -oE "^particles/[^ ]+\.vpcf_c" | sort -u > stock.txt
(cd game && find particles -name "*.vpcf_c" | sort) > ours.txt
comm -12 ours.txt stock.txt   # 覆盖原版路径的
```

只在 `ours.txt` 里的是自有路径，不会触发本问题。再对覆盖列表 `grep -aqE "particles/econ/|models/items/"` 就能粗分故意 / 原样拷贝。

## 第二步：放源文件

反编译结果原样放到 `content/<path>.vpcf`（与 `game/<path>.vpcf_c` 同路径），不需要手改。旧版写法（如已改名的初始化器）由编译器自动升级。

## 第三步：编译

- Tools 开着时，源文件一出现就会自动重编，`game/` 里的 `.vpcf_c` 随即变化
- Tools 没开或批量时，用 `resourcecompiler.exe`：

```bash
RC="/c/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/bin/win64/resourcecompiler.exe"
"$RC" -i "<Dota 2 beta>/content/dota_addons/windy10v10ai/<path>.vpcf"
# 批量：一行一个绝对路径写进 list.txt
"$RC" -filelist list.txt
```

编译报错时（Valve 删掉了某个部件、引用的饰品资源被删或改名），按报错手动改源文件，或换成现存的饰品路径。

## 第四步：验证

1. 新编译文件里的引用路径还是饰品资源：`grep -aoE "[a-z0-9_/]+\.(vpcf|vmdl)" game/<path>.vpcf_c | sort -u`
2. 被引用的子特效如果也在覆盖列表里，要一起修，否则父特效缺一部分
3. 让用户在 Tools 里放一次技能，确认特效出现、控制台不再报 `Cannot recompile`。反编译不保证完全还原，以实机效果为准

## 第五步：提交

`content/<path>.vpcf` 源文件和 `game/<path>.vpcf_c` 编译产物都要提交：玩家下载的是 `game/` 里的编译文件。`.vpcf` 提交时的 LF/CRLF 警告无害。

## 陷阱

- `find content -name ...` 不会进入 junction 根目录，结果为空。用 `git ls-files content`，或 `find content/`（带斜杠）
- 模型（`.vmdl_c`）流程相同，但反编译会拆出网格、骨骼、动画多个文件，重编可能要手动调整。第一次实际修模型后把步骤补进本文件
