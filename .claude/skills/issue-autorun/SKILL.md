---
name: issue-autorun
description: 用户不在时，按优先级调度子代理在 worktree 里并行做带 agent-todo 标签的 issue，实机验证排队进行，各开草稿 PR。
disable-model-invocation: true
---

# issue-autorun

用户不在场时，把所有带 `agent-todo` 标签的 issue 做完。主会话只当**调度员**：排顺序、派子代理、排实机验证的队、改标签、汇报；改代码和跑测试全部在子代理里做。能做的都做完，做不了的跳过并记下来，最后统一留给用户。标签、执行说明与设计文档的约定见 `.claude/references/agent-autorun.md`，开始前先读。

## 硬规则

- **不提问、不停下**：用户不在场，根 `CLAUDE.md`「Skill 交互」的 `AskUserQuestion` 不适用。拿不准的按「卡住时怎么办」处理，然后继续
- **不合并、不推 `develop` / `main`**，只开草稿 PR
- **只改执行说明「改动范围」里的文件**
- **不改 issue 正文**，只留言、改标签
- 主会话不改代码、不跑 `npm test` 这类命令；它在主目录只做实机验证要的分支切换
- 执行说明以外的需求（issue 评论里的新想法、相关 bug）不做，记进「等你处理」的「发现」

## 卡住时怎么办

子代理和调度员都按这张表处理，并把每一处记进该 issue 的「等你处理」清单：

| 情况 | 做法 | 记成 |
|---|---|---|
| 有合理的默认做法（项目规则、相邻代码的惯例、原版行为） | 按默认做 | **请确认**：按什么默认做了、改成别的要动哪里 |
| 没有默认，但这一处不影响其他部分 | 跳过这一处，继续做其余部分；代码里不留半成品 | **待你决定**：缺什么信息、有哪几种选法 |
| 影响整条 issue，什么都做不了 | 放弃这条 issue，做下一条 | 写进 issue 留言，打 `agent-block` |

验收命令失败时修复后重跑，同一失败修三轮仍不过：撤回导致失败的那部分改动，记为「待你决定」，其余部分照常提交。

## 1. 排顺序

```bash
gh issue list -R windy10v10ai/game -l agent-todo --state open --limit 100 --json number,title,body
```

对每个 issue 查「开发计划」项目里的 Status 与 issue 字段 Priority（查询见 `issue-organize` 第 1 步），按下面的顺序排，前一项相同再比后一项：

1. Status：In progress → Todo → Plan → Backlog → 未入项目
2. Priority：Urgent → High → Medium → Low → 未填
3. 编号从小到大

再定并行：同时最多 3 个子代理；「改动范围」有重叠的 issue 不同时做，排在前面的先做。

完成条件：每个 `agent-todo` issue 都有序号和所属批次；执行说明缺项或指向的设计文档不存在的，直接按「卡住时怎么办」第三行处理。

## 2. 出计划

开工前先输出计划表，然后**不等回复直接开始**（用户在场时可以随时打断）：

| 序号 | issue（链接 + 标题） | Status / Priority | 批次 | 设计文档 | 实机验证 |
|---|---|---|---|---|---|

完成条件：计划表已输出。

## 3. 派子代理

按批次用 Agent 工具派子代理：`isolation: "worktree"`、`model: "sonnet"`、`run_in_background: true`。一个子代理只做一个 issue；一个结束就从队列里补下一个，保持最多 3 个在跑。

子代理冷启动，交接里写全：

- issue 编号与执行说明全文；有设计文档时给主目录下的**绝对路径**（worktree 里没有 gitignore 的文件）
- 先按 `.claude/references/git-workflow.md`「worktree 与 node_modules」借主目录依赖，不跑 `npm install`
- 分支名 `<fix|feature>/<issue-id>-<3–6 个英文小写单词>`（Bug 用 `fix/`），从最新 `develop` 切出
- 「卡住时怎么办」整张表与上面的硬规则
- 按执行说明实现，跑完「验收」命令，用 `git diff --name-only develop...HEAD` 检查范围
- commit、push，按 `create-pr` 的格式开**草稿 PR**，差别：
  - Issue 段：「目标」全部完成写 `Fixes #<id>`，有跳过的写 `#<id>`
  - Release Note：执行说明写「不写」时删掉占位段；写「要写」时保留占位段，Checklist 加 `- [ ] Release Note 待生成（要点：…）`
  - Checklist 加执行说明「实机验证」里的每一项
  - 正文加「等你处理」一节，分「请确认」「待你决定」「发现」三组，每条一个 checkbox，写清在哪个文件、哪一步；三组都空时写「无」
- 不碰 Dota，不跑实机验证
- 回报：PR 链接、分支名、「等你处理」条数、需要实机验证的内容；全部跳过、一处改动都没留下时回报原因，不开 PR

完成条件：每个 issue 都有子代理回报。

## 4. 实机验证（同一时间只验一个）

Dota 只加载主目录的 `game/`，所以实机验证在主目录排队，一次一个。子代理回报需要实机验证时放进队列，轮到时：

1. 确认主目录工作区干净（`git status --porcelain` 为空），不干净就跳过全部实机验证，记进汇报
2. `git fetch` 后在主目录 `git checkout --detach origin/<分支>`（分支被 worktree 占着，不能直接 checkout）
3. 按 `dota-live-test` skill 派**一个**实机验证子代理（`model: "haiku"`），交接写清要验什么、期待哪几行日志
4. 调度员读回报判断通过与否：通过就勾掉 PR Checklist 对应项；不通过就派一个 sonnet 子代理到该分支修一轮再回到队尾，第二次仍不通过记为「待你决定」
5. 队列清空后主目录切回 `develop`

完成条件：队列里每一项都已通过或记进「等你处理」，主目录回到 `develop`。

## 5. 收尾

每个 issue 按子代理结果改标签并留言：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-todo --add-label agent-done
gh issue comment <id> -R windy10v10ai/game --body "已开草稿 PR：<链接>。等你处理 N 项，见 PR 正文。"
```

整条做不了的改打 `agent-block`，留言写明卡在哪、缺什么。

按 `git-workflow.md`「worktree 与 node_modules」先拆掉依赖链接，再删除本轮的 worktree（分支已推到远端，PR 不受影响）。

完成条件：每个领过的 issue 都是 `agent-done` 或 `agent-block`，本轮 worktree 已清理。

## 6. 汇报

按计划表的顺序逐个列出：PR 链接、「等你处理」条数、实机验证结果、`agent-block` 的原因。issue 和 PR 编号都写成链接。用户回来按这份汇报用 `issue-spec` 逐个收拾。
