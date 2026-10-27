---
name: issue-autorun
description: 用户不在时，按优先级派 DSH 的 DeepSeek 在 worktree 里实现带 agent-todo 标签的 issue 并做实机验证，Sonnet 审证据、调度员判定，各开草稿 PR。
disable-model-invocation: true
---

# issue-autorun

用户不在场时，把所有带 `agent-todo` 标签的 issue 做完。能做的都做完，做不了的跳过并记下来，最后统一留给用户。标签、执行说明与设计文档的约定见 `.claude/references/agent-autorun.md`，开始前先读。

分工：

| 角色 | 做什么 |
|---|---|
| 调度员（主会话） | 排顺序、建 worktree、派活、排实机验证的队、判定、改标签、汇报 |
| DeepSeek（DSH headless） | 读执行说明与项目规则、实现、跑验收、列测试视角、开草稿 PR；实机验证 |
| Sonnet 子代理 | 审 DeepSeek 交回的证据包 |
| haiku 子代理 | 只做要截图、点界面的实机验证项 |

调用方式、交接模板与已知陷阱见 `references/dsh-handoff.md`。`dsh.cmd` 不存在或调用报错修不好时，退回用 Agent 工具派 sonnet 子代理（`isolation: "worktree"`）执行，交接用同一份模板。

## 硬规则

- **不提问、不停下**：用户不在场，根 `CLAUDE.md`「Skill 交互」的 `AskUserQuestion` 不适用。拿不准的按「卡住时怎么办」处理，然后继续
- **只做有执行说明的 issue**：没有 `## 执行说明` 的不派，按「卡住时怎么办」第三行处理
- **不合并、不推 `develop` / `main`**，只开草稿 PR
- **只改执行说明「改动范围」里的文件**
- **不改 issue 正文**，只留言、改标签
- 调度员不改代码、不跑 `npm test` 这类命令，不重跑 DeepSeek 已跑过的验收：以它的运行日志和 CI 为准
- 执行说明以外的需求（issue 评论里的新想法、相关 bug）不做，记进「等你处理」的「发现」

## 卡住时怎么办

DeepSeek 与调度员都按这张表处理，并把每一处记进该 issue 的「等你处理」清单：

| 情况 | 做法 | 记成 |
|---|---|---|
| 有合理的默认做法（项目规则、相邻代码的惯例、原版行为） | 按默认做 | **请确认**：按什么默认做了、改成别的要动哪里 |
| 没有默认，但这一处不影响其他部分 | 跳过这一处，继续做其余部分；代码里不留半成品 | **待你决定**：缺什么信息、有哪几种选法 |
| 影响整条 issue，什么都做不了 | 放弃这条 issue，做下一条 | 写进 issue 留言，打 `agent-block` |

失败分两类，处理人不同：

- **机械性失败**（lint、编译、格式、拼写）：DeepSeek 自己修，同一失败三轮仍不过就撤回那部分改动，记为「待你决定」
- **测试逻辑失败、结果和预期不符、达不到预期状态**：DeepSeek 停下回报试过什么、日志原文、推测原因，由调度员判定，四选一：
  1. 给出修正方向，用 `--session-id` 退回 DeepSeek
  2. 执行说明本身有误：不改 issue，按更合理的理解退回并记为「请确认」
  3. 记为「待你决定」，其余部分照常提交
  4. 整条做不了，打 `agent-block`

任何一方都不许用降低标准换通过：改测试迁就代码、删失败用例、把没达成写成完成。

## 1. 排顺序

```bash
gh issue list -R windy10v10ai/game -l agent-todo --state open --limit 100 --json number,title,body
```

对每个 issue 查「开发计划」项目里的 Status 与 issue 字段 Priority（查询见 `issue-organize` 第 1 步），按下面的顺序排，前一项相同再比后一项：

1. Status：In progress → Todo → Plan → Backlog → 未入项目
2. Priority：Urgent → High → Medium → Low → 未填
3. 编号从小到大

再定并行：同时最多 3 个 DeepSeek 在跑；「改动范围」有重叠的 issue 不同时做，排在前面的先做。

完成条件：每个 `agent-todo` issue 都有序号和所属批次；执行说明缺项或指向的设计文档不存在的，直接按「卡住时怎么办」第三行处理。

## 2. 出计划

开工前先输出计划表，然后**不等回复直接开始**（用户在场时可以随时打断）：

| 序号 | issue（链接 + 标题） | Status / Priority | 批次 | 设计文档 | 实机验证 |
|---|---|---|---|---|---|

