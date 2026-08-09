# 每日挑战游戏端实施与接口

## 1. 责任边界

后端负责挑战日、任务抽取、星级、目标、奖励、刷新扣费、正式进度、三轮推进、共同排名、连续天数和幂等奖励。游戏端负责：

- 上报比赛与指标；
- 发送接取、刷新、同步、查看和快照请求；
- 接收协议 v2 快照；
- 展示正式进度与当前局暂存进度；
- 在快照变化后切换当前轮 UI。

客户端不得自行生成候选、提升轮次或计算应发积分。

## 2. 协议版本

`src/common/dto/daily-challenge.d.ts` 定义：

```ts
export type DailyChallengeSnapshotVersion = 2;
export type DailyChallengeStar = 1 | 2 | 3;
```

个人任务快照新增：

```ts
star?: 1 | 2 | 3;
```

`star` 对个人任务由后端冻结；共同任务可省略。滚动部署期间，缺少 `star` 的旧个人任务在 UI 中按二星展示。

玩家快照新增：

```ts
completedRoundCount?: number;
currentRound?: number;
totalRounds?: number;
completedTasks?: DailyChallengeTaskSnapshotDto[];
```

这些字段在 DTO 中暂为可选，以兼容滚动部署和 Panorama/Lua 数字键对象。客户端归一化默认值：

- `totalRounds = 3`；
- `completedTasks = []`；
- `completedRoundCount = completedTasks.length`；
- `currentRound = min(totalRounds, completedRoundCount + 1)`；
- 缺失星级按二星展示。

正式后端 v2 快照应始终返回完整轮次字段。

## 3. 快照状态约束

| 状态       | acceptedTask | candidates | needsSelection | UI                           |
| ---------- | ------------ | ---------- | -------------- | ---------------------------- |
| 本轮待选   | 无           | 3 条       | `true`         | 显示三选一和刷新             |
| 本轮进行中 | 有           | 可为空     | `false`        | 显示星级、奖励、进度条和同步 |
| 三轮完成   | 无           | `[]`       | `false`        | 显示三轮记录与奖励总计       |

三轮完成以 `completedRoundCount >= totalRounds` 为准，不能用“没有任务”代替完成态。

快照必须同时按挑战日和同日更新时间防回退。共用排序函数 `shouldReplaceDailyChallengeSnapshot()` 的规则为：新挑战日覆盖旧挑战日；旧挑战日永不覆盖新挑战日；同日有时间戳时只接受 `incoming.updatedAt >= current.updatedAt`；当前有时间戳而传入缺失时拒绝；两边都无时间戳时保持兼容。相同时间戳允许更新，因为当前局临时进度会沿用正式快照版本。

## 4. Panorama 数据流

1. `DailyChallengeContext` 订阅 `daily_challenge_action_result`。
2. 收到快照后调用 `normalizeDailyChallengePlayerSnapshot`。
3. React state 更新触发 `DailyChallengePage` 重渲染。
4. 如果上一轮刚完成且后端返回新候选，页面自动展示下一轮三选一。
5. 如果第三轮完成，页面展示 `completedTasks` 列表和奖励总计。

主要事件：

| 方向            | 事件                               | 用途                   |
| --------------- | ---------------------------------- | ---------------------- |
| Panorama → Game | `daily_challenge_request_snapshot` | 请求当前快照           |
| Panorama → Game | `daily_challenge_accept`           | 接取候选任务           |
| Panorama → Game | `daily_challenge_refresh`          | 刷新当前轮候选         |
| Panorama → Game | `daily_challenge_sync_progress`    | 同步当前局暂存进度     |
| Panorama → Game | `daily_challenge_view`             | 标记入口/奖励已查看    |
| Game → Panorama | `daily_challenge_action_result`    | 返回动作结果和最新快照 |

所有动作使用 `requestId` 做响应匹配；超时允许重试，刷新重试必须复用原请求，避免重复扣费。

