---
name: issue-impl
description: 按 issue 正文（背景、目标、要求、验收、Release Note）和「执行说明」artifact 实现一条 issue：实现、验收、实机验证、开 PR、审一次、合入 develop。用户说「做 #123」「实现这个 issue」时用，issue-autorun 派执行者时也让执行者照它做。
---

# issue-impl

把一条正文已按结构写好的 issue 做到合入 `develop`。合并条件全过就合并，没过的 PR 保持开着，没做完的是草稿。标签、正文结构与实机验证三层见 `.claude/references/agent-issue.md`，开始前先读。

两种用法共用这一份规则：

| 用法 | 谁写代码（第 1–7 步） | 谁审（第 8 步） | 用户 |
|---|---|---|---|
| 单条（默认） | 主对话派执行者子代理 | 主对话 | 在场：主对话拿不准的用 `AskUserQuestion` 问 |
| 批量（`issue-autorun`） | 主对话派执行者子代理 | 主对话派审查子代理，自己只调度 | 不在场：不提问，按「卡住时怎么办」处理 |

第 9–10 步都由主对话做。单条通常接在 `issue-spec` 之后同一个对话里做完，执行者模型按根 `CLAUDE.md`「节约用量」。单文件小改这类派子代理不划算的，主对话自己写，再派审查子代理审。拿到这份 skill 的执行者从第 1 步做到第 7 步，不再往下派。

正文末尾没有执行说明链接（也找不到名为「执行说明」的 artifact）、或读不到的 issue 不做：单条模式先用 `issue-spec` 补，批量模式按「卡住时怎么办」第三行处理。

## 硬规则

- 只改执行说明「改动范围」里的文件，执行说明以外的需求（评论里的新想法）不做；顺手发现的旧问题按 `agent-issue.md`「顺手发现的问题」处理
- 不改 issue 正文，只留言、改标签
- 不直接推 `develop` / `main`，不审批、不合并 release PR。功能 PR 只在第 10 步合并，执行者不合并。PR 草稿规则见根 `CLAUDE.md`「Git」。本流程实机验证在开 PR 之后，所以先带 `--draft`，第 9 步判定通过后立刻转正式；有没做完或没通过的部分才保持草稿
- 不用降低标准换通过：改测试迁就代码、删失败用例、把没达成写成完成都不行
- 没亲眼看到的结果不写进 PR，后台跑的长命令，等取到结果末尾再写数字
- 执行者不得自己跑 `npm install` / `npm ci`（依赖由调度员保证已装好）

## 卡住时怎么办

| 情况 | 做法 | 记成 |
|---|---|---|
| 有合理的默认做法（项目规则、相邻代码的惯例、原版行为） | 按默认做，不问 | 玩家看得到、用户可能想改的记**发版前**：按什么默认做了、改成别的要动哪里；其余 PR 正文写一句 |
| 没有默认，但这一处不影响其他部分 | 跳过这一处，继续做其余部分，代码里不留半成品 | **待你决定**（挡合并）：缺什么信息、有哪几种选法 |
| 影响整条 issue，什么都做不了 | 放弃这条 issue | 写进 issue 留言，第一句写 `卡住：`，打 `agent-block`（批量模式） |

失败分两类：

- **机械性失败**（lint、编译、格式、拼写）：自己修，同一失败三轮仍不过就撤回那部分改动，记为「待你决定」
- **验收场景复现不了**：执行说明或验收写的复现步骤在改动前没复现，先换相邻场景（别的塔、别的英雄、建筑、不同时机）各试一遍再下结论，试过的场景写进验证记录；仍复现不了记为「待你决定」，不单方面判作废
- **检查不过**（jest 失败、实机 `[check] FAIL`、日志不对）：预期值由执行说明定死，可以改自己的实现重跑，最多三轮，不许改预期值与断言。三轮仍不过、或预期本身说不通：停下回报试过什么、日志原文、推测原因

## 1. 开始前

```bash
git status --porcelain      # 必须为空
git switch develop && git pull --ff-only
gh issue view <issue-id> -R windy10v10ai/game --json closedByPullRequestsReferences -q '.closedByPullRequestsReferences[]|"\(.number) \(.state) \(.headRefName)"'
```

上面最后一条查这条 issue 有没有关联的 PR。有**未合并**的（状态 OPEN，草稿也算）就接着做，不另切分支、不另开 PR：

```bash
git fetch origin && git switch -C <该 PR 的分支> origin/<该 PR 的分支>   # 远端历史可能被改写过，不用本地旧分支
```

没有未合并的 PR 才新切分支：

```bash
git switch -c <fix|feature>/<issue-id>-<3–6 个英文小写单词>   # Bug 用 fix/
```

工作区不干净就停下，不动用户的文件。

开工时把这条 issue 在「开发计划」项目里的 Status 置为 In progress（命令与 ID 见 `.claude/references/issue-fields.md`）。这条是挂在父 issue 下的测量子 issue 时，父 issue 的 Status 保持 Plan 或 Todo，不置 In progress。

## 2. 先读

