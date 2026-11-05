---
name: issue-spec
description: 和用户一起给某个 issue 定 spec，写成 issue 正文（背景、目标、要求、验收、Release Note、执行说明）交给 agent 自动做；或处理 agent 做完、卡住后留下的问题。
---

# issue-spec

用户在场时，和用户把一个 issue 的做法谈定，把 issue 正文整理成 `agent-issue.md`「issue 正文结构」那几块，执行说明写成 Markdown artifact 挂到 issue，并打 `agent-todo`，留给 `issue-autorun` 在用户不在时自动做。只定到 spec 为止，不写实现计划、不改代码（前提探针用临时脚本，验完删）。标签与正文结构见 `.claude/references/agent-issue.md`，字段与项目配置见 `.claude/references/issue-fields.md`，开始前先读这两份。

用户给的不是 issue 而是一句想法时，先查重再新建：

1. 搜已有 issue（含已关闭的）：`gh issue list -R windy10v10ai/game --state all --search "<关键词>" --limit 20`，换两三个关键词各搜一遍。有相近的就告诉用户并接着谈那一条，不新建
2. 没有再新建：`gh issue create -R windy10v10ai/game --title "<想要的结果>" --body "<一句背景>"`，标题按 `agent-issue.md`「issue 标题」写。用 `issue-fields.md` 的命令把它补进项目，Status 放 Plan，并问用户放 Plan 栏的哪个位置（想先谈就放最上面）
3. 接着从第 0 步补齐字段

用户没指定 issue 也没给想法时，从项目 Plan 栏最上面那条开始，Plan 栏的上下顺序就是用户想先谈的顺序。

## 0. 补齐 issue 字段

只看当前这条 issue，缺哪项补哪项，已有的不动，不跑整批 triage。按 `issue-fields.md` 检查 Type、Priority、Effort、仓库标签、项目 Status，查询与设置命令都在那里。缺项按 issue 内容给建议值，随第 2 步一并让用户确认后再设。

完成条件：Type、Priority、Effort、标签、项目 Status 都有值。

## 1. 读懂 issue

读 issue 正文、评论、关联的 issue / PR，再读相关代码，读到能说清「现在是什么样、要改成什么样」为止。

判断是否适合交给 agent（标准见 `agent-issue.md`「适合交给 agent 的 issue」）。原因不明但再现步骤写得出来的算适合，第 3 步写「步骤」并在定位后设停点。要做设计取舍或评估、写不出固定步骤的不适合，告诉用户原因，打 `L4-investigate`，留给用户在场时用最强档模型做。其中能写成固定步骤的测量或验证，和用户商量拆成子 issue（见 `agent-issue.md`「从 L4 拆出测量子 issue」），子 issue 按本 skill 从第 2 步定 spec，父 issue 到此结束。

完成条件：能用一两句话复述目标，并已判断适合交给 agent。

## 2. 和用户谈定

一次只谈一个问题。按问题的复杂度选载体：

- **简单的选择题**（2–3 个选法、一句话能说清）：用 `AskUserQuestion`，标出推荐
- **复杂的问题**（要看数据流、多层改动、几个方案要对比、数值表、界面布局、流程分支）：不用文字来回问，用 `Artifact` 工具发布一页 HTML 和用户谈，页面里画流程图、方案对比表、改动前后对比，边谈边改。页面排版先读 `artifact-design` skill

谈的内容重点：

- 做法的选型（复用原版 / KV / 新写代码）
- 改动范围：列得出具体文件或目录
- 不做什么：相关但这次不做的改动
- 要补哪些 jest 用例
- 目标能否拆成几条互不依赖的小项，让 agent 卡在一条时能跳过它继续做别的
- 方案依赖的引擎行为或读数：还没实测过的，打 `agent-todo` 前先跑探针；用户不在跑不了或太久的，定好不成立时走哪条后备
- 实机环境跑不通时怎么判，以及哪些项要用户试玩（发版前写进 release PR 的 Checklist）

能从代码或项目规则直接得出的不问，直接写进草稿。用户在对话里亲口拍板的，记下来，第 3 步写进「要求」。

