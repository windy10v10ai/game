# 派 DeepSeek 执行：调用与交接模板

执行者是 DSH（DeepSeek Harness）的 headless 模式，跑在本机。模型、凭据已固化在 `~/.dsh/profiles/headless/cordis.patch.yml`（opencode-go `deepseek-v4.1-flash`，启用 `credentials`）；调用失败报 `MISSING_CREDENTIAL` 时先查这个文件。

## 调用

用 PowerShell 工具、`run_in_background: true`，交接写进 scratchpad 的文件从 stdin 传入：

```powershell
$dsh = "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"
$env:DSH_PERMISSION_MODE = 'danger-full-access'
Set-Location <worktree 绝对路径>
Get-Content -Raw -Encoding utf8 <交接文件> | & $dsh --profile headless --json - 2> <log>.err | Out-File -Encoding utf8 <log>.jsonl
```

- 工作目录就是 DeepSeek 的工作区，实现阶段设为 worktree，实机验证阶段设为主目录
- 第一行事件 `{"type":"session","sessionId":...}` 记下会话 ID；退回修改时加 `--session-id <id>` 接着原会话，不重新交接
- `--json` 的事件流里 `tool_call` / `tool_result` 是它做过的每一步，`final` 是回报；`status` 事件带 token 用量
- 会话存在 `~/.dsh/sessions/<工作目录>/`，用户能在 DSH 界面里看到全过程

## 建 worktree

调度员建，DeepSeek 不建：

```bash
git worktree add -b <分支> .claude/worktrees/<issue-id>-<短名> origin/develop
powershell -c "New-Item -ItemType Junction -Path '<worktree>\node_modules' -Target '<主目录>\node_modules'"
```

worktree 里不跑 `npm run skills:link`：DeepSeek 按 `AGENTS.md` 对照表用路径读 `.claude/skills/<name>/SKILL.md` 就够用，多一个 junction 只会让删 worktree 时多一步拆链接。

## 实现阶段交接模板

规则不抄进交接，让它按 `AGENTS.md` 自己读。交接只写本条 issue 特有的内容：

```markdown
你在 git worktree（当前目录）里实现 issue windy10v10ai/game#<id>，分支 `<分支>` 已从最新 develop 切好。

## 先读
1. `AGENTS.md`，按它的对照表读改动目录的 CLAUDE.md 和对得上的 skill
2. `gh issue view <id> -R windy10v10ai/game`：正文末尾「执行说明」是唯一需求来源<有设计文档时：设计文档在 <主目录绝对路径>>
3. gitignore 的目录（`docs/reference/`、`docs/superpowers/`）worktree 里没有，到主目录 `<主目录绝对路径>` 下读

## 硬规则
- `node_modules` 是指向主目录的 junction：不跑 `npm install` / `npm ci`，不删它
- 只改「改动范围」里的文件；执行说明以外的需求不做，记进「发现」
- 不碰 Dota，实机验证另有阶段
- 机械性失败（lint、编译、格式、拼写）自己修，同一失败最多三轮
- 测试逻辑失败、结果和预期不符、达不到预期状态时停下回报，不自己降低标准：不改测试迁就代码、不删失败用例、不把没达成写成完成
- 有合理默认做法（项目规则、相邻代码惯例、原版行为）的按默认做，记为「请确认」；没有默认、只影响局部的跳过，记为「待你决定」

## 交付
1. 跑执行说明「验收」里的命令，`git diff --name-only origin/develop...HEAD` 只含改动范围内的文件
2. 列测试视角：每条「目标」对应哪个 jest 用例或实机验证项，覆盖了哪些边界；缺的补上或写明为什么不补
3. 单行英文 commit，正文只写 `Co-Authored-By: DeepSeek V4.1 Flash <noreply@deepseek.com>`；`git push -u origin HEAD`
4. 按 `create-pr` 的格式开草稿 PR（`gh pr create --draft --base develop -R windy10v10ai/game`），另加：
   - Issue 段：目标全部完成写 `Fixes #<id>`，有跳过写 `#<id>`
   - 影响玩家的数值、档位、等级用表格列出
   - 「测试视角」一节：上面第 2 步的对照
   - Checklist：执行说明「实机验证」的每一项，未验证
   - 「等你处理」：「请确认」「待你决定」「发现」三组，每条 checkbox 写清文件与步骤；都空写「无」
   - Release Note 按执行说明：「不写」删占位段，「要写」保留并在 Checklist 加 `- [ ] Release Note 待生成（要点：…）`
   - 末行 `🤖 Implemented by DeepSeek V4.1 Flash via DSH, dispatched by Claude Code`
5. 最终回复：PR 链接、分支、每条验收命令的结果、测试视角、「等你处理」各条；停下回报时写清试过什么、日志原文、推测原因
```

## 实机验证阶段交接模板

工作目录设为主目录，主目录已由调度员切到该分支：

```markdown
你在主目录对 PR windy10v10ai/game#<pr> 做实机验证。先读 `AGENTS.md` 与 `.claude/skills/dota-live-test/SKILL.md`，按它的命令行方式（`npm run perf`、`npm run dota:cmd`、grep 落盘日志）验证 PR Checklist 里的这几项：<逐项列出>。

- 不改代码、不提交、不切分支
- 需要截图或点界面才能判断的项跳过，回报里标「需要截图」
- 每项回报：执行的命令、日志原文（关键几行）、读到的数字、通过 / 不通过 / 无法判断；不只写结论
- 结果和预期不符时不修代码，停下回报
```

## 已知陷阱

- **`git push` 误报失败**：PowerShell 把 git 写到 stderr 的提示当成错误，exit code 为 1 但推送成功。以 `git rev-parse HEAD` 与 `git ls-remote origin <分支>` 一致为准
- **日志里的 exit code**：`tool_result` 的 `status: completed` 只表示命令跑完，成败看结果末尾的 `[exit code: N]` 或命令自己打印的 `EXIT=`
