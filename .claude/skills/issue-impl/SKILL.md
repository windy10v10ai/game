---
name: issue-impl
description: 按 issue 末尾的「执行说明」实现一条 issue：实现、验收、实机验证、开草稿 PR、审一次。用户说「做 #123」「实现这个 issue」时用，issue-autorun 派执行者时也让执行者照它做。
---

# issue-impl

把一条已有「执行说明」的 issue 做到草稿 PR。标签、执行说明格式与实机验证三层见 `.claude/references/agent-autorun.md`，开始前先读。

两种用法共用这一份规则：

| 用法 | 谁做 | 用户 |
|---|---|---|
| 单条（默认） | 主对话直接实现 | 在场：拿不准的用 `AskUserQuestion` 问 |
| 批量（`issue-autorun`） | 主对话派执行者子代理做第 1–7 步，回来后自己做第 8–9 步 | 不在场：不提问，按「卡住时怎么办」处理 |

没有 `## 执行说明` 的 issue 不做：单条模式先用 `issue-spec` 补，批量模式按「卡住时怎么办」第三行处理。

## 硬规则

- 只改执行说明「改动范围」里的文件，执行说明以外的需求（评论里的新想法、相关 bug）不做，记进「发现」
- 不改 issue 正文，只留言、改标签
- 不合并、不推 `develop` / `main`，只开草稿 PR
- 不用降低标准换通过：改测试迁就代码、删失败用例、把没达成写成完成都不行
- 没亲眼看到的结果不写进 PR，后台跑的长命令，等取到结果末尾再写数字
- 执行者不得自己跑 `npm install` / `npm ci`（依赖由调度员保证已装好）

## 卡住时怎么办

| 情况 | 做法 | 记成 |
|---|---|---|
| 有合理的默认做法（项目规则、相邻代码的惯例、原版行为） | 按默认做 | **请确认**：按什么默认做了、改成别的要动哪里 |
| 没有默认，但这一处不影响其他部分 | 跳过这一处，继续做其余部分，代码里不留半成品 | **待你决定**：缺什么信息、有哪几种选法 |
| 影响整条 issue，什么都做不了 | 放弃这条 issue | 写进 issue 留言，打 `agent-block`（批量模式） |

失败分两类：

- **机械性失败**（lint、编译、格式、拼写）：自己修，同一失败三轮仍不过就撤回那部分改动，记为「待你决定」
- **检查不过**（jest 失败、实机 `[check] FAIL`、日志不对）：预期值由执行说明定死，可以改自己的实现重跑，最多三轮，不许改预期值与断言。三轮仍不过、或预期本身说不通：停下回报试过什么、日志原文、推测原因

## 1. 开始前

```bash
git status --porcelain      # 必须为空
git switch develop && git pull --ff-only
git switch -c <fix|feature>/<issue-id>-<3–6 个英文小写单词>   # Bug 用 fix/
```

工作区不干净就停下，不动用户的文件。

## 2. 先读

`AGENTS.md` 和它的对照表里改动目录的 `CLAUDE.md`，执行说明「做法」指定的 skill 完整读完并按步骤做，实机验证前读 `.claude/skills/dota-live-test/SKILL.md`。执行说明指向设计 artifact 时用 `gh issue artifact view <issue> <编号> -R windy10v10ai/game` 读。

## 3. 实现

按「做法」做，范围外的不碰。

## 4. 验收

跑执行说明「验收」里的命令（默认 `npm test`、`npm run lint`、`npm run build:vscripts`，改 Panorama 加 `npm run build:panorama`），补上要求的 jest 用例。`git diff --name-only origin/develop...HEAD` 只含改动范围内的文件。

列测试视角：每条「目标」对应哪个 jest 用例或实机验证项，覆盖了哪些边界，缺的补上或写明为什么不补。

## 5. 提交与草稿 PR

