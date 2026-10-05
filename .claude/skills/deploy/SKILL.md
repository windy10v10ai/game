---
name: deploy
description: 发布地图到 Steam 创意工坊的测试服或正式服。触发：用户说「发测试版」「发测试服」「发布」「deploy」「上传 Steam」「更新 Workshop」。
---

# 发布到创意工坊

**只用 Dota 2 Workshop Tools 的发布功能发布**，不用 SteamCMD 命令行：Workshop Tools 会把地图打成一个 `<编号>.vpk` 再上传，SteamCMD 只会上传散文件，Dota 读不了，大厅里地图显示 error。命令行自己打包要依赖非官方的 VPK 格式实现，已评估过，不做。

| 目标 | 创意工坊编号 |
|---|---|
| 测试服 | `2636824668` |
| 正式服 | `2307479570` |

## 流程

1. **确认发哪个**：用户没说发正式服就是测试服。正式服所有订阅者会立刻收到，发之前先向用户复述中英文更新日志全文（取当前 PR 的 Release Note 段）并等确认
2. **确认内容**：上传的是本机 `game/dota_addons/<addon>` 目录，也就是当前 checkout 编译后的产物，先确认分支对
3. **编译与清理**：`npm run workshop:prepare`，编译 VScripts 与 Panorama，并删掉不该进包的 tools 缓存文件。换机器 clone 后还要先用 Dota tools 完整编译一次，否则 Panorama 图片的 `vtex_c` 不在包里（见 `add-image` skill）
4. **发布**：由用户在 Workshop Tools 里发布到对应编号，填写更新说明。需要用 computer use 代点时，先经用户同意

## 判断是否成功

发布后 Steam 会把条目下载到 `C:\Program Files (x86)\Steam\steamapps\workshop\content\570\<编号>\`。正常的条目只有 `<编号>.vpk` 和 `publish_data.txt` 两个文件；看到散开的 `maps/`、`scripts/` 等目录，说明是用错误方式上传的，地图会打不开。

## 中文更新日志

发布时只能写一条不分语言的更新说明。测试服直接用中文写。正式服用英文写，中文日志由用户在 `https://steamcommunity.com/sharedfiles/filedetails/changelog/<编号>` 里补上，或经用户同意后用 Claude in Chrome 编辑最新一条：语言选简体中文后要重新读一次页面，表单元素的 ref 会刷新。
