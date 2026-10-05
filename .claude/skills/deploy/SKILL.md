---
name: deploy
description: 发布地图到 Steam 创意工坊，默认发测试服。触发：「发测试版」「发测试服」「发布」「deploy」「更新 Workshop」，包括定时发布。
---

# 发布到创意工坊

发布靠 Workshop Tools 打包上传，再到网页上补中文更新日志。Workshop Tools 会把地图打成一个 `<编号>.vpk`；SteamCMD 只传散文件，Dota 读不了，地图显示 error，命令行上传已评估过、弃用。

| 目标 | 编号 | Workshop Manager 里的行 |
|---|---|---|
| 测试服（默认） | `2636824668` | 10v10 AI windy beta version (test) |
| 正式服 | `2307479570` | 10v10 AI by windy (Arcade Launch Supported) |

更新日志取当前 PR 的 Release Note 段：上传时填英文块，网页上补中文块。

## 步骤

1. **定目标**：用户没点名正式服就发测试服。发正式服前向用户复述中英文日志全文，等用户确认。
   完成：目标编号和中英文日志都已确定。

2. **拿权限**：一次 `request_access` 申请 `["Dota 2", "dota2.exe"]` 两项，Workshop Tools 的窗口属于后者，只申请前者会再弹一次。
   完成：两项都在已授权列表里。

3. **编译**：确认当前分支就是要发的内容，跑 `npm run build`。换机器 clone 后先用 Dota tools 完整编译一次，否则包里缺 Panorama 图片（见 `add-image` skill）。
   完成：编译无报错。

4. **上传**：Dota tools 没开就运行 `game/bin/win64/dota2.exe -novid -tools -addon windy10v10ai`，再用 computer use：
   - Asset Browser 工具栏点 Steam 图标，打开 Workshop Manager
   - 选中目标那一行，点工具栏第二个按钮（向上箭头）
   - 顶部「更新日志」框填英文日志，其他字段保持原样
   - 点「提交」，等弹窗后点「好的」

   完成：弹窗显示「物品已成功更新至 Steam 创意工坊」。

5. **补中文日志**：用 Claude in Chrome：
   - 打开 `https://steamcommunity.com/sharedfiles/filedetails/changelog/<编号>`，用 `javascript_tool` 读最新一条正文 `<p>` 的 `id`，它就是这条更新的时间戳
   - 打开 `https://steamcommunity.com/sharedfiles/editchangelogentry/<编号>/<时间戳>/`；显示未登录就点「登录」，Chrome 里的 Steam 会话会把页面刷成已登录
   - 语言下拉框用 `form_input` 选简体中文（值 `6`），页面刷新后重新 `read_page` 拿文本框 ref
   - 文本框整段换成中文日志，`javascript_tool` 执行 `SaveChanges()`

   完成：改动说明页加 `?l=schinese` 显示中文日志，加 `?l=english` 显示英文日志。

6. **核对包**：看 `C:\Program Files (x86)\Steam\steamapps\workshop\content\570\<编号>\`。Dota 开着时 Steam 可能还没重新下载，这一项留给用户在重启 Steam 或进游戏前看，并在汇报里说明。
   完成：目录里只有 `<编号>.vpk` 和 `publish_data.txt`。

## 定时发布

到点时没人能点授权弹窗，所以**设置定时任务的当下**就先做第 2 步拿到 Dota 两项权限，并确认 Chrome 已登录 Steam，再创建任务。任务内容是第 3～6 步，目标和中英文日志在设置时就向用户确认好。

## computer use 的坑

Dota 主窗口常压在 Workshop Manager 上，点到主窗口会弹商城广告。在 Asset Browser 里再点一次 Steam 图标，就能把 Workshop Manager 叫回前面。
