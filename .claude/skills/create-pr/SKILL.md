---
name: create-pr
description: 创建分支、commit、push 并发起 PR。
---

# 创建 Pull Request

分支命名、commit 格式、stage 范围见根 `.claude/CLAUDE.md`「Git」。

## 1. 切分支

从最新 `develop` 切出，不从当前所在分支派生（会带进上一个分支未合并的改动）：

```bash
git checkout develop
git pull
git checkout -b <prefix>/<issue-id>-<summary>
```

本地有要带进新分支的未提交改动时直接切，改动会跟过去；搬运改动不用 `git stash`（stash 没存上时 `pop` 会弹出更早的旧存档）。

## 2. 提交

只 stage 相关文件，commit 单行标题 + `Co-Authored-By`，说明留给 PR 正文。

## 3. Push

先 `gh pr list --head <branch>` 查是否已有 PR，再 `git rev-parse --abbrev-ref --symbolic-full-name @{u}` 确认上游，推到该上游。自己新切的分支上游是 `origin`（首次带 `-u`）；跟着别人 fork 的 cross-repo PR 上游是那个 fork（需 `maintainerCanModify` 为 true）。推到 `origin` 的表现是主仓库多出同名分支、PR 的 head commit 没变。

完成：已有 PR 时报告原 PR 链接，不再新建。

## 4. 创建 PR

用模板 `.github/pull_request_template.md`，`gh pr create --base develop --title "<英文标题>" --body-file <文件>`：

- **标题**英文，≤70 字符
- **Issue 段**：分支名匹配 `^(feature|fix|chore|docs)/(\d+)` 时填 `#<id>`（完成 issue 全部范围才用 `Fixes`），无匹配就删掉该行
- **Checklist 段**：待确认、待验证事项各一个 checkbox（如 `- [ ] 在 Dota Tools 中验证 bot 是否正确开启臂章`），和模板原有的那条放在一起，方便 review 逐项勾选
- **Release Note 段**：按下节判定
- **界面截图**：改了界面时按 `references/screenshots.md` 拍图并放进正文

## Release Note 三选一

**纯内部改动**同时满足：

1. 改动对象是代码结构、构建、CI、文档、注释、测试或开发调试工具
2. 玩家在游戏内读不出一条「更新内容」：没有新增或移除玩家可见内容，没有数值与平衡变化，没有 UI 与本地化文案变化，bot 会不会用某个技能或物品没有改变

重构与代码迁移带来细微差异（阈值口径变化、去掉重复逻辑），只要玩家不会当成一条更新来读，仍算纯内部改动。

- **是**：删掉模板的 `## Release Note` 段，在描述里说明本次无玩法影响。不提问、不查版本号
- **不是或无法确定**：用 `AskUserQuestion` 先问轨道，选定后再查版本号

| 选项 | 适用改动 | 后续 |
|---|---|---|
| 小版本补丁（默认推荐） | 常规改动，累积在当前大版本下 | 调用 `release-note`，参数注明「小版本补丁」 |
| 大版本 | 本次作为新大版本发布 | 调用 `release-note`，参数注明「大版本」 |
| 不写 Release Note | 玩法影响处于边界、用户判断不必公告 | 删掉 `## Release Note` 段 |

选了前两项时，再用一次 `AskUserQuestion` 问写回方式：写入功能 PR 并合并进聚合 release PR（推荐）/ 仅写入功能 PR / 仅提交改动 / 跳过。`release-note` 在 SubAgent 里运行、不能提问，所以两项都在这里问齐，PR 创建后再调用，参数写 PR 号、轨道、写回方式。它回报待选项时问用户，带着答案重新调用。

具体版本号由 `release-note` 在轨道选定后确定，本次不问。