`AGENTS.md` 和它的对照表里改动目录的 `CLAUDE.md`，执行说明「做法」指定的 skill 完整读完并按步骤做，实机验证前读 `.claude/skills/dota-live-test/SKILL.md`。「执行说明」artifact 从正文末尾链接取编号（没有链接时用 `gh issue artifact list <issue>` 按名字找），再 `gh issue artifact view <issue> <编号> -R windy10v10ai/game` 读。

## 3. 实现

按「做法」做，范围外的不碰。

## 4. 验收

跑执行说明「验收命令」里的命令，并逐条核对「验收」一节（默认 `npm test`、`npm run lint`、`npm run build:vscripts`，改 Panorama 加 `npm run build:panorama`），补上要求的 jest 用例。`git diff --name-only origin/develop...HEAD` 只含改动范围内的文件和带着修的小改动。

列测试视角：每条「目标」对应哪个 jest 用例或实机验证项，覆盖了哪些边界，缺的补上或写明为什么不补。

## 5. 提交与 PR

- commit 是单行英文标题，署名行按执行者：Claude 加 `Co-Authored-By`，没有 GitHub 账号的执行者不加（会显示成无效作者）
- `git push -u origin HEAD`，以 `git ls-remote origin <分支>` 与本地 HEAD 一致为准
- 按 `create-pr` 的格式开 PR，实机验证还没做就先带 `--draft`（`gh pr create --draft --base develop -R windy10v10ai/game`），验证与审查通过后立刻转正式。正文只写人做判断要看的关键信息，过程细节放进一条「验证记录」评论（之后更新用 `gh pr comment --edit-last`）。正文另加：
  - Issue 段：本 PR 是该 issue 唯一的 PR 时一律写 `- Fixes #<id>`（行首带 `- `，GitHub 会自动显示 issue 标题）；有跳过或没验到的项写进「待你决定」，用户合并就是认可，issue 随合并关闭。只有 issue 拆成多个 PR 时才写 `- #<id>`
  - 影响玩家的数值、档位、等级用表格列出
  - Checklist：「验收」每一条与执行说明「实机验证」的每一项
  - 「实现思路」一节：一张 SVG 前后示意图（左改前、右改后，改前橙、改后蓝，样例 PR #2725 的 `mechanism.svg`），图里只用白话名，图下只有一行代码名对照。顶部一句话已说明改了什么和玩家影响，图下不再重复文字；没有机制变化的纯文案、数值改动不画。图在 PR 创建后按 `create-pr/references/screenshots.md` 推到 `assets` 分支 `pr/<PR 编号>/`，再 `gh pr edit` 写进正文
  - 验证记录评论写：测试视角、每条验收命令与结果
  - 「等你处理」：「待你决定」（挡合并）「发版前」（合并后写进 release PR，四种写法见 `agent-issue.md`「写进 release PR」）两组，每条 checkbox 一句话写清看什么、选什么，都空写「无」；放在正文最下方「验收结果」一节的结论之后，不单独成节
  - 按默认做的取舍、顺手改动各写一句，放在「等你处理」之前，不用用户处理
  - Release Note 按 issue 正文的「Release Note」一节：「不写」删占位段，「要写」把要点原文贴进该段，不改写，第 10 步调用 `release-note`，不再问用户
- 执行说明「改动范围」写「无」的测量类 issue：不 commit、不开 PR，数据写进 issue 留言，报告格式见 `agent-issue.md`「从 L4 拆出测量子 issue」

## 6. 实机验证

按执行说明标的层级做，方法见 `dota-live-test`：

- **脚本判定**：临时 Lua 每项打印 `[check] PASS|FAIL <名字> actual=<值> expected=<值>`，预期值照执行说明抄，脚本放 `game/scripts/vscripts/checks/<名字>.lua`，用 `npm run dota:check -- <名字>` 跑，退出码 0 才算通过
- **截图判定**：照执行说明截图，只交图和截图时的状态，不写「通过 / 失效」，也不据截图改代码或文案，图按 `create-pr/references/screenshots.md` 放进 PR
- **用户判定**：不做，列进「等你处理」的「发版前」

验完在 PR 正文最下方（署名行之前）加「验收结果」一节，紧跟在「实现思路」之后，用 ✅ / ⚠️ 逐条简短报告每条验收的实测结果（改前、改后各是什么），性能对比图加每项一行结论，格式见 `dota-live-test` 的 `references/perf-bench.md`「报告格式」，节末先一句「结论」，再放「等你处理」（格式见第 5 步），并勾选全过的 Checklist 项，命令与 `[check]` 行原文写进验证记录评论。临时 Lua 验完删掉，不提交。

PR 正文按这个顺序且保持短（一屏能看完）：顶部一句话（做了什么、对玩家的影响）加 `- Fixes #<id>`；「实现思路」图；改动在界面上看得到时（新 buff、图标、文案、技能栏数字）的截图，自动拍并放进 PR，按 `create-pr/references/screenshots.md`，不等用户提醒；「验收结果」一张表加一句结论；「等你处理」；模板 Checklist 放进 `<details>` 折叠，Release Note 不折叠，直接放在正文最下方。偏差说明、性能表、脚本原文与逐项日志放进「验证记录」评论，不进正文。

