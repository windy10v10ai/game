---
name: deploy
description: 发布地图到 Steam 创意工坊的测试服或正式服。触发：用户说「发测试版」「发测试服」「发布」「deploy」「上传 Steam」「更新 Workshop」。
---

# 发布到创意工坊

用 SteamCMD 命令行上传，不用 computer use 点 Workshop Tools：命令的成败看日志就能判断，界面操作慢且容易点错。

| 目标 | 命令 | 创意工坊编号 |
|---|---|---|
| 测试服（默认） | `npm run deploy:test -- "<英文更新说明>"` | `2636824668` |
| 正式服 | `npm run predeploy && npm run deploy -- "<英文更新说明>"` | `2307479570` |

- **用户没说发正式服就发测试服**。测试服只给找来实测的朋友用，可以直接发
- **发正式服前必须先复述中英文更新日志全文、等用户确认**：所有订阅者会立刻收到。更新日志取当前 PR 的 Release Note 段；多行用 `\n` 表示换行
- 先确认当前分支就是要发的内容：上传的是本机 `game/dota_addons/<addon>` 目录，也就是当前 checkout 编译后的产物
- 换机器 clone 后要先用 Dota tools 完整编译一次，否则 Panorama 图片的 `vtex_c` 不在包里（见 `add-image` skill）

## 判断是否成功

`[publish] Workshop item updated successfully.` 只说明 SteamCMD 正常退出，不代表上传成功。读 `C:\App\steamcmd\logs\workshop_log.txt` 最后几行：

- `Upload finished for workshop item <编号> : OK`，且前面有 `Uploaded new content` → 成功
- 出现 `Reverting to previous content` → 这次上传被回滚，创意工坊上仍是旧版本，向用户报告

SteamCMD 登录过期时上传会停在登录步骤。让用户自己在终端运行 `C:\App\steamcmd\steamcmd.exe +login <用户名> +quit` 登录（可能要输 Steam 令牌），不要代为输入密码。

## 中文更新日志

SteamCMD 一次只写一条不分语言的更新说明。测试服直接用中文写这条说明即可。正式服先用英文发布，中文日志由用户在 `https://steamcommunity.com/sharedfiles/filedetails/changelog/<编号>` 里补上，或经用户同意后用 Claude in Chrome 编辑最新一条：语言选简体中文后要重新读一次页面，表单元素的 ref 会刷新。

`deploy:test` 的编译放在 `predeploy:test` 钩子里，不要写成 `npm run predeploy && node ...`：Windows 下 npm 会把转发给 `&&` 后面命令的参数转义成 `^Test^ build^`，原样出现在更新日志里。
