---
name: issue-triage
description: 整理 issue：查重复与过期、调整优先级、核对「开发计划」项目里的位置。
---

# issue-triage

整理 `windy10v10ai/game` 与 `windy10v10ai/firebase` 两个仓库的未关闭 issue，并核对组织项目「开发计划」（`gh project` 编号 3）的排布。先出建议、等用户拍板，再改 GitHub。

## 0. 前提与字段配置

字段含义、Status 取值、ID、查询与修改命令都在 `.claude/references/issue-fields.md`，开始前先读，`gh` 缺 `project` 权限的处理也在那里。

## 1. 拉数据

输出写进 scratchpad，不进仓库。用 `issue-fields.md`「查询」里的批量查询（每个仓库一次）和项目条目列表，重取 ID 的命令也在那里。

完成条件：每个未关闭 issue 和每个项目条目都有类型、Priority、Effort、Status（或「未入项目」）、创建与更新日期。

## 2. 判断

逐条过，正文里提到的前置 issue 用 `gh issue view` 查状态。

- **重复**：从另一条拆出、剩余内容已被别的 issue 覆盖；或同一英雄 / 物品的同类改动。建议关闭并入，或挂成子 issue
- **前置已完成**：正文写着「等 #xxx」而 #xxx 已关闭的，标出来需要复测或解除等待
- **过期**：在 Plan 栏长期没动的退回 Backlog；一年以上没动、也没人提的，列为「建议关闭」，由用户决定留不留
- **做法与现行规则冲突**（如用 Lua modifier 实现属性）：建议改写正文，不直接关闭
- **卡顿相关**：挂成 game#2468（后期卡顿排查与优化）的子 issue
- **测量与实现混在一条**：同时有「先测量」和「再定做法 / 实现」的，建议拆开，原 issue 当主 issue，测量拆成 Task 子 issue；分工与 Type、Status 约定见 `.claude/references/agent-issue.md`「主 issue 与子 issue 分工」
- **Type 与父子 Status 不一致**：按上述分工检查，填错的列进「补类型」，父子 Status 对不上的标出来
- **优先级**：没填 Priority 的都给出建议值，Effort 能估就填
- **项目位置**：
  - Todo 只留最优先的几条，其余挪到 Plan
  - 正在做的放 In progress
  - 需要更多日志才能推进的放 Backlog
  - 没入项目的补进去；总跟踪帖（如 firebase#1404 玩家反馈跟踪）不放
  - 草稿条目转成正式 issue，补类型、标签、优先级
- **可交给 agent**：Todo / Plan 里符合 `.claude/references/agent-issue.md`「适合交给 agent 的 issue」的，列为候选；已带 `agent-done` 的查 PR 里「等你处理」还剩几项，`agent-block` 的列出 agent 留言里缺的信息

完成条件：每个 issue 要么归入某条建议，要么确认维持现状。

## 3. 报告并等拍板

按「合并重复 / 关闭或降级 / 补优先级 / 项目位置 / 交给 agent」分组。每次出现 issue 编号都写成链接加简短标题，如 `[game#2468 后期卡顿](https://github.com/windy10v10ai/game/issues/2468)`，不写裸编号。

用户逐条改完、明确同意后再执行，没提到的条目不动。执行中途用户追加的要求，并入当前这一轮。

## 4. 执行

设 Priority / Effort / Type、改 Status、补进项目、草稿转正式 issue 的命令见 `issue-fields.md`「修改」。

```bash
# 关闭重复，留言写明剩余内容由谁跟踪
gh issue close <n> -R windy10v10ai/<repo> --duplicate-of <目标n> --comment "..."

# 挂子 issue（测量不够就在主 issue 下再建一条 Task，不在原测量 issue 里续写）
gh issue edit <父n> -R windy10v10ai/<repo> --add-sub-issue <子n>,<子n>
```

完成条件：每条拍板的改动都执行成功，失败的单独列出。

用户要把交给 agent 的候选定下来时，按 `issue-spec` skill 逐个定 spec。

## 5. 核对并汇报

```bash
gh project item-list 3 --owner windy10v10ai --limit 200 --format json -q '.items[]|"\(.status)\t\(.content.repository//"draft"|split("/")|last)#\(.content.number)\t\(.title)"' | sort
```

按 Status 分栏列出改动后的位置，带链接。结果和拍板不一致的要明确指出。
