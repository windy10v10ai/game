# 每日挑战文档索引

本目录只保留每日挑战最终规格、游戏端实施、UI/同步和验收资料，不记录 AI 讨论过程或临时设计决策。

| 文档                                         | 用途                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| [最终系统规格](final-specification.md)       | 玩家规则、三轮任务、随机星级、奖励、刷新、共同任务和连续完成 |
| [游戏端实施与接口](game-implementation.md)   | 协议 v2、DTO、Panorama 状态、事件和兼容规则                  |
| [UI 与进度同步](ui-and-progress-sync.md)     | PC 页面布局、各状态展示、红点、刷新和赛后积分展示            |
| [游戏内测试与验收](gameplay-verification.md) | 静态验证命令和后续 Dota Tools 验收清单                       |

## 当前真相源

- DTO：`src/common/dto/daily-challenge.d.ts`
- 游戏端采集与比赛上下文：`src/vscripts/modules/daily-challenge/`
- 快照接入：`src/vscripts/api/daily-challenge-snapshot.ts`
- Panorama 状态：`src/panorama/react/hud_main/store/DailyChallengeContext.tsx`
- 每日挑战页面：`src/panorama/react/hud_main/pages/daily-challenge/`
- 三语文本：`game/resource/addon_schinese.txt`、`addon_english.txt`、`addon_russian.txt`

当前协议版本为 `2`。后端必须按协议冻结任务的星级、目标和赛季积分奖励；客户端只负责兼容、展示和发送玩家操作，不自行重抽任务或计算奖励。

## 验证边界

本文档对应静态代码和构建验收。除非另有明确记录，不代表 Dota Tools 中的视觉、交互、网络往返或真实结算已经验证。
