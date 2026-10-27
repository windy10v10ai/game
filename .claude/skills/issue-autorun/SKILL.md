---
name: issue-autorun
description: 用户不在时，把带 agent-todo 标签的 issue 按执行说明自动做完并开草稿 PR。
disable-model-invocation: true
---

# issue-autorun

用户不在场时，依次处理所有带 `agent-todo` 标签的 issue，能做的都做完，做不了的跳过并记下来，最后统一留给用户处理。标签与执行说明格式见 `.claude/references/agent-autorun.md`，开始前先读。

## 硬规则

- **不提问、不停下**：用户不在场，根 `CLAUDE.md`「Skill 交互」的 `AskUserQuestion` 不适用。遇到拿不准的地方按下面「卡住时怎么办」处理，然后继续
- **不合并、不推 `develop` / `main`**，只开草稿 PR
- **只改执行说明「改动范围」里的文件**
- **不改 issue 正文**，只留言、改标签
- 执行说明以外的需求（issue 评论里的新想法、相关 bug）不做，记进「等你处理」的「发现」

## 卡住时怎么办

每遇到一处拿不准，按顺序判断，并把它记进本 issue 的「等你处理」清单：

| 情况 | 做法 | 记成 |
|---|---|---|
| 有合理的默认做法（项目规则、相邻代码的惯例、原版行为） | 按默认做 | **请确认**：按什么默认做了、改成别的要动哪里 |
| 没有默认，但这一处不影响其他部分 | 跳过这一处，继续做其余部分；代码里不留半成品 | **待你决定**：缺什么信息、有哪几种选法 |
| 影响整条 issue，什么都做不了 | 放弃这条 issue，去做下一条 | 写进 issue 留言，打 `agent-block` |

验收命令失败时修复后重跑，同一失败修三轮仍不过：撤回导致失败的那部分改动，记为「待你决定」，其余部分照常提交。

## 1. 领 issue

```bash
gh issue list -R windy10v10ai/game -l agent-todo --state open --json number,title -q 'sort_by(.number)|.[].number'
```

按编号从小到大逐个做第 2–5 步，做完一个再领下一个。没有就直接到第 6 步。

## 2. 准备分支

工作区必须干净（`git status --porcelain` 为空），否则结束整轮并在汇报里说明。

```bash
git checkout develop && git pull
git checkout -b <fix|feature>/<issue-id>-<3–6 个英文小写单词>
```

Bug 类型用 `fix/`，其余用 `feature/`。

## 3. 实现

按执行说明的「做法」逐条完成「目标」，遵守 `AGENTS.md` 与对应层 `CLAUDE.md`。任务对上某个 skill（如 `clone-item`、`bot-ability-usage`）时按该 skill 执行，其中的用户确认点按执行说明已拍板处理，执行说明没覆盖到的按「卡住时怎么办」处理。

完成条件：「目标」里每一条都已完成，或已记进「等你处理」。

## 4. 验收

依次跑执行说明「验收」里的命令，再检查范围：

```bash
git diff --name-only develop...HEAD
```

出现范围外文件时撤回那部分改动，需要改范围外文件才能完成的记为「待你决定」。

完成条件：每条验收命令都通过，diff 只含范围内文件。

## 5. 开草稿 PR

一处改动都没留下（全部跳过）时按「卡住时怎么办」第三行处理，删掉分支，回到第 1 步领下一个。

commit 与 PR 格式按 `create-pr` skill，差别：

- `gh pr create --draft --base develop`
- Issue 段：「目标」全部完成写 `Fixes #<id>`，有跳过的写 `#<id>`
- Release Note：执行说明写「不写」时删掉占位段；写「要写」时保留占位段，Checklist 加 `- [ ] Release Note 待生成（要点：…）`，不调用 `release-note`
- Checklist 加执行说明「实机验证」里的每一项
- 正文加「等你处理」一节，分「请确认」「待你决定」「发现」三组，每条一个 checkbox，写清在哪个文件、哪一步；三组都空时写「无」

然后：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-todo --add-label agent-done
gh issue comment <id> -R windy10v10ai/game --body "已开草稿 PR：<链接>。等你处理 N 项，见 PR 正文。"
```

切回 `develop`，回到第 1 步领下一个。

## 6. 汇报

整轮结束时输出一份汇报，按 issue 列出：PR 链接、「等你处理」的条数、`agent-block` 的原因。用户回来按这份汇报逐个收拾。

完成条件：每个领过的 issue 都是 `agent-done`（有 PR）或 `agent-block`（有留言），汇报里都有它。