比赛开始响应还受挑战日顺序保护：`DailyChallengeMatchContext.confirmMatchStart()` 在已确认较新 `dayId` 后拒绝旧挑战日迟到响应。被拒绝的响应不得覆盖当前 `matchStartedAt`、玩家快照或本局已接任务记录。

VScript `publishSnapshot()` 必须检查私有 snapshot store 的布尔返回值。store 拒绝迟到旧快照时，动作结果改发当前缓存快照，不能把被拒绝内容继续传给 Panorama。接取动作只有在响应快照被 store 接受、玩家身份未变化且 `acceptedTask.assignmentId` 与请求一致时，才写入 `DailyChallengeMatchContext` 的接取时间和指标基线。

Panorama `DailyChallengeSnapshotClient` 也保存该实例最近一次接受的快照，并使用相同排序规则做第二层保护；接受后才调用 `onSnapshot`。`dispose()` 会清空该实例的最新快照，避免页面重新挂载后沿用已销毁生命周期的状态。

## 5. 刷新计数

客户端使用后端快照：

```ts
paidRefreshLimit = paidRefreshesUsed + paidRefreshesRemaining;
```

显示“免费刷新可用/已用”和“付费刷新剩余 X/Y”。该计算不引用 `currentRound`，因此轮次变化不会重置额度。

## 6. 星级与奖励显示

`TaskStarBadge` 同时显示：

- `★`、`★★` 或 `★★★`；
- 本地化的 1/2/3 星文本；
- 按星级区分的颜色样式。

候选、已接取任务和完成记录都使用快照中的 `rewardSeasonPoint`，不硬编码 80/100/120。

## 7. 赛后积分本地化

三语必须同时提供：

- `daily_challenge_end_screen_detail`
- `daily_challenge_end_screen_total_points`
- `daily_challenge_end_screen_match_points`
- `daily_challenge_end_screen_challenge_points`
- `daily_challenge_end_screen_conduct_modifier`

个人任务正常结算达标后，后端 `/game/end` 返回 `dailyChallengeRewards`；VScripts 只接受 `source=personal`、SteamID、正整数积分、`dayId` 和 `assignmentId` 均有效的条目，并用 `dayId + steamId + assignmentId` 去重。奖励已经由后端事务入账，游戏端只把积分写入 `player_stats.dailyChallengePoints`，再由结算页与本局基础积分综合显示。

同一 `/game/end` 重试时，后端会回显同一奖励；Net Table 更新采用覆盖本局每日挑战积分，而不是在旧值上累加，因此不会让结算页重复加分。共同任务和连续奖励仍在后续开局通过奖励记录、入口提示和 `pointInfo` 展示。

`/game/end` 还可返回 `dailyChallenges`。VScripts 在处理完本局积分后，将每个有效结算后快照写入统一私有 store；写入成功时向对应玩家私发 `daily_challenge_action_result(action=snapshot, code=game_end_synced)`。如果返回快照已经被 store 判定为旧版本，则只发布当前缓存，不允许 UI 回退。即使本局没有个人奖励，只要存在 `dailyChallenges`，轮次推进和第三轮完成态也会在结算后立即同步。

## 8. 兼容与风险

- 如果后端 v2 未返回轮次字段，客户端会使用兼容默认值，但无法凭空恢复真实历史轮次；完整生产行为依赖后端契约。
- 如果 `completedTasks` 经 Lua/NetTable 变成数字键对象，客户端使用 `Object.values` 转为数组。
- 第三轮完成状态必须由后端保证，不应让客户端根据候选为空猜测。
- 每日挑战 `/game/end` 处理失败不会撤销基础游戏结算；此时结算页不会显示未确认的个人挑战积分，后续需要依靠后端幂等重试或奖励记录恢复。
- 修改 DTO 后，VScripts 生成 Lua 需要在负责 VScripts 的任务中重新构建；本 UI 任务不以旧生成 Lua 作为协议真相源。
