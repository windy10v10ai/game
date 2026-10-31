---
name: review-pr
description: 按本仓库历史 review 标准审查 PR 或分支。
disable-model-invocation: true
---

# PR Review

## 流程

1. **输入**：PR 号或分支名。问用户要不要 checkout；要的话按 `references/checkout.md`。PR 关联的 issue 挂有「设计」artifact 时先读（`gh issue artifact list <issue>` / `view`），报告里指出实现偏离设计的地方
2. **出报告**：按下方标准审阅，从用户视角说明实现了什么、实现方式是否合规、有没有过度设计或冗余测试。对话里完整展示，同时落盘 `docs/review/pr-<PR号>.md`（没有 PR 号用 `review-<分支名>.md`，目录已 gitignore）
3. **更新日志**：先用一两句复述本次改动对玩家的实际影响，再查聚合 release PR（`gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`）的 body 里有没有这次的条目。缺失时按 `.claude/references/release-version.md` 算出目标版本，问用户是否补写，同意则调用 `release-note`，参数写 PR 号、目标版本与「仅写入聚合 release PR」。对玩家无感知的改动直接说明无需日志
4. **逐条确认**：报告里的问题逐条问用户要不要处理。不处理的在报告 md 里标「已确认忽略」及原因；用户补充的问题追加到「用户补充问题」小节，一并处理
5. **处理方式**：要处理的逐条问「自己修改」（在当前分支直接改）还是「comment 到 PR」（按输出规范提交）

完成：报告里每个问题都有了处理结论（修改 / comment / 已确认忽略）。

## 自动模式

`issue-impl` 第 8 步审草稿 PR 时用（含 `issue-autorun` 审执行者开的 PR）。不问用户、不 checkout、不发 PR 评论、不写报告文件，跳过上面流程的第 3–5 步，结论交回调度员：

- **读什么**：只看 PR 本身——`gh pr view <pr> -R windy10v10ai/game --comments`（正文、「验证记录」评论、截图）、`gh pr diff`、`gh pr checks`；需求以关联 issue 的执行说明与「设计」artifact 为准
- **审什么**：
  - 代码：下方「判断标准」
  - **测试视角**：每条目标都有 jest 用例或实机验证项对应，边界和易错处有覆盖
  - **证据与结论一致**：每条「通过」「已完成」都有出处（CI 结果、命令与 exit code、`[check]` 原文与数字）。测试通过以 CI 为准；推送以远端 SHA 为准
  - **截图**：打开每张图，对照执行说明写的正确画面判定，PR 里的文字描述不算结论
  - **范围与降标**：只改了改动范围；没有改测试迁就代码、删用例；预期值与执行说明一致；做法与执行说明「做法」一致
- **结论**：PASS / NEEDS-FIX / NEEDS-DECISION，逐条发现带 `file:line`（截图写图名与看到的画面）与严重度。测量类 issue（不开 PR）审留言与报告：每个数字有出处，局数和步骤与执行说明一致，结论没有超出数据

## 判断标准

按本仓库历史 review 中出现频率排序。

1. **根因优先于表面修补**：定位到真实机制再说修法，指出根因位置。常见根因：`LinkLuaModifier` 未注册导致 modifier 从未生效、本地常量与引擎全局同名被遮蔽（`src/vscripts/CLAUDE.md`「TSTL 陷阱」）
2. **优先复用 Dota 原生机制**：为模拟效果手搓一整套状态同步/数值换算，是最易出 bug、最难维护的实现。即使能跑通也要问：有没有现成的原版技能机制、modifier 或项目 helper 可复用。性能上，新增的 Lua modifier（尤其常驻在每个英雄或建筑上的）即使逻辑很少也会拖慢每次伤害结算，能用原版 modifier 或 KV 的要指出（见 `src/vscripts/CLAUDE.md`「写技能、物品、modifier」）。为改一个数值声明 `MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL(_VALUE)` 的，持有者每次读任何技能数值都回调 Lua，能改成 KV special bonus 行、或对产物 modifier 直接 `SetDuration` 的要指出
3. **测试有效性**：对照 `src/vscripts/CLAUDE.md`「测试与验证」，检查新增测试是真的验证了逻辑分支，还是字符串匹配或纯 mock 调用断言
4. **KV / 本地化一致性与去重**：格式按 `game/resource/CLAUDE.md`；多处硬编码的同一常量/价格（如出装 tier 的 cost 与 KV 的 ItemCost）收敛成单一来源；机制变更后失效的 KV 字段（如遗留的 `AbilityUnitTargetTeam`/`Flags`）一并清理
5. **大范围玩家侧影响分阶段验证**：全难度/全局机制或平衡改动，倾向建议先做成可选项或先在自定义模式验证
6. **按命中自动触发的效果算峰值**：每命中一个单位就代为施放一次技能或播一次特效的，估算一次施法最多触发多少次（穿过兵线、神杖范围版叠加），没有限英雄、限次数或触发冷却的要指出
7. **Dota 专属正确性**：伤害标志位（`REFLECTION`、`NO_SPELL_AMPLIFICATION`）与技能增强的显式声明、防止数值被无限刷高的上限

**依赖升级 PR**（如 dependabot）另外说明：这个包是运行时依赖还是构建/测试用、被哪些环节用到；版本跨度与已知破坏性变更、安全公告；处理建议分三档——可直接合并（devDependency 或无破坏性的小升级）/ 建议测试后合并（影响构建产物或运行时）/ 需要修改后合并（项目代码依赖了旧行为）。

## 输出规范

- 先在对话里输出，用户明确指示后才用 `gh pr comment`（综述）或 inline 评论（定位到代码行）发布，不提交 APPROVE / REQUEST_CHANGES
- 按严重度排列，小问题点到即可，只有第 2 条这类架构分歧才用较强语气
- 没有实质性问题时给简短的正面确认
- 每个问题按「回复风格」的顺序讲：涉及的原版机制或改动前现状 → PR 改成了什么 → 问题 → 用户要做的动作
