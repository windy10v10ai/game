---
name: dota-live-test
description: >-
  在 Dota 2 Tools 里实机跑一局，把控制台输出落盘成文件后 grep 验证改动：启动参数加
  -condebug -conclearlog，按需拉起本地 firebase 模拟器与 API，开局触发流程，再对照
  [VScript]（服务端 print）与 [PanoramaScript]（客户端 $.Msg）两路日志。
  Use when 用户说「实机验证」「跑一局看看」「帮我测一下」「用 tools 跑起来」，
  或改动依赖引擎运行时行为（事件收发、modifier 生效、API 链路），jest 覆盖不到。
---

# Dota Live Test

实机验证的关键是**日志落盘**：让 Dota 把控制台输出写进文件，用 `grep` 读，而不是截图读 VConsole 窗口。

`con_logfile` 在 Source 2 不是有效命令，运行时开不了文件日志，只能在**启动参数**里加。

## 派子代理跑

下面的步骤是照本宣科的固定流程，判断日志算不算通过则要改动的上下文。分工：子代理跑流程并回报观察，主会话做判断。

用 Agent 工具、`model: "sonnet"`，**一轮验证派一个**，跑完即结束；要再验一轮就再派一个。子代理是冷启动，交接里写全：改了什么、要不要本地后端、怎么触发、期待哪几行日志。

- **只回报观察**：哪几行出现了、时间戳是多少、断在哪一步。诊断和改代码留给主会话
- **开工先查端口**，没起的自己起——上一轮的后台进程不一定还活着
- **不收尾**：全部验证结束后由主会话统一杀进程，中途杀了下一轮还要重起

验证点只有一两个时，写交接比自己跑还贵，直接自己跑。

拿到这份 skill 的子代理从第 1 步开始，不再往下派。

## 步骤

### 1. 编译改动

改了 `src/vscripts/` 跑一次 `npm run build:vscripts`。`content/panorama/` 下的 `.js` 由 tools 自动编译并热重载，不用手动处理。

完成判据：编译无报错。

### 2. 决定要不要本地后端

只验游戏内逻辑（技能、modifier、AI、UI）跳到第 3 步。要验 API 链路才起后端。

后端在 `C:/Users/windy/Documents/GitHub/firebase`（需要 java）：

```bash
firebase emulators:start --only firestore,auth --import ./firestore-backup --project windy10v10ai
```

```bash
cd api && npm run start
```

两条都用 Bash 的 `run_in_background` 起，输出写进任务文件，不要前台轮询。模拟器占 8080 / 9099，API 占 3001，**等 3001 进入 LISTENING 再开局**，否则开局请求会打空。

同时确认 `src/vscripts/api/api-client.local.ts` 的 `GetApiTarget()` 返回 `'local'`。

完成判据：`netstat -ano | grep -E ":(8080|9099|3001)\b.*LISTENING"` 三个端口都在。

### 3. 启动 Dota

Dota 已在运行时直接 `Start-Process` 会开出第二个实例，只弹一个 `Source2 - Warning` 窗口，要先 `Stop-Process -Name dota2 -Force`。

```powershell
$dota = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\bin\win64"; Start-Process -FilePath "$dota\dota2.exe" -WorkingDirectory $dota -ArgumentList '-novid','-tools','-addon','windy10v10ai','-condebug','-conclearlog','+dota_launch_custom_game','windy10v10ai','dota'
```

`-condebug` 把输出写到 `<dota>/game/dota/console.log`，`-conclearlog` 每次启动清空该文件，避免跨会话累积。`+dota_launch_custom_game` 让地图自动加载，不需要点任何按钮。

完成判据：`console.log` 出现且体积在涨。

### 4. 触发要验的流程

开局流程（`/game/start`、队伍选择、抽奖初始化）在地图加载时自动跑完，第 3 步就已经触发。

需要再跑一遍时有两种重开方式：

- **重启进程**，参数同上。慢一两分钟，任何环境都能用。
- **VConsole 命令框**输入 `dota_launch_custom_game windy10v10ai dota`，几秒钟重新加载。需要能操作窗口，即桌面应用的 computer-use MCP；Claude Code CLI 里没有这套工具。

重开前记下当前行数（`wc -l < console.log`），之后用 `awk 'NR>N'` 只看新增部分。

完成判据：日志里出现目标流程的第一条输出。

### 5. 读日志

```bash
grep -n "ApiHtmlProxy\|GameStartProxy" "C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/console.log"
```

两路输出都在同一个文件里，按前缀区分：

| 前缀 | 来源 |
|---|---|
| `[VScript]` | 服务端 `print()` |
| `[PanoramaScript]` | 客户端 `$.Msg()` |

每行带 `MM/DD HH:MM:SS` 时间戳，跨端时序（谁先谁后、间隔多久）直接读得出来，是定位握手和时机类问题的主要依据。

等日志出现用 Bash 的 `run_in_background` 跑 `until grep -q ...; do sleep 5; done`。

完成判据：目标流程的每一步都在日志里找到对应行，或明确指出断在哪一步。

### 6. 收尾

`TaskStop` 只杀后台任务的外层 shell，模拟器的 java 和 API 的 node 会活下来，要按 PID 补杀，再确认三个端口都已释放。

Dota 退出后按需删 `console.log`。

完成判据：端口全部释放。

## 临时调试日志

为定位问题临时加的 `print` / `$.Msg` 在问题定位完后要删干净，只留下调用与结果两类。判据：一次请求的日志量不随数据量增长（不整条打印响应体）。
