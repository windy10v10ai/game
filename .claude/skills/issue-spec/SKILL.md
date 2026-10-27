---
name: issue-spec
description: 和用户一起给某个 issue 定 spec，写成执行说明交给 agent 自动做；或处理 agent 做完、卡住后留下的问题。
---

# issue-spec

用户在场时，和用户把一个 issue 的做法谈定，写成 issue 正文里的 `## 执行说明` 并打 `agent-todo`，留给 `issue-autorun` 在用户不在时自动做。只定到 spec 为止，不写实现计划、不改代码。标签与执行说明格式见 `.claude/references/agent-autorun.md`，开始前先读。

## 1. 读懂 issue

读 issue 正文、评论、关联的 issue / PR，再读相关代码，读到能说清「现在是什么样、要改成什么样」为止。

判断是否适合交给 agent（标准见 `agent-autorun.md`「适合交给 agent 的 issue」）。不适合时告诉用户原因，建议改由用户在场时做，结束。

完成条件：能用一两句话复述目标，并已判断适合交给 agent。

## 2. 和用户谈定

一次只问一个问题，用 `AskUserQuestion` 给 2–3 个选法并标出推荐。按执行说明的每一项过一遍，重点谈清：

- 做法的选型（复用原版 / KV / 新写代码）
- 改动范围：列得出具体文件或目录
- 不做什么：相关但这次不做的改动
- 要补哪些 jest 用例
- 目标能否拆成几条互不依赖的小项，让 agent 卡在一条时能跳过它继续做别的

能从代码或项目规则直接得出的不问，直接写进草稿。

完成条件：执行说明的每一项都有答案，不留「待定」。

## 3. 写入 issue

按 `agent-autorun.md` 的格式写出执行说明，整段贴给用户确认。用户确认后写进 issue 正文末尾（已有 `## 执行说明` 时整段替换），再打标签：

```bash
gh issue edit <n> -R windy10v10ai/game --body-file <文件>
gh issue edit <n> -R windy10v10ai/game --add-label agent-todo
```

完成条件：issue 正文末尾是用户确认过的执行说明，带 `agent-todo` 标签。

## 处理 agent 留下的问题

用户要收拾 `issue-autorun` 的结果时：

- **`agent-done`**：读草稿 PR 正文的「等你处理」，逐条和用户过。「请确认」的确认或改掉；「待你决定」的谈定后直接在该 PR 分支上补改，或写进执行说明另起一轮
- **`agent-block`**：读 issue 下 agent 的留言，按第 2 步补齐缺的信息，更新执行说明后把标签换回 `agent-todo`

```bash
gh issue edit <n> -R windy10v10ai/game --remove-label agent-block --add-label agent-todo
```

完成条件：「等你处理」的每一条都已勾掉或转成新的执行说明。