完成条件：每一项都有答案，不留「待定」。按 `agent-issue.md`「合入 develop」逐条预演：每条验收都说得出 AI 怎么判对错，判不了的已定死或归用户判定，前提不成立、环境跑不通时都有去处，agent 做完不用问用户就能决定合不合并。

## 3. 写入 issue

标题按 `agent-issue.md`「issue 标题」改成想要的结果，不是具体指令。

正文按 `agent-issue.md`「issue 正文结构」写：背景、目标、要求、验收、步骤（分阶段才写，格式见 `agent-issue.md`「步骤与停点」）、Release Note，写得最短；执行说明不进正文，写成 Markdown artifact「执行说明」，正文最后只放一行它的压缩链接。

- **要求**只写用户亲口拍板的，一条一行。AI 自己推断、按默认定的取舍写进执行说明并标「建议」
- **验收**用白话写怎么判对错，命令与用例放执行说明
- **Release Note** 要写时放进当前 release PR 的版本块里通读（规则见 `release-note`「写条目」），和用户对到定稿，格式同 PR 模板（中文块、英文块、写回方式）
- 写入前逐项核对正文与执行说明里的数值（范围、倍率、门槛）。两边不一致时把两个数都摆给用户定，不自己选
- 实机验证逐项标层级（「实机验证分三层」）：能脚本判定的写出预期值，截图判定的写出正确画面，剩下的才归用户

给用户确认时不贴全文，只列三组重点：用户拍板的（即「要求」）、按默认做的（附「不同意就说」）、实机验证要读什么；全文写进 issue 后给链接。

第 2 步用过讨论页的，定稿后按 `.claude/references/doc-writing.md`「设计 spec」把 HTML「设计」也挂到 issue（给人看），设计里和实现有关的结论要写进「执行说明」（见 `agent-issue.md`「设计 artifact」）。

要拆成几批时，每批开一个子 issue，按 `agent-issue.md`「子 issue」挂到父 issue 下，各自写完整正文。

用户确认后写进 issue：正文用 `gh issue edit --body-file`，执行说明先建 artifact 再把链接写进正文（已有同名块时整块替换，旧 issue 正文里的执行说明迁进 artifact，内容保留），再打标签：

```bash
gh issue artifact create <n> -R windy10v10ai/game '<文件>.md#执行说明'   # 已有时用 edit <n> <编号> --body-file
gh issue edit <n> -R windy10v10ai/game --body-file <文件>
gh issue edit <n> -R windy10v10ai/game --add-label agent-todo --add-label <L1-code|L2-script|L3-visual>
```

打完标签紧接着把项目 Status 改成 Todo 并挪到该栏最上面（`item-edit` 与 `updateProjectV2ItemPosition` 命令见 `issue-fields.md`「修改」「列内上下顺序」），这样 `issue-autorun` 下次开跑时它排在前面。条目还没入项目时先 `item-add`。

完成条件：issue 正文是用户确认过的新结构（背景、目标、要求、验收、Release Note，末尾一行执行说明链接），「执行说明」artifact 已挂上，带 `agent-todo` 与一个级别标签（判据见 `agent-issue.md`「级别标签」），项目 Status 是 Todo 且在该栏最上面。

## 处理 agent 留下的问题

用户要收拾 `issue-autorun` 的结果时：

- **`agent-done`，PR 还开着**：读 PR 正文的「等你处理」，逐条和用户过。「待你决定」的谈定后直接在该 PR 分支上补改，或写进「要求」另起一轮
- **release PR 的 Checklist**：逐条和用户过。不满意的在新分支上改，或写进新 issue
- **`agent-block`**：读 issue 下 agent 的留言。第一句是 `卡住：` 的，按第 2 步补齐缺的信息，更新正文后把标签换回 `agent-todo`。第一句是 `⏸ 停点：` 的，和用户过一遍留言里的结论，需要时调整后面的步骤，确认后直接换回 `agent-todo`

```bash
gh issue edit <n> -R windy10v10ai/game --remove-label agent-block --add-label agent-todo
```

完成条件：「等你处理」和 Checklist 的每一条都已勾掉或转成新的正文要求。
