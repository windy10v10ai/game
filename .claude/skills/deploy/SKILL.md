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
3. **编译**：`npm run build`。换机器 clone 后还要先用 Dota tools 完整编译一次，否则 Panorama 图片的 `vtex_c` 不在包里（见 `add-image` skill）
4. **上传**：Dota tools 没开就运行 `game/bin/win64/dota2.exe -novid -tools -addon <addon>`。用 computer use 操作，测试服和正式服流程相同，只是选的行不同：
   - Asset Browser 工具栏里点 Steam 图标，打开 Workshop Manager
   - 在列表里选中目标条目：测试服是「10v10 AI windy beta version (test)」，正式服是「10v10 AI by windy (Arcade Launch Supported)」
   - 点工具栏第二个按钮（向上箭头），打开上传窗口
   - 在顶部「更新日志」框里填**英文**更新说明，格式照 Release Note 的英文块（`[b]Gameplay update vX[/b]` 加空行和列表）；标题、描述、预览图、可见性都不动
   - 点「提交」，等到弹出「物品已成功更新至 Steam 创意工坊」，再点「好的」关闭
5. **补中文更新日志**：见下一节

computer use 的坑：Dota 主窗口常常压在 Workshop Manager 上面，误点到主窗口会弹出商城广告。先把主窗口拖开，或者在 Asset Browser 里再点一次 Steam 图标，把 Workshop Manager 叫到前面。

## 中文更新日志

用 Claude in Chrome 操作：

1. 打开 `https://steamcommunity.com/sharedfiles/filedetails/changelog/<编号>`，用 `javascript_tool` 读最新一条更新正文所在 `<p>` 的 `id`，这个 id 就是这条更新的时间戳
2. 打开 `https://steamcommunity.com/sharedfiles/editchangelogentry/<编号>/<时间戳>/`。页面显示未登录时点「登录」：Chrome 里有 Steam 的登录状态，点一下就会刷新成已登录，不用输入任何东西
3. `read_page` 找到语言下拉框，用 `form_input` 选「简体中文」（值为 `6`）；页面会刷新，要重新 `read_page` 拿文本框的 ref
4. 文本框里预先填着英文，整段换成 Release Note 的中文块，再用 `javascript_tool` 执行 `SaveChanges()`
5. 回到改动说明页，分别用 `?l=schinese` 和 `?l=english` 打开核对，两种语言各显示各自的内容

## 判断是否成功

- 上传窗口弹出「物品已成功更新至 Steam 创意工坊」
- Steam 之后会把条目下载到 `C:\Program Files (x86)\Steam\steamapps\workshop\content\570\<编号>\`，正常的条目只有 `<编号>.vpk` 和 `publish_data.txt` 两个文件；看到散开的 `maps/`、`scripts/` 等目录，说明是用错误方式上传的，地图会打不开。Dota 开着的时候 Steam 不一定立刻重新下载，重启 Steam 或进游戏前再核对
