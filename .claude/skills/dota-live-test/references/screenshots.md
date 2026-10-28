# 不用 computer-use 截图

只要画面、不需要点击时，用引擎自带的 `screenshot` 命令截图。它只截游戏画面，桌面上的其他窗口（Claude、聊天软件）不会进图；也不需要 computer-use 授权，权限模式自动拒绝授权弹窗时照样能用。

不要用 PowerShell `CopyFromScreen` 截 Dota 窗口区域：Dota 被别的窗口盖住时，截到的是盖在上面的窗口，会把用户别的会话内容带进图里。

## 流程

1. **切前台**：`powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/dota-live-test/scripts/dota-front.ps1`，输出 `foreground is dota: True` 才算成功。Dota 不在前台时引擎不重绘，截到的是窗口失焦那一刻的旧画面（时钟停住）；`engine_no_focus_sleep 0` 解决不了。会短暂挡住用户屏幕，动手前告诉用户
2. **截图**：等 2 秒让画面刷新，再发 `npm run dota:cmd -- "screenshot"`。日志出现 `[ScreenShot] Screenshot written to: screenshots\shot_NNNN.tga`，文件在 `<dota>/game/dota/screenshots/`，1920×1080 的 TGA
3. **转 PNG 并裁剪**：`python -c "from PIL import Image; Image.open('<tga>').convert('RGB').crop((x0, y0, x1, y1)).save('<png>')"`，存会话 scratchpad。鼠标停在界面上会带出 tooltip，裁掉无关区域

找窗口要按标题 `Dota 2` 找：`Get-Process dota2` 的 `MainWindowHandle` 在 Tools 模式下指向一个 0×0 的隐藏窗口，对它切前台、取窗口区域都无效。脚本已经按标题找。

## 收起技能抽选面板

开局的技能抽选面板盖在屏幕中间，会挡住结算面板等界面。它只在三个技能都选了、且没有重选次数时自动隐藏，点不了「折叠」按钮时用临时 Lua 脚本直接写这个状态。在 `game/scripts/vscripts/` 下建一个临时文件（如 `tmp_hide_lottery.lua`，steamId 换成玩家自己的），发 `npm run dota:cmd -- "say -run tmp_hide_lottery"`，用完删掉，不提交：

```lua
local key = "<steamId>"
local s = CustomNetTables:GetTableValue("lottery_status", key) or {}
s.activeAbilityName = s.activeAbilityName or "x"
s.passiveAbilityName = s.passiveAbilityName or "x"
s.passiveAbilityName2 = s.passiveAbilityName2 or "x"
s.abilityResettableCount = 0
CustomNetTables:SetTableValue("lottery_status", key, s)
```

## 同一局反复截结算面板

`-end [3]` 可以在同一局里反复触发结算并弹出面板。面板只在 `ending_status` 表的 `ending_data` 值变化时重建，连续两次获胜方相同时，面板不会重建，显示的还是上一次的数据。每次 `-end` 前先用临时 Lua 脚本清一下：

```lua
CustomNetTables:SetTableValue("ending_status", "ending_data", { winner_team_id = 0 })
```

本地后端有 5 分钟结算冷却，同一玩家连续结算前删掉模拟器里的限额文档：`curl -X DELETE -H "Authorization: Bearer owner" "http://localhost:8080/v1/projects/windy10v10ai/databases/(default)/documents/LocalRateLimits/<steamId>"`。只清冷却、要保留当日扣分记录时，改成只删该文档的 `lastRequestAt` 字段。

## 判读

画面里技能特效位置出现红色 X，是特效资源没加载（多见于克隆技能装到别的英雄），不是效果没触发。
