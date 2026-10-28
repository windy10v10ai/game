---
name: issue-autorun
description: 用户不在时，按优先级在主目录依次派 DSH 的 DeepSeek 把带 agent-todo 标签的 issue 从实现做到实机验证，调度员审查判定，各开草稿 PR。
disable-model-invocation: true
---

# issue-autorun

用户不在场时，把所有带 `agent-todo` 标签的 issue 做完。能做的都做完，做不了的跳过并记下来，最后统一留给用户。标签、执行说明与设计文档的约定见 `.claude/references/agent-autorun.md`，开始前先读。

一次只做一个 issue，全部在主目录里做：Dota 只加载主目录的 `game/`，实机验证本来就只能一次一个；用户不在场，不缺时间，顺序跑省掉 worktree、依赖链接和实机排队。

| 角色 | 做什么 |
|---|---|
| 调度员（主会话） | 排顺序、请用户选 issue、检查主目录、派活、审查、看截图判定、改标签、汇报 |
| DeepSeek（DSH headless） | 同一个会话里一口气做完：切分支、实现、验收、开草稿 PR、实机验证、把证据写进 PR。只做能机械判定的事，截图只交图不下结论 |
| 审查子代理（sonnet） | 只在第 4 步的条件下替调度员审某一条 |
| 用户 | 回来后测「用户判定」层的项（手感、动画） |

每批在一个新对话里跑（用户新开对话、模型选 Sonnet 后调用本 skill）：调度员每一步都要重读整段上下文，背着之前的讨论跑会成倍增加开销。调度员要做的判断都被执行说明和本 skill 的规则框住，拿不准的记为「待你决定」，不靠更强的模型硬判。

调用脚本、交接模板与已知陷阱见 `references/dsh-handoff.md`。`dsh.cmd` 不存在或调用报错修不好时，退回用 Agent 工具派 sonnet 子代理在主目录执行，交接用同一份模板。

## 硬规则

- **只在开工前问一次**：第 2 步请用户选 issue，之后用户不在场，根 `CLAUDE.md`「Skill 交互」的 `AskUserQuestion` 不适用。拿不准的按「卡住时怎么办」处理，然后继续
- **只做有执行说明的 issue**：没有 `## 执行说明` 的不派，按「卡住时怎么办」第三行处理
- **主目录只在干净时用**：开工前和每个 issue 之间检查 `git status --porcelain` 为空。不干净就停掉剩下的全部 issue，写进汇报，不动用户的文件
- **不合并、不推 `develop` / `main`**，只开草稿 PR
- **只改执行说明「改动范围」里的文件**
- **不改 issue 正文**，只留言、改标签
- **改 PR、返工都接着原会话**（`--session-id`），不为同一个 issue 另开会话
- 调度员不改代码、不跑 `npm test` 这类命令，不重跑 DeepSeek 已跑过的验收：以 CI 和日志里看得到的结果为准
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
- **检查不过**（jest 失败、实机 `[check] FAIL`、日志不对）：预期值由执行说明定死，DeepSeek 可以改自己的实现重跑，最多三轮，不许改预期值与断言
- **三轮仍不过、或预期本身说不通**：DeepSeek 停下回报试过什么、日志原文、推测原因，由调度员判定，四选一：
  1. 给出修正方向，退回原会话
  2. 执行说明本身有误：不改 issue，按更合理的理解退回并记为「请确认」
  3. 记为「待你决定」，其余部分照常提交
  4. 整条做不了，打 `agent-block`

任何一方都不许用降低标准换通过：改测试迁就代码、删失败用例、把没达成写成完成。

**卡死**：调用脚本在 30 分钟没有新事件或总时长超过 2 小时时停掉 DeepSeek（退出码 2 / 3）。调度员读日志最后几步判断卡在哪：能接着做的退回原会话继续一次，再卡就记为「待你决定」；主目录被留在半途（有未提交改动）时按「主目录只在干净时用」停掉后续 issue。

## 1. 排顺序

```bash
gh issue list -R windy10v10ai/game -l agent-todo --state open --limit 100 --json number,title,body
```

对每个 issue 查「开发计划」项目里的 Status 与 issue 字段 Priority（查询见 `issue-organize` 第 1 步），按下面的顺序排，前一项相同再比后一项：

1. Status：In progress → Todo → Plan → Backlog → 未入项目
2. Priority：Urgent → High → Medium → Low → 未填
3. 编号从小到大

完成条件：每个 `agent-todo` issue 都有序号；执行说明缺项或指向的设计文档不存在的，直接按「卡住时怎么办」第三行处理。

## 2. 出计划

先输出计划表：

| 序号 | issue（链接 + 标题） | 级别 | Status / Priority | 设计文档 | 实机验证（各层项数） |
|---|---|---|---|---|

再用一次 `AskUserQuestion`（`multiSelect: true`）请用户选这批跑哪些。`AskUserQuestion` 的框会挡住它前面的文字，判断要用的信息写进选项的 `description`（级别、Status / Priority、改动范围大小、有没有截图或用户判定项）：

