---
name: issue-execute
description: 无人值守时领一个 agent-ready 的 issue，按执行说明实现并开草稿 PR。
disable-model-invocation: true
---

# issue-execute

无人值守执行一个已拍板的 issue。每次调用只处理一个 issue，产出是一个草稿 PR 或一条 blocked 留言。标签与执行说明格式见 `.claude/references/agent-handoff.md`，开始前先读。

## 硬规则

- **不提问**：用户不在场，根 `CLAUDE.md`「Skill 交互」的 `AskUserQuestion` 不适用。拿不准就走第 6 步 blocked，不猜
- **不合并、不推 `develop` / `main`**，只开草稿 PR
- **只改执行说明「改动范围」里的文件**
- **不改 issue 正文**，只留言、改标签
- 执行说明以外的需求（issue 评论里的新想法、相关 bug）不做，写进 PR 正文「发现」一节

## 1. 领 issue

```bash
gh issue list -R windy10v10ai/game -l agent-ready --state open --json number,title -q 'sort_by(.number)|.[0]'
```

没有就结束，报告「无可领 issue」。

完成条件：拿到一个 issue 编号，正文含 `## 执行说明` 且每一项都有内容；缺项直接走第 6 步。

## 2. 准备分支

工作区必须干净（`git status --porcelain` 为空），否则结束并报告。

```bash
git checkout develop && git pull
git checkout -b <fix|feature>/<issue-id>-<3–6 个英文小写单词>
```

Bug 类型用 `fix/`，其余用 `feature/`。

## 3. 实现

按执行说明的「做法」实现，遵守 `AGENTS.md` 与对应层 `CLAUDE.md`。任务对上某个 skill（如 `clone-item`、`bot-ability-usage`）时按该 skill 执行，其中的用户确认点按执行说明已拍板处理；执行说明没覆盖到的决策点走第 6 步。

完成条件：执行说明「目标」里的每一条都有对应改动，「验收」要求的 jest 用例已补。

## 4. 验收

依次跑执行说明「验收」里的命令，再检查范围：

```bash
git diff --name-only develop...HEAD
```

命令失败时修复后重跑，同一失败修三轮仍不过走第 6 步。出现范围外文件时撤回那部分改动；撤回后目标无法完成走第 6 步。

完成条件：每条验收命令都通过，diff 只含范围内文件。

## 5. 开草稿 PR

commit 与 PR 格式按 `create-pr` skill，差别：

- `gh pr create --draft --base develop`
- Issue 段写 `Fixes #<id>`
- Release Note：执行说明写「不写」时删掉占位段；写「要写」时保留占位段，Checklist 加 `- [ ] Release Note 待生成（要点：…）`，不调用 `release-note`
- Checklist 加执行说明「实机验证」里的每一项
- 正文加「发现」一节（没有就省略）：执行中注意到但不在范围内的问题

然后：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-ready --add-label agent-done
gh issue comment <id> -R windy10v10ai/game --body "已开草稿 PR：<链接>"
```

完成条件：草稿 PR 已创建，issue 标签为 `agent-done`。

## 6. blocked

切回 `develop`，删除本地分支（未推送的改动不保留）。在 issue 留言写明卡在哪一步、缺什么信息、建议补充什么，然后：

```bash
gh issue edit <id> -R windy10v10ai/game --remove-label agent-ready --add-label agent-blocked
```

完成条件：issue 标签为 `agent-blocked`，留言写明了要用户补的内容。
