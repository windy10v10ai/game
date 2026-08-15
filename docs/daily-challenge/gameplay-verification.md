# 每日挑战测试与验收

## 1. 本任务静态门禁

在 game 仓库根目录运行：

```powershell
npm test -- --runInBand `
  src/panorama/react/hud_main/pages/daily-challenge/daily-challenge-ui.test.ts `
  src/panorama/react/hud_main/pages/daily-challenge/daily-challenge-pc-layout.test.js `
  src/panorama/react/hud_main/pages/daily-challenge/daily-challenge-localization.test.js `
  src/panorama/react/hud_main/store/daily-challenge-snapshot-client.test.ts
npm run build:panorama
git diff --check
```

定向测试至少覆盖：

- 协议 v2 与滚动部署兼容；
- 1/2/3 星标签；
- 轮次文案和三轮完成态；
- `completedTasks` 数字键对象转换；
- 刷新次数不按轮次重置；
- 六条规则；
- 三语 `daily_challenge_*` key 集一致；
- 赛后积分五个本地化 key。

## 2. 快照用例

### 第一轮待选

```text
completedRoundCount = 0
currentRound = 1
totalRounds = 3
acceptedTask = nil
candidates = 3 条
needsSelection = true
```

确认三个候选可同星，卡片奖励使用各自 `rewardSeasonPoint`。

### 第二轮进行中

```text
completedRoundCount = 1
currentRound = 2
acceptedTask = 当前任务
needsSelection = false
```

确认继续显示星级、进度条、同步按钮和全天剩余刷新次数。

### 三轮完成

```text
completedRoundCount = 3
currentRound = 3
totalRounds = 3
completedTasks = 3 条
acceptedTask = nil
candidates = []
needsSelection = false
```

确认显示完成面板、三轮记录和奖励总计，不显示刷新或“暂无任务”。

## 3. 后续 Dota Tools 验收

逐项标记“已实测 / 仅静态确认 / 未验证 / N/A”：

1. 正确 addon、共享本地玩家和本地 API 拓扑；
2. 三个候选同星时布局不重叠，星星字符和三语字体正常；
3. 免费刷新一次、付费刷新最多五次，跨三轮不重置且扣费幂等；
4. 第一轮和第二轮完成后，新快照自动展示下一轮；
5. 第三轮完成面板、三条记录和奖励总计正确；
6. 正常结算达标后个人赛季积分即时到账，赛后积分明细不溢出；
7. 逃跑或异常结算会撤销当前局暂存贡献；
8. 共同任务次日发奖并显示奖励记录；
9. 三轮全部完成才增加连续天数，中断后重置，最高里程碑后循环；
10. 简中、英语、俄语无 `#key`、问号乱码、截断或文本溢出。

## 4. 指标与英雄任务验收

眩晕、减速、缠绕、沉默、嘲讽、破坏、负面效果、伤害类型、治疗、承伤、击杀、肉山和推塔需要分别用确定技能验证。召唤物、受控单位和额外技能必须归属真实玩家。

纯粹伤害英雄任务必须同时核对本项目实际加载的 KV/脚本和游戏内伤害类型；不能只凭原版英雄资料通过。

## 5. 当前边界

本次文档和 UI 收尾不启动服务或 Dota Tools。静态测试与 Panorama 构建通过也不能替代游戏内结算、网络和视觉验收。
