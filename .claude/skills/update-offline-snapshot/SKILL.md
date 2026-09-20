---
name: update-offline-snapshot
description: >-
  刷新游戏内离线玩家数据快照：从 Firestore 直接导出会员、积分与属性、觉醒、玩家设置 KV 文件与导出时间到
  game/scripts/kv/。7.41f 起本地主机发不出 HTTP 请求，游戏靠这批随地图发布的快照读玩家数据。
  Use when 用户说「更新快照」「拉一下离线数据」「刷新会员数据」，或准备发布创意工坊地图之前。
---

# Update Offline Snapshot

从 Firestore 导出 KV 快照，直接落到本仓库 `game/scripts/kv/`，随地图发布后由
`src/vscripts/api/player-snapshot.ts` 在 `/game/start` 失败时读取。

导出脚本住在 **firebase 仓库**（`api/scripts/offline-snapshot/export-player-snapshot.ts`），
不在本仓库。它 import 后端现成的 `PlayerLevelHelper` 算等级，口径与网站一致——
**不要在本仓库另写一份导出逻辑**。

## 产出

| 文件 | 内容 |
|---|---|
| `player_snapshot_member.kv` | 会员等级与到期时间戳 |
| `player_snapshot_player.kv` | 积分、等级、属性加点（体积最大） |
| `player_snapshot_awaken.kv` | 已解锁觉醒英雄 |
| `player_snapshot_setting.kv` | 快捷键、快速施法、按地图游戏预设 |
| `player_snapshot_meta.kv` | 导出时间，游戏内离线提示显示为「截至某日」 |

## 步骤

### 1. 定位 firebase 仓库

默认取本仓库的同级目录，即 `<本仓库父目录>/firebase`。该目录不存在时用
`AskUserQuestion` 问用户路径，**不要猜测其他位置，也不要去 clone**。

### 2. 执行导出

在 firebase 仓库的 `api/` 下跑，输出目录传本仓库 `game/scripts/kv/` 的**绝对路径**：

```bash
cd <firebase>/api && npm run export:snapshot -- <本仓库绝对路径>/game/scripts/kv
```

`--` 不能省，否则参数被 npm 吃掉，文件会落到 firebase 仓库的默认 output 目录。
输出目录不存在时脚本自己建，不用先 mkdir。

单次约 2 万次 Firestore 文档读，在每天 5 万次免费额度内，但不要为了试而反复跑。

### 3. 校验产出

脚本对每个文件打印 `<文件名>: <行数> 行, <字节数> 字节`。逐条核对：

- 五个文件都在且都非空
- 行数相对上次没有骤降。**骤降先查原因再决定发不发**——通常是查询窗口或字段口径出了问题，
  发出去会让一批玩家的会员或属性凭空消失

把四行统计原样报给用户，这是判断窗口开得合不合适的唯一反馈。

## 发布须知

- `game/scripts/kv/` **整个目录已 gitignore**（快照含明文 steamId 生产数据）。换机器
  clone 后必须重跑本 skill 才能发布，否则地图里没有任何玩家数据
- 五个文件合计约 13MB，直接进地图包。每次发布玩家都要重新下载，体积变化值得留意

## 常见错误

| 现象 | 原因与处理 |
|---|---|
| `Could not load the default credentials` | 该机器没配 ADC，跑 `gcloud auth application-default login` |
| 文件落到 firebase 仓库的 `output/` | `npm run` 后漏了 `--`，参数没传到脚本 |
| 游戏内读不到数据但文件存在 | 快照只在 `/game/start` **失败**时读取。Dota Tools 里后端通着就不会触发，要先停本地后端 |

## 不要写进本 skill 的东西

窗口天数、字段口径、各集合条数——都在 firebase 仓库的脚本与设计文档里。抄到这里就是
一份不会跟着更新的过期副本，读的人反而判断不了哪个是真的。
