---
name: bot-ai-tuning
description: 改进接管后电脑的决策与移动（交战、回防、推进、站位、传送、躲塔、塔防）。触发：用户描述电脑在对局里的异常行为（「电脑为什么……」「卡在……」「来回横跳」「不回防」「挤在一起」「走走停停」），或要主动找电脑 AI 的问题。技能施法规则走 bot-ability-usage，物品施放走 bot-item-usage，出装走 bot-item-build。
---

# Bot AI Tuning

每一轮都是**先对日志，再改**：结论必须能用日志行复现，不凭描述猜原因。长期决定与它们的理由在 [src/vscripts/ai/team/README.md](../../../src/vscripts/ai/team/README.md)，是本流程的单一真相源。

## 1. 对日志定位现象

日志在 `C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/console.log`，只在开发模式或自动测试局输出：

| 前缀 | 内容 |
|---|---|
| `[bot-ai] t=M:SS <英雄>` | 判断变化时一行：立场、任务、目标、离目标与集结点的距离；交战中附带 `our=` / `enemy=` 战力与参与者 |
| `[bot-ai] team=N t=<秒> defend=` | 团队看到的建筑威胁：`建筑编号:阶段:战力`，阶段为 engaged / warning / creeps |
| `[bot-pos] t=<秒>` | 每 5 秒一行：位置、任务、离任务点距离、立场、传送卷轴、是否引导与攻击 |
| `[bot-cast]` | 每次施法与物品使用 |
| `thinking for N ms` | 引擎报的单位思考超时，用来发现性能退化 |

先跑 `npm run bot-anomaly` 看异常汇总，再按用户说的游戏时间 grep 当时相关英雄的几十行。

完成条件：能用日志行说清出事的每个电脑当时的任务、立场与判断依据，并和用户描述的现象一一对上。

## 2. 定到层

| 层 | 文件 | 管什么 |
|---|---|---|
| 团队分派 | `ai/team/team-plan.ts` | 谁去回防、打架、推进、发育，以及先后顺序 |
| 局面感知 | `ai/team/team-brain.ts` | 威胁、交战点、战力、站位分配、塔防、买活 |
| 英雄执行 | `ai/hero/bot-base.ts` | 立场、移动命令、躲塔、传送、让位 |
| 立场判断 | `ai/hero/engagement.ts` | 打、等、撤的门槛 |
| 几何与估算 | `ai/team/formation.ts`、`ai/hero/tower-retreat.ts`、`ai/team/glyph.ts` | 队形、撤出塔区、扛塔、塔防时机 |

常见根因先对照这几类：

- **阈值附近来回切**：开始和继续用同一个门槛，或只看此刻的人。用迟滞：开始严、继续松，上一轮已在做的事继续算数
- **任务被抢**：不急的任务排在急的前面分派，把人抽走
- **攻击移动被吸住**：远距离赶路用了攻击移动，被身边的塔、小兵、野怪截住
- **单点目的地**：多人去同一个点叠成一团，或点落在走不到的地形上

完成条件：指出原因落在哪个文件的哪条判断，并解释它为什么产生这个现象。

## 3. 讲清再动手

按「原来是什么 → 改成什么 → 为什么」给用户讲原因和改法。改动推翻或新增 README 里的长期决定时，等用户确认；明确的 bug 直接改。

完成条件：用户已确认，或改动不涉及长期决定。

## 4. 改

- 判断与计算逻辑放在 `team-plan.ts`、`engagement.ts`、`tower-retreat.ts`、`formation.ts`、`glyph.ts` 这类不碰引擎的模块里，先写失败的测试再改；只是调引擎 API 的胶水不写测试（见 `src/vscripts/CLAUDE.md`「测试」）
- 每次思考都会跑的代码守住性能，见 `src/vscripts/CLAUDE.md`「Bot 每次思考里不调寻路」
- 新增日志只在开发模式输出，用 `IS_DEBUG_RUN` 包住

完成条件：`npx jest src/vscripts/ai` 全部通过，`npm run build:vscripts` 没有错误和警告。

## 5. 同步文档与 PR

长期决定变了，同一次改动里更新 README 对应条目；PR 描述的「改动」补一条，「Checklist」补一条待实机确认项。

完成条件：README、PR 描述与代码口径一致。

## 6. 验证

告诉用户重开一局或重新加载脚本后看什么现象。需要自己验证时按 [dota-live-test](../dota-live-test/SKILL.md) 的「验 bot AI 行为」跑自动对局，对比改动前后的异常报告与思考超时数量。