- commit 是单行英文标题，署名行按执行者：Claude 加 `Co-Authored-By`，没有 GitHub 账号的执行者不加（会显示成无效作者）
- `git push -u origin HEAD`，以 `git ls-remote origin <分支>` 与本地 HEAD 一致为准
- 按 `create-pr` 的格式开草稿 PR（`gh pr create --draft --base develop -R windy10v10ai/game`）。正文只写人做判断要看的关键信息，过程细节放进一条「验证记录」评论（之后更新用 `gh pr comment --edit-last`）。正文另加：
  - Issue 段：目标全部完成写 `Fixes #<id>`，有跳过写 `#<id>`
  - 影响玩家的数值、档位、等级用表格列出
  - Checklist：执行说明「实机验证」的每一项
  - 验证记录评论写：测试视角、每条验收命令与结果
  - 「等你处理」：「请确认」「待你决定」「发现」三组，每条 checkbox 写清文件与步骤，都空写「无」
  - Release Note 按执行说明：「不写」删占位段，「要写」把要点原文贴进该段，不改写，正式文案收尾时调用 `release-note`
- 执行说明「改动范围」写「无」的测量类 issue：不 commit、不开 PR，数据写进 issue 留言，报告格式见 `agent-autorun.md`「从 L4 拆出测量子 issue」

## 6. 实机验证

按执行说明标的层级做，方法见 `dota-live-test`：

- **脚本判定**：临时 Lua 每项打印 `[check] PASS|FAIL <名字> actual=<值> expected=<值>`，预期值照执行说明抄，脚本放 `game/scripts/vscripts/checks/<名字>.lua`，用 `npm run dota:check -- <名字>` 跑，退出码 0 才算通过
- **截图判定**：照执行说明截图，只交图和截图时的状态，不写「通过 / 失效」，也不据截图改代码或文案，图按 `create-pr/references/screenshots.md` 放进 PR
- **用户判定**：不做，列进「等你处理」

验完在 PR 正文加「实机验证结果」一节，每项一行结论并勾选全过的 Checklist 项，命令与 `[check]` 行原文写进验证记录评论。临时 Lua 验完删掉，不提交。

## 7. 收尾

停在 PR 分支，`git status --porcelain` 为空。PR 合并后（用户下指令合并的那次）立刻清理：按 `.claude/references/git-workflow.md`「合并与清理」删本地分支，在 worktree 里做的，先 `cmd //c rmdir <path>/node_modules` 拆掉链接再删 worktree。回报：PR 链接、分支、每条验收命令的结果、测试视角、实机验证每项结论、「等你处理」各条。

## 8. 审一次

读 `.claude/skills/review-pr/SKILL.md`，按其中「自动模式」审：只看 PR（正文、评论里的验证记录、截图）、执行说明与设计 artifact，给出 PASS / NEEDS-FIX / NEEDS-DECISION。

- 单条模式：主对话自己审
- 批量模式：默认调度员自己审，PR 增删合计超过 500 行，或本批超过 5 条时，改派审查子代理，避免 diff 撑大调度员的上下文。子代理交接只给证据（PR 编号、执行说明来源、日志路径），回报限 400 字

## 9. 判定与返工

逐条判定审查发现，读日志原文与数字，不只看结论：

- 通过的勾掉 PR Checklist 对应项，要改的按「卡住时怎么办」处理，退回时交接只写要改的几条，同一 PR 最多退回两轮，返工后 PR 正文与验证记录直接更新成最新结果，不保留各轮过程
- 两轮仍不过：升级给能力更强的执行者接手同一个 PR 分支，交接写明 PR 链接、还没解决的几条、前两轮的失败原因，仍不过记为「待你决定」
- 精简 PR 的「等你处理」成只含用户本人要做的事，每条一句话写清看什么、选什么：
  - 留：「用户判定」层的实机项、执行说明没定的玩法或文案取舍、要用户改执行说明的冲突
  - 删：执行说明已定的事、与本 PR 无关的工具问题、测试过程细节与日志噪音、重复条目
  - 自己补：能补验的截图项（悬停、点击后截图）退回补做，不留给用户

## 已知陷阱

- **本地 `npm test` 扫到别的 worktree**：jest 会扫进 `.agents/worktrees/` 下其他 PR 的代码，那里的失败与本分支无关，以 CI 为准
- **换英雄后特效显示红色 X**：克隆原版技能装到别的英雄上时，原版只随本英雄预加载的特效不会加载。要在抽选 KV 的技能块加 `precache`，特效路径在原版 KV 里查不到时，到 `game/dota/pak01_dir.vpk` 的目录里按名字找
- **删 worktree 前先查 `node_modules` 是不是指向主目录的链接**：`git worktree remove` 可能顺着链接把主目录依赖一并清空
