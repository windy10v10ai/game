---
name: create-pr
description: Create a PR from current branch to develop, committing all local changes, then push and open PR with template-based body.
---

# /create-pr

从当前分支创建到 `develop` 的 PR。默认会提交并推送当前全部改动。

## 约束

- 不改 `git config`。
- 不做破坏性命令（如 `push --force`、`reset --hard`）。
- 不跳过 hooks（除非用户明确要求）。
- 不 `--amend`（除非用户明确要求）。

## Issue 识别

- 分支名匹配 `^feature/(\\d+)` 时，提取 `issue-id`。
- 提取失败时，询问用户是否关联 issue。

## 执行步骤（按顺序）

1. 收集上下文：`git status`、`git diff`、`git diff --staged`、`git log -5 --oneline`、`git branch --show-current`。
2. 提交全部改动：`git add -A`；若有暂存内容则生成简洁 commit message 并提交，若无改动则跳过 commit。
3. 推送分支：`git push -u origin HEAD`。
4. 组装 PR 正文（模板：`.github/pull_request_template.md`）：
   - Issue 段保留 `- [ ] fix #<issue-id>` 格式。
   - 有 issue 时基于 issue 内容，无 issue 时根据改动内容，生成数条可验证 checklist。
   - Release Note 必须遵循 `.claude/skills/generate-changelog/SKILL.md`（版本号与文案规则以该技能为准）。
   - 必须先执行 `generate-changelog` 的版本推导步骤，再填写 Release Note 版本号：
5. 创建 PR：`gh pr create --base develop --head <current-branch> --title "<title>" --body-file <temp-file>`。
6. 回报结果：返回 PR URL、是否新建 commit（及 hash）。

## 标题原则

- 优先体现 Issue 核心改动，其次体现 Release Note 核心改动。
- 单行短句，和改动强相关，不写 `#<issue-id>`。

## 说明

- 不自动在 issue 下发表评论。
- 仅在 PR 正文 Issue 段体现关联关系。
