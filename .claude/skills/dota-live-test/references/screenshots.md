# 用引擎截图

所有要交出去的图（PR、issue、给用户看）都用引擎自带的 `screenshot` 命令出原图再裁剪，要悬停或点击的也一样：computer-use 只负责移鼠标、点击，图仍用引擎命令截。computer-use 的 `screenshot` / `zoom` 是整屏缩小后压成 JPG 的低清图，只用来找坐标，不交出去。

Dota 窗口先最大化：引擎截图的分辨率等于窗口分辨率，小窗口截出来的 tooltip 字太小。

只要画面、不需要点击时，引擎命令连 computer-use 都不用。它只截游戏画面，桌面上的其他窗口（Claude、聊天软件）不会进图；也不需要 computer-use 授权，权限模式自动拒绝授权弹窗时照样能用。

不要用 PowerShell `CopyFromScreen` 截 Dota 窗口区域：Dota 被别的窗口盖住时，截到的是盖在上面的窗口，会把用户别的会话内容带进图里。

## 流程

1. **切前台**：`powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/dota-live-test/scripts/dota-front.ps1`，输出 `foreground is dota: True` 才算成功。Dota 不在前台时引擎不重绘，截到的是窗口失焦那一刻的旧画面（时钟停住）；`engine_no_focus_sleep 0` 解决不了。会短暂挡住用户屏幕，动手前告诉用户
2. **悬停或点击**（需要时）：用 computer-use 移鼠标或点击，停住不动
3. **截图**：等 2 秒让画面刷新，再发 `npm run dota:cmd -- "screenshot"`。日志出现 `[ScreenShot] Screenshot written to: screenshots\shot_NNNN.tga`，文件在 `<dota>/game/dota/screenshots/`，1920×1080 的 TGA
4. **转 PNG 并裁剪**：`python -c "from PIL import Image; Image.open('<tga>').convert('RGB').crop((x0, y0, x1, y1)).save('<png>')"`，存会话 scratchpad。鼠标停在界面上会带出 tooltip，裁掉无关区域

找窗口要按标题 `Dota 2` 找：`Get-Process dota2` 的 `MainWindowHandle` 在 Tools 模式下指向一个 0×0 的隐藏窗口，对它切前台、取窗口区域都无效。脚本已经按标题找。

## 不点击出界面

computer-use 授权被拒或点不了时（`dota2.exe` 用户拒绝，`textinputhost.exe` 被策略拒绝），画面靠临时改代码或临时 Lua 触发，图仍用引擎命令截：

- **个人中心觉醒页**：临时 Lua 用 `-run` 发自定义事件 `hud_open_page`，参数 `page=profile`、`param=awaken`
- **战令属性页**：临时在 `content/panorama/scripts/custom_game/battlepass.js` 里用 `$.Schedule` 调 `ToggleBP()` 与 `SetPropertySelected()`
- **常见问题**：每局随机抽一条，临时改 `content/panorama/scripts/custom_game/game_mode.js` 的抽取，强制成要拍的那条
- **只有专用服才有的界面**：Tools 里 `IsDedicatedServer()` 恒为 false，临时把判断函数改成 `return true;`（如 `launcher-settle-log.ts` 的 `UsesLauncherSettleLog()`）
- **换页会有残影**：还原代码后热重载不会收起已打开的窗口，先拍要干净的那页，或换页前重启
- 每处临时改动拍完用 `git checkout -- <文件>` 还原并重新 build
- **选队阶段 `say -run` 不生效**，调试命令那时还没注册。要在选队阶段触发开局，临时在 `team_select.js` 里用 `$.Schedule` 调 `StartGame()`
- 收起技能抽选面板的脚本里，`lottery_status` 的 key 是 32 位账号 ID（如 `136407523`），不是 64 位 SteamID，用错面板不会收起

## 拍多语言

`npm run launch` 与 `npm run dota:check` 都没有语言参数。多语言要手动启动：用 SKILL.md 步骤 3 的命令加 `-language english` 或 `-language russian`，再用 `npm run dota:cmd` 发命令，不走 `dota:check`；每种语言单独起一次。

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

画面里技能特效位置出现红色 X，是特效资源没加载（多见于克隆技能装到别的英雄），不是效果没触发。日志里不会有对应报错，只能看画面。

- 确认是缺预加载：运行时用临时 Lua 调 `PrecacheUnitByNameAsync("<原英雄单位名>", 回调)`，回调打印后再触发特效，红 X 消失即是。再把特效路径写进该技能 KV 的 `precache` 块，重开一局确认（预加载只在开局时做）
- 特效路径在原版 KV 里查不到时，到 `game/dota/pak01_dir.vpk` 的目录里按技能名找
- 截图前让镜头对准英雄、目标位置不被树木或界面遮挡；看不清目标位置的截图不能用来下结论，重拍
- 个人中心、属性页的半透明背景会透出 Tools 自带的左侧调试面板文字（SCEPTER、ADD ITEM 之类），不是我们的界面，裁图时尽量避开，放进 PR 时注明
- 结算界面顶部条高度固定，离线提示超过两行会被裁掉第三行，玩家看不到。改这类文案后要拍英、俄文确认，它们比中文长
