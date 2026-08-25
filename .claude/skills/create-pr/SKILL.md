---
name: create-pr
description: 创建功能分支、commit、push 并发起 Pull Request 的完整工作流。当用户说"创建PR"、"create pr"、"提个PR"、"发 pull request"，或实现完成需要发起代码审查时触发。
---

# 创建 Pull Request 工作流

从 `develop` 创建功能分支到发起 PR 的完整流程。

---

## 分支命名

- 格式：`feature/{issue-number}-{branch-name}`
- 示例：`feature/123-add-new-hero-ai`
- 没有对应 issue 时可省略编号段，但仍以 `feature/` 开头

---

## Step 1：从 develop 创建分支

**必须**从最新的 `develop` 切出，不从当前所在分支（可能是别的未合并 feature 分支）派生：

```bash
git checkout develop
git pull
git checkout -b feature/{issue-number}-{branch-name}
```

---

## Step 2：开发与提交

Commit 格式：简短单行标题（≤72 字符）+ 正文只写 `Co-Authored-By`，不写其他说明——详细说明留给 PR description。

```bash
git add <相关文件>
git commit -m "$(cat <<'EOF'
<简短标题>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

只 stage 与本次请求明确相关的文件；若当前分支不符合预期（如本应在 feature 分支却处于 `develop`/`main`），先向用户确认目标分支再提交。

---

## Step 3：Push

```bash
git push -u origin feature/{issue-number}-{branch-name}
```

---

## Step 4：创建 Pull Request

- **base branch 固定为 `develop`**
- 使用模板 `.github/pull_request_template.md`
- **Issue 段**：分支名匹配 `^feature/(\d+)` 时，提取该数字填入模板的 `- [ ] fix #<issue-id>`；无匹配则保留占位或删除该行
- **Release Note 段**：**必须先调用 `release-note` skill 生成**，不要手写；调用前先按下方「Release Note 三选一」确认本次走哪条轨道
- **PR 标题默认使用英文**，简短概括改动（≤70 字符）
- **待确认/待验证事项写进 `## Checklist` 段落，用 checkbox 形式**（如 `- [ ] 在 Dota Tools 中验证 bot 是否正确开启臂章`），不要另开"待确认"之类的散文段落——review 时需要能逐项勾选，不是读一段说明文字

```bash
gh pr create --base develop --title "<英文标题>" --body-file <填充后的模板文件>
```

### Release Note 三选一

调用 `release-note` skill **之前**，先用 `AskUserQuestion` 让用户在三条轨道中选一条，选完再去查版本号——选「不写」时完全不必查 Steam 与 release PR：

| 选项 | 适用改动 | 后续动作 |
|---|---|---|
| 小版本补丁（默认推荐） | 常规改动，累积在当前大版本下 | 调用 `release-note`，参数注明「小版本补丁」 |
| 大版本 | 本次作为新大版本发布 | 调用 `release-note`，参数注明「大版本」，由其同步 `GAME_VERSION` |
| 不写 Release Note | 纯重构、文档、CI 等无玩法影响的改动 | 跳过 skill，并删掉 PR 模板里的 `## Release Note` 段 |

具体版本号（`v5.xx` / `v5.xxa`）由 `release-note` skill 在此选择之后确定；本次提问只问轨道，不让用户直接报版本号。

---

## 常见陷阱

- **分支不是从 develop 切出**：若在别的 feature 分支上直接 `checkout -b`，新分支会带着上一个分支未合并的改动，PR diff 会包含无关内容
- **Release Note 手写**：必须先跑 `release-note` skill，不要直接照抄改动列表拼凑
- **待确认事项写成独立段落**：应该和 `I have tested the changes works well.` 放在同一个 `## Checklist` 里，各自一个 checkbox
- **先查版本号再问轨道**：轨道未定就去查 Steam 与 release PR，选「不写 Release Note」时这些查询全是白费，还会把用户拖进不需要的版本号决策
