---
name: review-pr
description: 按本仓库历史 review 标准审查 PR 或分支。
disable-model-invocation: true
---

# PR Review

## 流程

1. **输入**：PR 号或分支名。问用户要不要 checkout；要的话按 `references/checkout.md`
2. **出报告**：按下方标准审阅，从用户视角说明实现了什么、实现方式是否合规、有没有过度设计或冗余测试。对话里完整展示，同时落盘 `docs/review/pr-<PR号>.md`（没有 PR 号用 `review-<分支名>.md`，目录已 gitignore）
3. **更新日志**：先用一两句复述本次改动对玩家的实际影响，再查聚合 release PR（`gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`）的 body 里有没有这次的条目。缺失时问用户是否补写与轨道，同意则调用 `release-note`，参数写 PR 号、轨道与「仅写入聚合 release PR」。对玩家无感知的改动直接说明无需日志
4. **逐条确认**：报告里的问题逐条问用户要不要处理。不处理的在报告 md 里标「已确认忽略」及原因；用户补充的问题追加到「用户补充问题」小节，一并处理
5. **处理方式**：要处理的逐条问「自己修改」（在当前分支直接改）还是「comment 到 PR」（按输出规范提交）

完成：报告里每个问题都有了处理结论（修改 / comment / 已确认忽略）。

## 判断标准

按本仓库历史 review 中出现频率排序。

1. **根因优先于表面修补**：定位到真实机制再说修法，指出根因位置。常见根因：`LinkLuaModifier` 未注册导致 modifier 从未生效、本地常量与引擎全局同名被遮蔽（`src/vscripts/CLAUDE.md`「TSTL 陷阱」）
2. **优先复用 Dota 原生机制**：为模拟效果手搓一整套状态同步/数值换算，是最易出 bug、最难维护的实现。即使能跑通也要问：有没有现成的原版技能机制、modifier 或项目 helper 可复用。性能上，声明大量属性字段或靠 `OnIntervalThink` 逐帧同步的自定义 Lua modifier，开销明显高于借壳原生 modifier
3. **测试有效性**：对照 `src/vscripts/CLAUDE.md`「测试与验证」，检查新增测试是真的验证了逻辑分支，还是字符串匹配或纯 mock 调用断言
4. **KV / 本地化一致性与去重**：格式按 `game/resource/CLAUDE.md`；多处硬编码的同一常量/价格（如出装 tier 的 cost 与 KV 的 ItemCost）收敛成单一来源；机制变更后失效的 KV 字段（如遗留的 `AbilityUnitTargetTeam`/`Flags`）一并清理
5. **大范围玩家侧影响分阶段验证**：全难度/全局机制或平衡改动，倾向建议先做成可选项或先在自定义模式验证
6. **Dota 专属正确性**：伤害标志位（`REFLECTION`、`NO_SPELL_AMPLIFICATION`）与技能增强的显式声明、防止数值被无限刷高的上限

**依赖升级 PR**（如 dependabot）另外说明：这个包是运行时依赖还是构建/测试用、被哪些环节用到；版本跨度与已知破坏性变更、安全公告；处理建议分三档——可直接合并（devDependency 或无破坏性的小升级）/ 建议测试后合并（影响构建产物或运行时）/ 需要修改后合并（项目代码依赖了旧行为）。

## 输出规范

- 先在对话里输出，用户明确指示后才用 `gh pr comment`（综述）或 inline 评论（定位到代码行）发布，不提交 APPROVE / REQUEST_CHANGES
- 按严重度排列，小问题点到即可，只有第 2 条这类架构分歧才用较强语气
- 没有实质性问题时给简短的正面确认
- 每个问题按「回复风格」的顺序讲：涉及的原版机制或改动前现状 → PR 改成了什么 → 问题 → 用户要做的动作