- 不超过 4 条：每条 issue 一个选项，按序号排，默认推荐全部
- 超过 4 条：选项为「全部按顺序」（推荐）、「前 3 条」；要挑别的让用户在 Other 里写编号

用户选完就开始，之后不再提问。

完成条件：计划表已输出，用户已选定这批的 issue。

## 3. 派 DeepSeek 一口气做完

按序号逐个做，前一个判定完再开下一个：

1. 主目录 `git status --porcelain` 为空，`git switch develop && git pull --ff-only`
2. 按 `references/dsh-handoff.md`「交接模板」填好 issue 编号与分支名（`<fix|feature>/<issue-id>-<3–6 个英文小写单词>`，Bug 用 `fix/`），写进 scratchpad
3. 用 `scripts/dsh-run.py` 后台调用（Bash 工具 `run_in_background: true`），结束或卡死时会收到通知
4. 读脚本打印的摘要：会话 ID、用时、token、最终回复。没开 PR 的，按回报判断属于「卡住时怎么办」哪一行

DeepSeek 结束时主目录停在 PR 分支上、工作区干净。「截图判定」层的项由调度员自己打开截图判定，DeepSeek 写在 PR 里的描述不算结论；判定结果写回 PR「实机验证结果」并勾选 Checklist。画面不对时按「卡住时怎么办」四选一，退回时写清看到了什么（如「特效位置是红色 X，即资源没加载」）。

完成条件：该 issue 有 DeepSeek 的回报；每张截图都已由调度员判定。

## 4. 审一次

默认调度员自己审。下面任一条件成立时，这一条改派审查子代理（`model: "sonnet"`、`run_in_background: true`），避免 diff 和日志撑大调度员的上下文：

- `gh pr view <pr> -R windy10v10ai/game --json additions,deletions` 的增删合计超过 500 行
- 本批选了超过 5 条 issue

不由用户选：条件是机械的，调度员照判即可。派子代理时交接只给证据，不让它从头调研：PR 编号、执行说明来源（issue 编号或设计文档路径）、DeepSeek 日志路径（`<log>.jsonl`）。

不论谁审，都按下面的范围：

- 改动用 `gh pr diff <pr> -R windy10v10ai/game`，CI 用 `gh pr checks <pr> -R windy10v10ai/game`
- 审查范围：
  - **测试视角**：每条目标都有 jest 用例或实机验证项对应，边界和易错处有覆盖；缺什么具体列出
  - **证据与结论一致**：PR 里每条「通过」「已完成」都有出处：CI 结果、日志里的命令与 exit code、实机日志原文与数字。后台命令的输出在日志里可能只剩开头，测试通过以 CI 为准；推送以远端 SHA 为准
  - **范围与降标**：只改了改动范围；没有改测试迁就代码、删用例；检查脚本与 jest 里的预期值和执行说明一致
  - **做法**：与执行说明的「做法」一致；只在可疑时才读原版文件或规则
- 结论：PASS / NEEDS-FIX / NEEDS-DECISION，逐条发现带 `file:line` 与严重度；子代理回报限 400 字以内

测量类 issue（不开 PR）审的是留言与报告：每个数字在日志里有出处，局数和步骤与执行说明一致，结论没有超出数据。

完成条件：该 PR（或测量结果）有审查结论。

## 5. 判定

调度员逐条判定审查发现与实机结果，读日志原文与数字，不只看结论：

- 通过的勾掉 PR Checklist 对应项
- 要改的按「卡住时怎么办」四选一；退回原会话时交接只写要改的几条，同一 PR 最多退回两轮，仍不过记为「待你决定」
- 收尾前主目录切回 `develop`，确认工作区干净

完成条件：每条发现都已改完或记进「等你处理」，主目录回到 `develop`。

## 6. 收尾

全部 issue 做完后，每个 issue 按结果改标签并留言：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-todo --add-label agent-done
gh issue comment <id> -R windy10v10ai/game --body "已开草稿 PR：<链接>。等你处理 N 项，见 PR 正文。"
```

整条做不了的改打 `agent-block`，留言写明卡在哪、缺什么。

按 `references/dsh-handoff.md`「会话归档与分组」把本轮的 DSH 会话归进 `claude-dispatch` 工作区，调用失败或作废的归档。

完成条件：每个领过的 issue 都是 `agent-done` 或 `agent-block`，主目录在 `develop` 且干净。

## 7. 汇报

按计划表的顺序逐个列出：PR 链接、「等你处理」条数、审查结论、实机验证结果、CI 状态、`agent-block` 的原因；会话没归组成功的列出 ID。

末尾附记账表，用来判断哪类 issue 值得外包、skill 该往哪改：

| issue | 类型（KV / 本地化 / 逻辑 / UI…） | DeepSeek 用时 / token | 审查方式（调度员 / 子代理）与 token | 退回轮数 | 退回原因 |
|---|---|---|---|---|---|issue 和 PR 编号都写成链接。用户回来按这份汇报用 `issue-spec` 逐个收拾。
