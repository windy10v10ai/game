# src/vscripts/ai/ Bot AI

## 结构

| 目录                                                   | 内容                                                                                                               | 怎么改                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `hero/`                                                | 英雄 AI modifier，都扩展 `BotBaseAIModifier` 并实现 `OnIntervalThink()`（间隔见 `bot-base.ts` 的 `ThinkInterval`） | 朝地点的位移（赶路、撤退、跳刀切入）登记在 `mobility.ts` 的位移表；朝单位施放的位移技能走技能/物品 spec |
| `mode/`                                                | 模式，`GetDesire()` 返回 0–1                                                                                       |                                                                                                         |
| `action/`                                              | 可复用的行为（attack、move、cast）                                                                                 |                                                                                                         |
| `ability/` `item/`                                     | 技能与战斗物品的施法 spec                                                                                          | `bot-ability-usage` / `bot-item-usage` skill                                                            |
| `build-item/`                                          | 出装                                                                                                               | 设计与决策见 `build-item/README.md`，扩充候选池用 `/bot-item-build`                                     |
| `team/` 与 `hero/bot-base.ts` 的交战、回防、推进、站位 | 接管后的团队 AI                                                                                                    | `bot-ai-tuning` skill；设计与决策见 `team/README.md`                                                    |

## 常见陷阱

- **下达攻击命令前先查 `IsAttacking()`**：高频重复下达 `ATTACK_MOVE` / `ATTACK_TARGET` 会不断重置攻击前摇，bot 反复抬手却打不出伤害。发命令前 `if (hero.IsAttacking()) return;`，放在结束/中断条件之后、发命令之前，否则被小兵缠住时连中断条件都不再检查（参考 `action/action-attack.ts` 的 `MoveToAttack`）
- **每次思考里不调寻路**：`GridNav.FindPathLength` / `CanFindPath` 开销大且与小兵共用寻路，10 个 bot 每次思考都调会让全场单位思考超时。短距离能否一步走到用 `GridNav.IsTraversable` + `IsBlocked` + 地面高度差判断；随思考重复的昂贵估算（寻路、逐人算 DPS）按单位缓存约 1 秒