PR 正文是用户判断的唯一入口，不靠对话补充：只看正文就要能知道改动思路和每条验收的实测结果。「实现思路」「验收结果」两节每个 PR 都必须有，没通过、没复现、没做的项也写进「验收结果」，写清现象与原因；实测中推翻了之前的判断（如复现场景改了）就整节改写，不留旧结论。第 6、9 步每次产生新数据或返工后，回报前先 `gh pr view` 核对正文与最新结果一致，不等用户催。

## 7. 收尾

停在 PR 分支，`git status --porcelain` 为空。回报：PR 链接、分支、每条验收命令的结果、测试视角、实机验证每项结论、「等你处理」各条。

## 8. 审一次

读 `.claude/skills/review-pr/SKILL.md`，按其中「自动模式」审：只看 PR（正文、评论里的验证记录、截图）、执行说明与设计 artifact，给出 PASS / NEEDS-FIX / NEEDS-DECISION。

审查者不是写这份代码的会话：

- 单条：执行者写的，主对话自己审。主对话自己写的，派审查子代理审
- 批量：一律派审查子代理审，主对话只调度

审查子代理的模型按根 `CLAUDE.md`「节约用量」，交接只给证据（PR 编号、执行说明来源、日志路径），回报限 400 字

## 9. 判定与返工

逐条判定审查发现，读日志原文与数字，不只看结论：

- **转正式**：审查通过且发现都已处理，就 `gh pr ready <编号> -R windy10v10ai/game`（会重跑 CI，CI 过了才算完成）。有「待你决定」跳过的部分，审查没过，或要用户拍板才能继续的，保持草稿并在回报里写明原因。只剩「发版前」的算做完，照常转正式
- 通过的勾掉 PR Checklist 对应项，要改的按「卡住时怎么办」处理，退回时交接只写要改的几条，同一 PR 最多退回两轮，返工后 PR 正文与验证记录直接更新成最新结果，不保留各轮过程
- 两轮仍不过：升级给能力更强的执行者接手同一个 PR 分支，交接写明 PR 链接、还没解决的几条、前两轮的失败原因，仍不过记为「待你决定」
- 审查发现按影响分流：注释、命名、重复代码、格式、文档同步、自己能核对的小疑点，只要不违反项目规定与用户要求，自己直接改完，不写进 PR、不在回报里提；只有影响玩家体验、系统架构、性能，或需要用户拍板的才进「等你处理」
- 精简 PR 的「等你处理」成只含用户本人要做的事，每条一句话写清看什么、选什么：
  - 留在「待你决定」：不满足合并条件的项
  - 留在「发版前」：「用户判定」层的实机项、玩家看得到且用户可能想改的默认取舍、上线后才能核对的事、严重问题
  - 删：执行说明已定的事、与本 PR 无关的工具问题、测试过程细节与日志噪音、重复条目
  - 自己补：能补验的截图项（悬停、点击后截图）退回补做，不留给用户

## 10. 合入 develop

没有 PR 的测量类 issue 跳过本步。其余按 `agent-issue.md`「合入 develop」逐条核对合并条件，有一条不成立就不合并，停在这里回报原因。

全部成立时依次做：

1. 不论 Release Note 写不写，先按 `release-note` 第 1 步「同步 `GAME_VERSION`」核对，不一致就改成目标版本，提交进该 PR 并等 CI 重跑；已一致就跳过。聚合 release PR 还没创建、且 issue 正文 Release Note 要写时，再调用 `release-note`（来源：该 PR，写回：「仅写入功能 PR」），要点以该节为准，不另拟
2. 按「合入 develop」的命令等 CI 并合并
3. 合并后读一次 release PR 正文，一次改完两节：「Release Note」节（要写且还没写入的，调用 `release-note`，写回：该节定的写回方式；版本号已在第 1 步处理，这里不再改代码）和「Checklist」节（「发版前」各条追加）
4. 按 `.claude/references/git-workflow.md`「合并与清理」删本地分支，主目录回到 `develop`；在 worktree 里做的，先 `cmd //c rmdir <path>/node_modules` 拆掉链接再删 worktree

完成条件：PR 已合并、「发版前」各条都在 release PR 的 Checklist 里、主目录在 `develop` 且干净；或 PR 开着且「等你处理」写明了不合并的原因。

## 已知陷阱

- **本地 `npm test` 扫到别的 worktree**：jest 会扫进 `.agents/worktrees/` 下其他 PR 的代码，那里的失败与本分支无关，以 CI 为准
- **换英雄后特效显示红色 X**：克隆原版技能装到别的英雄上时，原版只随本英雄预加载的特效不会加载。要在抽选 KV 的技能块加 `precache`，特效路径在原版 KV 里查不到时，到 `game/dota/pak01_dir.vpk` 的目录里按名字找
- **删 worktree 前先查 `node_modules` 是不是指向主目录的链接**：`git worktree remove` 可能顺着链接把主目录依赖一并清空
