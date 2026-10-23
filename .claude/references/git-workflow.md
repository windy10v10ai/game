# Git 细则

根 `.claude/CLAUDE.md`「Git」一节的展开：切分支前的检查、小改动搭车、合并与清理、worktree。提交与开 PR 的完整步骤见 `create-pr` skill。

## 切分支前

- 先看 `git status --short`、`git branch --show-current`、`git worktree list`。当前 checkout 干净且没有其他会话或进行中的分支占用时，直接在这里从最新 `develop` 切新分支
- 当前在已合并的旧分支时，核实 PR 已合并、本地 HEAD 与 PR 末尾提交一致、没有未提交改动，再切回 `develop`、删旧本地分支、切新分支。远端显示 `gone` 不等于已合并；squash merge 后 `git branch --merged` 也查不到旧分支
- worktree 只在三种情况下用：当前 checkout 有未提交改动、未合并分支仍在使用、确有多个会话共用这个 checkout。其他会话正在用的 checkout 与分支保持原样

## 小改动搭车

手上有未合并的 PR 时，文档、skill、注释、规约补充这类小改动直接并进去，在 PR 正文补一句说明：单开 PR 的流程成本比改动本身还大。与当前 PR 主题不同照样搭车，例如修 bug 的 PR 顺带改 skill 流程。以下任一条成立才另开分支：

- 违反当前 PR 的既定规矩（如纯升级的 PR 不改页面）
- 当前 PR 已合并
- 一两句话说不清

没有开着的 PR 时先攒着等下一个 PR；改动有时效性（挡着别人、线上有问题）才单开。

## 合并与清理

用户给出合并指令时执行：

| PR | 命令 |
|---|---|
| `feature` / `fix` / `chore` / `docs` → `develop` | `gh pr merge <编号> --squash` |
| `develop` → `main`（release PR） | `gh pr merge <编号> --merge` |

CI 还没跑完时加 `--auto`，分支保护照常生效（不加 `--admin`）。

用户说「自动合并」时，发出 `gh pr merge <编号> --squash --auto` 后不等合并完成，用 `AskUserQuestion` 问是否清理本地分支与 worktree，用户确认后立刻按下文清理。

合并后立刻清理本地分支，远端分支由仓库设置自动删除。squash 合并后 git 认不出分支已合并，用 `-D`：

```bash
git checkout develop
git pull
git branch -D <branch-name>
```

分支在 worktree 里时，先 `git worktree remove <path> --force`，删完分支再 `git worktree prune`。

## worktree 与 node_modules

worktree 里借主目录的依赖，用 junction：`powershell -c "New-Item -ItemType Junction -Path <path>\node_modules -Target <主目录>\node_modules"`。`npm install` 的 postinstall（`src/scripts/install.js`）会把 Dota 的 `game/` `content/` addon 目录改链到当前 worktree，删掉 worktree 后主目录的链接就断了，所以 worktree 里不跑它。

删 worktree 前先 `cmd //c rmdir <path>/node_modules` 拆掉 junction，否则 `--force` 会顺着它清空主目录的 `node_modules`。

Dota 只加载主目录的 `game/`，要实机测 worktree 里的改动，先把分支搬回主目录。

## 误跑全量 prettier 后还原

误跑了通配符 `prettier --write` 时：`git add -A` 归一化换行，`git diff --cached --stat` 看清范围，逐个 `git checkout HEAD -- <file>` 还原。`src/vscripts/api/api-client.local.ts` 带 skip-worktree、工作区存着真实 key，所以不用 `git reset --hard`。
