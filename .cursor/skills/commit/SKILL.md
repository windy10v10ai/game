---
name: commit
description: Use git commands to safely stage and commit changes in the current repository. Use when the user asks to commit, create a git commit, or says “提交代码/commit”. Produces a clear commit message and runs git status/diff/log before committing.
---

# /commit

## 目标

使用 Git 命令帮用户**安全地提交代码**：查看变更 → 选择要提交的文件 → 生成提交信息 → `git commit` → 校验结果。

## 工作流（必须按顺序）

1. **收集上下文（并行执行）**
   - `git status`
   - `git diff`
   - `git diff --staged`
   - `git log -5 --oneline`

2. **决定要提交什么**
   - 只提交与本次目的相关的改动。
   - 不要把明显可能含有密钥的文件提交进去（如 `.env`、`*.pem`、`credentials.json` 等）。如用户明确要求提交，也要先警告风险。

3. **拟定提交信息（优先遵循仓库风格）**
   - 先从最近提交信息判断风格（例如是否使用 `feat:` / `fix:` / `chore:`）。
   - 写 1–2 句，强调“为什么”，避免堆砌文件列表。

4. **执行提交（顺序执行）**
   - `git add <files...>`（只 add 选定文件；除非用户明确要求，否则不要无脑 `git add .`）
   - `git commit -m "<message>"`
   - `git status`（确认工作区/暂存区状态）

5. **失败处理**
   - 如果 `git commit` 因 pre-commit hook / lint 失败：根据错误修复后**重新提交一个新 commit**（不要擅自 `--no-verify`，除非用户明确要求）。
   - 如果没有可提交内容：不要创建空提交。

## 安全约束（必须遵守）

- 不要修改 git config。
- 不要执行不可逆/破坏性操作（例如 `push --force`、`reset --hard`、重写历史）除非用户明确要求。
- 不要 `git commit --amend`，除非用户明确要求，并且确认该 commit 是当前会话创建且未推送。
- 不要 `git push`，除非用户明确要求。

## 交付物

提交完成后，向用户返回：
- 这次 commit 的提交信息
- `git status` 的关键摘要（例如 “working tree clean / ahead by N commits”）

## 用法示例（用户可以这样说）

- “/commit 提交我刚改的这些文件”
- “帮我提交代码，message 写成修复某个 bug”
- “把暂存区的改动提交掉”
