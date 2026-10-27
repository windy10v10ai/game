# 派 DeepSeek 执行：调用与交接模板

执行者是 DSH（DeepSeek Harness）的 headless 模式，跑在本机，和桌面版是否开着无关。模型、凭据已固化在 `~/.dsh/profiles/headless/cordis.patch.yml`（opencode-go `deepseek-v4.1-flash`，启用 `credentials`）；调用失败报 `MISSING_CREDENTIAL` 时先查这个文件。

## 调用

交接写进 scratchpad 的文件，用 `scripts/dsh-run.py` 调用，Bash 工具 `run_in_background: true`：

```bash
python -I .claude/skills/issue-autorun/scripts/dsh-run.py <交接文件> <scratchpad>/<issue-id>-run [--session-id <id>]
```

- 工作目录默认是主目录，权限 `danger-full-access`
- 脚本结束时打印一行摘要（`session=… minutes=… tools=… tokens_in=… tokens_out=… stop=…`）和 DeepSeek 的最终回复；完整事件流在 `<log>.jsonl`，只在要查细节时用短脚本提取，不整份读
- 退出码：0 完成，1 DSH 报错，2 卡死（30 分钟没有新事件），3 超时（3 小时）；2 / 3 已由脚本停掉 DeepSeek
- 退回修改、继续卡住的活都加 `--session-id <摘要里的 session>` 接着原会话，交接只写要改的几条
- 报 `already owned by an active write handle`：用户在 DSH 桌面版打开了这个会话。不另开会话，写进汇报，等用户关掉桌面版后再接

## 交接模板

规则不抄进交接，让它按 `AGENTS.md` 自己读。交接只写本条 issue 特有的内容：

```markdown
你在仓库主目录（当前目录）里做 issue windy10v10ai/game#<id>，从实现一直做到实机验证，中途不交回。

## 先读
1. `AGENTS.md`，按它的对照表读改动目录的 CLAUDE.md 和对得上的 skill；实机验证前读 `.claude/skills/dota-live-test/SKILL.md`
2. `gh issue view <id> -R windy10v10ai/game`：正文末尾「执行说明」是唯一需求来源<有设计文档时：设计文档在 <路径>>

## 开始前
- `git status --porcelain` 必须为空、当前在 `develop`；不满足就立刻停下回报，不动任何文件
- `git fetch origin develop && git switch -c <分支> origin/develop`

## 硬规则
- 不跑 `npm install` / `npm ci`
- 只改「改动范围」里的文件；执行说明以外的需求不做，记进「发现」
- 机械性失败（lint、编译、格式、拼写）自己修，同一失败最多三轮
- 测试逻辑失败、实机结果和预期不符、达不到预期状态时停下回报，不自己降低标准：不改测试迁就代码、不删失败用例、不把没达成写成完成
- 有合理默认做法（项目规则、相邻代码惯例、原版行为）的按默认做，记为「请确认」；没有默认、只影响局部的跳过，记为「待你决定」
- PowerShell 的 `>` 写出的是 UTF-16，要给其他工具读的文件用 `Out-File -Encoding utf8` 或 `git show ... | Set-Content -Encoding utf8`
- 后台跑的长命令，等取到结果末尾再写数字；没亲眼看到的结果不写进 PR

## 交付
1. 跑执行说明「验收」里的命令，`git diff --name-only origin/develop...HEAD` 只含改动范围内的文件
2. 列测试视角：每条「目标」对应哪个 jest 用例或实机验证项，覆盖了哪些边界；缺的补上或写明为什么不补
3. 单行英文 commit，正文只写 `Co-Authored-By: DeepSeek V4.1 Flash <noreply@deepseek.com>`；`git push -u origin HEAD`，以 `git ls-remote origin <分支>` 与本地 HEAD 一致为准（PowerShell 会把 git 的提示当错误）
4. 按 `create-pr` 的格式开草稿 PR（`gh pr create --draft --base develop -R windy10v10ai/game`），另加：
   - Issue 段：目标全部完成写 `Fixes #<id>`，有跳过写 `#<id>`
   - 影响玩家的数值、档位、等级用表格列出
   - 「测试视角」一节：上面第 2 步的对照
   - Checklist：执行说明「实机验证」的每一项
   - 「等你处理」：「请确认」「待你决定」「发现」三组，每条 checkbox 写清文件与步骤；都空写「无」
   - Release Note 按执行说明：「不写」删占位段，「要写」保留并在 Checklist 加 `- [ ] Release Note 待生成（要点：…）`
   - 末行 `🤖 Implemented by DeepSeek V4.1 Flash via DSH, dispatched by Claude Code`
5. 实机验证：按 `dota-live-test` 的命令行方式（`npm run perf`、`npm run dota:cmd`、`-run` 临时 Lua、grep 落盘日志）逐项验 Checklist。要截图或点界面才能判断的项跳过，标「需要截图」。验完用 `gh pr edit` 在 PR 正文加「实机验证结果」一节，每项写命令、日志关键行、读到的数字、通过 / 不通过 / 无法判断，并勾选通过的 Checklist 项。结果和预期不符时不修代码，停下回报。临时 Lua 脚本验完删掉，不提交
6. 结束时停在 PR 分支，`git status --porcelain` 为空
7. 最终回复：PR 链接、分支、每条验收命令的结果、测试视角、实机验证每项结论、「等你处理」各条；停下回报时写清试过什么、日志原文、推测原因
```

## 会话归档与分组

DSH 按 `~/.dsh/storages/workspace.json` 里的会话 ID 清单分组，headless 会话默认在「未分组」。收尾时用 `scripts/dsh-sessions.py` 整理：

```bash
python -I .claude/skills/issue-autorun/scripts/dsh-sessions.py file <开了 PR 的会话 ID>...
python -I .claude/skills/issue-autorun/scripts/dsh-sessions.py archive <调用失败或作废的会话 ID>...
```

`file` 放进 `claude-dispatch` 工作区（不存在时自动建）。DSH 桌面版运行时脚本拒绝执行：它会用内存状态覆盖这个文件。被拒时把待整理的 ID 写进汇报，等用户关掉 DSH 后再跑。

## 已知陷阱

- **日志里的 exit code**：`tool_result` 的 `status: completed` 只表示命令跑完，成败看结果末尾的 `[exit code: N]` 或命令自己打印的 `EXIT=`
- **后台命令的输出被截断**：DeepSeek 把 `npm test` 这类长命令放后台、再用 `job_output` 取结果时，日志里只留输出开头，看不到通过数。测试结果以 CI 为准
- **PowerShell 脚本跑不了**：本机执行策略不允许未签名脚本，调用脚本因此用 Python 写
