---
name: issue-spec
description: 和用户一起给某个 issue 定 spec，写成 issue 正文（背景、目标、要求、验收、Release Note、执行说明）交给 agent 自动做；或处理 agent 做完、卡住后留下的问题。
---

# issue-spec

用户在场时，和用户把一个 issue 的做法谈定，把 issue 正文整理成 `agent-issue.md`「issue 正文结构」那几块，并打 `agent-todo`，留给 `issue-autorun` 在用户不在时自动做。只定到 spec 为止，不写实现计划、不改代码。标签与正文结构见 `.claude/references/agent-issue.md`，字段与项目配置见 `.claude/references/issue-fields.md`，开始前先读这两份。

## 0. 补齐 issue 字段

只看当前这条 issue，缺哪项补哪项，已有的不动，不跑整批 triage。按 `issue-fields.md` 检查 Type、Priority、Effort、仓库标签、项目 Status，查询与设置命令都在那里。缺项按 issue 内容给建议值，随第 2 步一并让用户确认后再设。

完成条件：Type、Priority、Effort、标签、项目 Status 都有值。

## 1. 读懂 issue

读 issue 正文、评论、关联的 issue / PR，再读相关代码，读到能说清「现在是什么样、要改成什么样」为止。

判断是否适合交给 agent（标准见 `agent-issue.md`「适合交给 agent 的 issue」）。不适合时告诉用户原因，打 `L4-investigate`，留给用户在场时用最强档模型做。其中能写成固定步骤的测量或验证，和用户商量拆成子 issue（见 `agent-issue.md`「从 L4 拆出测量子 issue」），子 issue 按本 skill 从第 2 步定 spec，父 issue 到此结束。

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

能从代码或项目规则直接得出的不问，直接写进草稿。用户在对话里亲口拍板的，记下来，第 3 步写进「要求」。

完成条件：每一项都有答案，不留「待定」。

## 3. 写入 issue

正文按 `agent-issue.md`「issue 正文结构」写：背景、目标、要求、验收、Release Note 放前面，写得最短；执行说明放最后，面向执行的 AI。

- **要求**只写用户亲口拍板的，一条一行。AI 自己推断、按默认定的取舍写进执行说明并标「建议」
- **验收**用白话写怎么判对错，命令与用例放执行说明
- **Release Note** 要写时和用户对到定稿，格式同 PR 模板（中文块、英文块、写回方式）
- 实机验证逐项标层级（「实机验证分三层」）：能脚本判定的写出预期值，截图判定的写出正确画面，剩下的才归用户

给用户确认时不贴全文，只列三组重点：用户拍板的（即「要求」）、按默认做的（附「不同意就说」）、实机验证要读什么；全文写进 issue 后给链接。

执行说明写不进一屏、要讲数据流或跨多层改动时，把第 2 步的讨论页定稿成设计文档：按 `.claude/references/doc-writing.md`「设计 spec」挂到 issue（HTML「设计」给人看、Markdown「设计文档」给 agent 读、链接备用），文档里包含执行说明的全部五项，issue 里的执行说明只留指向 Markdown 设计文档的一行（格式见 `agent-issue.md`「复杂 issue」）。

要拆成几批时，每批开一个子 issue，按 `agent-issue.md`「子 issue」挂到父 issue 下，各自写完整正文。

用户确认后写进 issue 正文（已有同名块时整块替换，旧 issue 的 `## 执行说明` 也按新结构重排，原有内容保留），再打标签：

```bash
gh issue edit <n> -R windy10v10ai/game --body-file <文件>
gh issue edit <n> -R windy10v10ai/game --add-label agent-todo --add-label <L1-code|L2-script|L3-visual>
```

完成条件：issue 正文是用户确认过的新结构（背景、目标、要求、验收、Release Note、执行说明，或执行说明指向用户确认过的设计文档），带 `agent-todo` 与一个级别标签（判据见 `agent-issue.md`「级别标签」）。

## 处理 agent 留下的问题

用户要收拾 `issue-autorun` 的结果时：

- **`agent-done`**：读 PR 正文的「等你处理」，逐条和用户过。「请确认」的确认或改掉；「待你决定」的谈定后直接在该 PR 分支上补改，或写进「要求」另起一轮
- **`agent-block`**：读 issue 下 agent 的留言，按第 2 步补齐缺的信息，更新正文后把标签换回 `agent-todo`

```bash
gh issue edit <n> -R windy10v10ai/game --remove-label agent-block --add-label agent-todo
```

完成条件：「等你处理」的每一条都已勾掉或转成新的正文要求。
