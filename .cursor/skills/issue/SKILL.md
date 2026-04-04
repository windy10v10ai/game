---
name: issue
description: >-
  Implements a GitHub issue end-to-end from an issue URL or /issue: fetch issue,
  branch from develop as feature/<issue>-slug, implement (multi-file), then open
  PR via create-pr. Stops to ask the user when the issue is ambiguous or work
  is blocked. Use when the user pastes a github.com/.../issues/N link, says
  /issue, or asks to fix or implement a numbered GitHub issue.
---

# /issue

从 GitHub Issue 驱动开发：读 Issue → 从 `develop` 切分支 → 实现 → 复用 [create-pr](../create-pr/SKILL.md) 开 PR。

## 约束

- 不改 `git config`；不做破坏性 git 操作（与 create-pr 一致）。
- 可改多文件；以 Issue 验收范围为准，避免无关重构。

## 何时必须停下来问用户

- Issue 目标、范围或验收标准不清楚、自相矛盾。
- Issue 所在仓库与当前工作区 `origin` 不一致（或无法确认对应关系）。
- 实现受阻：缺少设计决策、依赖外部凭证、环境/测试无法运行、需要产品取舍。

## Issue 与链接

1. 从用户输入解析 `owner`、`repo`、`issue_number`（标准 Issue URL：`https://github.com/<owner>/<repo>/issues/<n>`）。
2. 用 **GitHub MCP** `get_issue` 或 **`gh issue view`**（其一即可）拉取标题与正文；需要评论里的补充时再用 `gh issue view <n> --comments` 或等价方式。
3. 核对：当前仓库 remote 是否对应同一 `owner/repo`；否则说明差异并询问是否继续、是否换目录。

## 分支

1. 取最新 `develop`：`git fetch origin` 后 `git checkout develop` 并 `git pull`（按团队习惯可与 `origin/develop` 对齐）。
2. 新分支名：`feature/<issue_number>-<短 slug>`  
   - `slug`：来自 Issue 标题：小写、空格与连续符号转为 `-`，去掉不安全字符，尽量短（例如 3～6 个词以内）。  
   - 示例：`feature/42-fix-lobby-timeout`。
3. `git checkout -b feature/<issue_number>-<slug>`。

## 开发

1. 按 Issue 实现；可 touch 多个文件；遵循仓库既有风格与测试习惯。
2. 在合理范围内跑项目已有的检查（build / test / lint），失败则排查或向用户说明阻塞。

## 提交与 PR

1. 工作完成后：阅读并**完整执行** [.cursor/skills/create-pr/SKILL.md](../create-pr/SKILL.md)（收集 diff、提交、推送、`gh pr create` 指向 `develop`、按模板写正文等）。  
   - 分支名已含 issue 号时，create-pr 的 Issue 识别规则仍适用；正文关联 `fix #<n>` / checklist 与模板保持一致。
2. 若 `gh` 不可用，可用 MCP 创建 PR，但正文与 checklist 仍应对齐 `.github/pull_request_template.md` 与 create-pr 中的 Release Note / changelog 规则。

## 回报

简要说明：分支名、核心改动、PR 链接；若已暂停提问，说明缺什么信息或阻塞原因。
