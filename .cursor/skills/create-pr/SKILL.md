---
name: create-pr
description: Create a GitHub pull request from the current branch to the `develop` branch. Stages and commits all local changes, pushes the branch, then creates a PR using `.github/pull_request_template.md` and Release Note style from `content/maps/changelog.md`. Also auto-fills the related issue from branch name `feature/<issue-id>` and comments the issue with the branch name.
---

# /create-pr

从**当前分支**创建指向 **`develop`** 分支的 PR，并且**提交 + 推送当前所有改动**。PR 正文按 `.github/pull_request_template.md`，Release Note 的写法参照 `content/maps/changelog.md`。

## 前置约束

- 不要改 `git config`。
- 不要做破坏性操作（`push --force`、`reset --hard` 等）。
- 不要跳过 hooks（不要用 `--no-verify`），除非用户明确要求。
- 不要 `--amend`，除非用户明确要求且确认未推送。

## 分支与 Issue 规则

- 当前分支名常见形如：
  - `feature/<issue-id>`（例如 `feature/1962`）
  - `feature/<issue-id>-xxx-task`（例如 `feature/1962-fix-roshan`）
- `<issue-id>` 提取规则：匹配 `^feature/(\\d+)`，取第一段数字；提取失败则进入“询问是否关联 issue”流程。

## 工作流（必须按顺序）

### 1) 收集上下文（并行执行）

- `git status`
- `git diff`
- `git diff --staged`
- `git log -5 --oneline`
- 读取当前分支名：`git branch --show-current`
- 固定 base 分支：`develop`

### 2) 提交当前所有改动（commit 全量变更）

- 暂存所有改动（包含新增文件）：`git add -A`
- 如果暂存区为空：
  - 跳过 commit，直接进入 push / create PR
- 否则生成提交信息并提交（遵循仓库最近提交风格；1–2 句，强调“为什么”）：
  - PowerShell/CMD（推荐）：
    - `git commit -m "<title>" -m "<body>"`

### 3) 推送当前分支

- `git push -u origin HEAD`

### 4) 生成 PR 正文（基于模板 + 自动填充）

模板来源：`.github/pull_request_template.md`，需要生成的 PR body 满足以下规则：

- **Issue 段**：
  - 把 `fix #9999` 替换为 `fix #<issue-id>`（如果成功提取 `<issue-id>`）
  - 如果提取失败：先询问用户是否要关联某个 `issue-id`
    - 用户提供 `issue-id`：按 `fix #<issue-id>` 填入
    - 用户明确表示不关联：**从 PR 正文中省略整个 Issue 段**（不保留 `fix #9999` 占位）
- **Checklist 段**：
  - 若有关联 `issue-id`：先读取 issue 内容并生成**具体 checklist 条目**（按 issue 的验收标准/任务拆分），不要只保留通用句子。
    - 建议命令：`gh issue view <issue-id> --repo windy10v10ai/game --json title,body -q ".title + \"\\n\" + .body"`
    - 生成规则：提取 2-6 条可验证项，使用 `- [ ] ...`；优先保留 issue 里的原始术语与关键名词。
    - 若 issue 已包含任务列表（markdown checkbox），优先复用并按本次改动筛选。
  - 若没有关联 issue：保留模板默认 checklist（`I have tested the changes works well.`）。
- **Release Note 段**：
  - 生成**中英文各一段**，格式与模板一致（使用 `[b]...[/b]` 标题与 `- ` 列表）
  - 写法参照 `content/maps/changelog.md`：简洁、面向玩家、合并相似项

Release Note 模板（直接放进 PR 正文）：

```text
## Release Note

```
[b]游戏性更新 v{版本号}[/b]

- {中文条目1}
- {中文条目2}
```

```
[b]Gameplay update v{版本号}[/b]

- {English item 1}
- {English item 2}
```
```

> 版本号来源：优先读取 `src/vscripts/modules/GameConfig.ts` 中的 `GAME_VERSION`（例如 `v5.17`）。

### 5) 创建 PR（当前分支 → develop）

- 依赖：需要安装并登录 GitHub CLI（`gh`）。
  - 若当前环境找不到 `gh`（命令不存在），先提示用户安装 GitHub CLI 并完成 `gh auth login`，再继续创建 PR。
- PR 标题风格：
  - **生成优先级（必须遵守）**：
    1. 优先写 **Issue 对应改动核心**（若有 `issue-id` 或 issue 描述可用）
    2. 其次写 **Release Note 第一条/核心条目**（玩家最感知的改动）
    3. 最后才退化为通用描述（如 `Update ...` / `Adjust ...`）
  - **相关性要求**：标题必须和 Issue 或 Release Note 主内容强相关，避免出现“只描述工具/流程改动”的弱相关标题。
  - **主流模式**：单行短句，直接描述改动；通常不使用 `feat:` / `fix:` 这类 Conventional Commit 前缀。
  - **常用开头动词（英文）**：`Fix`、`Fixed`、`Adjust`、`Add`、`Update`、`Remove`、`Refactor`、`Revert`、`Rework`、`Enable`、`Disable`、`Test`、`Replace`、`Sync`。
  - **中文标题也常见**：可直接中文描述（如“修复/优化/同步/新增...”），或中英混合（如 `Dota2 7.41 Sync ...`）。
  - **长度与内容**：建议 4-12 个词，聚焦一个主题；多改动可用逗号连接，不建议拆成很长句。
  - **标点**：可带句号但不强制；保持一致即可（仓库中有带句号与不带句号两种）。
  - **Issue 关联**：标题一般不写 `#<issue-id>`，在 PR body 的 Issue 段写 `fix #<issue-id>`。
  - **示例**：
    - Issue: “Roshan 过强” + Release Note 核心是削弱 Roshan → `Adjust Roshan durability and rewards`
    - Issue: “N7 过难” → `Reduce N7 difficulty`
- 创建命令（PowerShell 推荐，避免 `\n` 被当成字面量）：
  - 先把 PR 正文写入文件（例如 `.tmp_pr_body.md`）
  - 再执行：`gh pr create --base develop --head <current-branch> --title "<title>" --body-file .tmp_pr_body.md`
  - 完成后删除临时文件：`Remove-Item .tmp_pr_body.md`

创建后获取 PR 信息（用于回填 issue）：

- `gh pr view --json number,url -q ".number,.url"`

### 6) 自动回填 Issue（写入分支名）

若最终拿到 `<issue-id>`（数字）（来自分支名提取或用户提供）：

- 在该 issue 下评论，写入当前分支名（必须包含 `feature/<issue-id>`）与 PR 链接：
  - `gh issue comment <issue-id> -b "Branch: <current-branch>\nPR: <pr-url>"`

如果评论失败（无权限/issue 不存在/仓库非 GitHub 等），在输出里明确提示失败原因，但不要中断 PR 创建结果。

## 输出给用户（完成后）

- PR URL
- 是否有 commit（以及 commit hash）
- 是否成功评论 issue（成功/失败原因）
