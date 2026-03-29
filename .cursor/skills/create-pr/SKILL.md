---
name: create-pr
description: Create a GitHub pull request from the current branch to the `develop` branch. Stages and commits all local changes, pushes the branch, then creates a PR using `.github/pull_request_template.md`. Release Note wording follows `.claude/skills/generate-changelog/SKILL.md`. Auto-fills the related issue from branch name `feature/<issue-id>`, but does not post comments to the issue.
---

# /create-pr

从**当前分支**创建指向 **`develop`** 分支的 PR，并且**提交 + 推送当前所有改动**。PR 正文按 `.github/pull_request_template.md`。**Release Note** 的格式、版本号与撰写规则一律参照 **`.claude/skills/generate-changelog/SKILL.md`**（本技能不展开示例正文）。

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
  - **保留模板行格式**：`- [ ] fix #<issue-id>`（仅将 `9999` 换成 `<issue-id>`），**不要**改成单独一行 `fix #…`。
  - 若提取失败：询问是否关联 `issue-id`；用户提供则同样写 `- [ ] fix #<issue-id>`；用户明确不关联则**整段删除**（含 `## Issue` 下内容）。
- **Checklist 段**：
  - 若有关联 `issue-id`：先读取 issue 内容并生成**具体 checklist 条目**（按 issue 的验收标准/任务拆分），不要只保留通用句子。
    - 建议命令：`gh issue view <issue-id> --repo windy10v10ai/game --json title,body -q ".title + \"\\n\" + .body"`
    - 生成规则：提取 2-6 条可验证项，使用 `- [ ] ...`；优先保留 issue 里的原始术语与关键名词。
    - 若 issue 已包含任务列表（markdown checkbox），优先复用并按本次改动筛选。
  - 若没有关联 issue：保留模板默认 checklist（`I have tested the changes works well.`）。
- **Release Note 段**：
  - 按 **`.claude/skills/generate-changelog/SKILL.md`** 生成（含 `[b]...[/b]`、中英两段、Workshop 版本号与 `GAME_VERSION` 对应关系等）；PR 模板中有 `## Release Note` 占位时，将生成结果填入该段即可。
  - **版本号**：以 Steam 创意工坊 changelog **最新已发**一条为基准递增 `a/b/c`；**不要**在 Steam 仍为 `v5.18x` 时仅因存在 open 的 `v5.19` release PR 就写 `v5.19a`（详见该技能「Workshop 版本号」节）。
  - **正文**：Release Note 与 Steam 对外文案一致，**玩家向、短句、无维护项/无具体倍率**（见该技能「Workshop 文案：玩家向」）；PR 的 Checklist 可保留技术验收项，勿照抄进 Release Note。

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
  - **Issue 关联**：标题一般不写 `#<issue-id>`；正文 Issue 段用 `- [ ] fix #<issue-id>`。
  - **示例**：
    - Issue: “Roshan 过强” + Release Note 核心是削弱 Roshan → `Adjust Roshan durability and rewards`
    - Issue: “N7 过难” → `Reduce N7 difficulty`
- 创建命令（PowerShell 推荐，避免 `\n` 被当成字面量）：
  - 先把 PR 正文写入文件（例如 `.tmp_pr_body.md`）
  - 再执行：`gh pr create --base develop --head <current-branch> --title "<title>" --body-file .tmp_pr_body.md`
  - 完成后删除临时文件：`Remove-Item .tmp_pr_body.md`

创建后获取 PR 信息（用于回填 issue）：

- `gh pr view --json number,url -q ".number,.url"`

### 6) Issue 处理策略

- 不在关联 issue 下自动评论（默认禁用 `gh issue comment`）。
- 仅在 PR 正文的 Issue 段中体现关联关系（`- [ ] fix #<issue-id>`）。

## 输出给用户（完成后）

- PR URL
- 是否有 commit（以及 commit hash）