完成条件：计划表已输出。

## 3. 派 DeepSeek 实现

按批次，每个 issue：

1. 按 `references/dsh-handoff.md`「建 worktree」建好 worktree、借依赖。分支名 `<fix|feature>/<issue-id>-<3–6 个英文小写单词>`（Bug 用 `fix/`），从最新 `origin/develop` 切出
2. 按「实现阶段交接模板」填好 issue 编号、分支、主目录路径，写进 scratchpad，后台调用 DSH。交接不抄规则与执行说明，让 DeepSeek 自己读
3. 一个结束就从队列里补下一个，保持最多 3 个在跑

DeepSeek 结束后，调度员从 `--json` 日志提取：最终回复、每条验收命令的 exit code、会话 ID、token 用量。全部跳过、没开 PR 的，读回报判断属于「卡住时怎么办」哪一行。

完成条件：每个 issue 都有 DeepSeek 的回报。

## 4. 审证据包

每个 PR 派一个 Sonnet 子代理（`model: "sonnet"`、`run_in_background: true`）。交接只给证据包，不让它从头调研：

- PR 编号、执行说明来源（issue 编号或设计文档路径）
- DeepSeek 的 `--json` 日志路径与最终回复
- 审查范围：
  - **测试视角**：每条目标都有 jest 用例或实机验证项对应，边界和易错处有覆盖；缺什么具体列出
  - **证据与结论一致**：PR 正文里每条「通过」「已完成」在日志里有对应命令和 exit code；`git diff --stat origin/develop...HEAD` 与「改动」一节一致；推送以远端 SHA 为准
  - **范围与降标**：只改了改动范围；没有改测试迁就代码、删用例
  - **做法**：与执行说明的「做法」一致；对照同类已有实现，只在可疑时才读原版文件或规则
- 回报：结论 PASS / NEEDS-FIX / NEEDS-DECISION，逐条发现带 `file:line` 与严重度，500 字以内

调度员按「卡住时怎么办」的四选一判定每条发现。退回 DeepSeek 用原会话 ID，交接只写要改的几条；同一 PR 最多退回两轮，仍不过记为「待你决定」。

完成条件：每个 PR 都有审查结论，NEEDS-FIX 已退回改完或记进「等你处理」。

## 5. 实机验证（同一时间只验一个）

Dota 只加载主目录的 `game/`，所以实机验证在主目录排队，一次一个。PR Checklist 里有实机验证项的放进队列，轮到时：

1. 确认主目录工作区干净（`git status --porcelain` 为空），不干净就跳过全部实机验证，记进汇报
2. `git fetch` 后在主目录 `git checkout --detach origin/<分支>`（分支被 worktree 占着，不能直接 checkout）
3. 按「实机验证阶段交接模板」派 DeepSeek，工作目录设为主目录
4. DeepSeek 标「需要截图」的项，按 `dota-live-test` 派一个 haiku 子代理补验
5. 调度员读回报里的命令、日志原文与数字判定，不只看结论：通过就勾掉 PR Checklist 对应项；不通过或无法判断的按「卡住时怎么办」四选一，修过的分支回到队尾，第二次仍不通过记为「待你决定」
6. 队列清空后主目录切回原来的分支

完成条件：队列里每一项都已通过或记进「等你处理」，主目录回到开始时的分支。

## 6. 收尾

读一次每个 PR 的 CI：`gh pr checks <pr> -R windy10v10ai/game`。失败的按「卡住时怎么办」处理；还在跑的不等，写进汇报。

每个 issue 按结果改标签并留言：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-todo --add-label agent-done
gh issue comment <id> -R windy10v10ai/game --body "已开草稿 PR：<链接>。等你处理 N 项，见 PR 正文。"
```

整条做不了的改打 `agent-block`，留言写明卡在哪、缺什么。

按 `git-workflow.md`「worktree 与 node_modules」先拆掉依赖链接，再删除本轮的 worktree（分支已推到远端，PR 不受影响）。

完成条件：每个领过的 issue 都是 `agent-done` 或 `agent-block`，本轮 worktree 已清理。

## 7. 汇报

按计划表的顺序逐个列出：PR 链接、「等你处理」条数、审查结论、实机验证结果、CI 状态、`agent-block` 的原因，以及 DeepSeek 与 Sonnet 各自的用时和 token 用量。issue 和 PR 编号都写成链接。用户回来按这份汇报用 `issue-spec` 逐个收拾。
