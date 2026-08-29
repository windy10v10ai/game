---
name: review-pr
description: >-
  review 一份 PR/代码改动时使用的判断标准清单，从本仓库历史上大量实质性 review
  评论中提炼。当用户说"review 一下这个 PR"「检查一下这份改动」「这个 PR 有没有问题」
  「按我们的标准看看这段代码」等时触发。
---

# PR Review 流程

1. **输入**：用户给出 PR 号或分支名。
2. **确认 checkout**：询问是否需要切换。需要时只 fetch 目标分支，同时保留向原 PR 分支 push 的能力：
   - 有 PR 号：先用 `gh pr view <PR号> --json headRefName,headRepository,headRepositoryOwner` 取得 PR head 分支与仓库 URL。
   - 为该 PR 使用独立 remote（如 `review-pr-<PR号>`），用 `git remote add --no-tags -t "<headRefName>" "review-pr-<PR号>" "<headRepositoryUrl>"` 把 fetch refspec 限定为该分支，再执行 `git fetch --no-tags "review-pr-<PR号>"`。**禁止**使用带 `+refs/heads/*` 的作者 fork remote，也不要使用会创建这种通配 remote 的 `gh pr checkout`；本地 Git 自动同步可能因此拉取整个 fork。
   - 从 `review-pr-<PR号>/<headRefName>` 创建**同名本地分支**并设置 upstream；同名可让修改后直接 `git push` 回原 PR 分支。若本地同名分支或同名 review remote 已存在，先检查 URL、upstream 和工作区状态，不得直接覆盖或删除。
   - checkout 后用 `git config --get-all remote.review-pr-<PR号>.fetch` 验证只存在 `+refs/heads/<headRefName>:refs/remotes/review-pr-<PR号>/<headRefName>`，并用 `git for-each-ref refs/remotes/review-pr-<PR号>` 确认只有目标分支。
   - PR 完成且不再需要 push 后，可询问用户是否执行 `git remote remove review-pr-<PR号>` 清理该 PR 的 remote-tracking ref；本地修改分支不随 remote 删除。
   - 只有分支名（同仓库）：`git switch <branch>`。
3. **生成报告**：按下方判断标准审阅改动，从用户视角说明实现了什么功能、实现方式是否符合规范、是否有过度设计或冗余测试值得简化。同时：
   - 在对话中完整展示
   - 落盘为 `docs/review/pr-{PR号}.md`（没有 PR 号时退化为 `docs/review/review-{分支名}.md`）；`docs/review/` 已加入 `.gitignore`，报告不进版本控制
4. **逐条确认**：按报告列出的问题逐条询问用户是否需要处理。
   - 用户选择不处理的条目，回写进报告 md，标注为「已确认忽略」及原因
   - 用户额外指出报告未列出的问题，追加进报告 md 的独立小节「用户补充问题」，标注为「用户补充，Claude 未发现」，并入下一步逐条处理
5. **选择处理方式**：对确认要处理的问题（含用户补充的），逐条询问用户选择「自己修改」还是「comment 到 PR」：
   - 自己修改：在当前 checkout 的分支上直接编辑
   - comment 到 PR：按下方输出规范用 `gh pr comment` 或 inline 行内评论提交
6. **追加反馈日志**：把本次「已确认忽略」和「用户补充」的条目分别标注所属判断标准分类（对应下方 1-6 或"依赖升级"；不属于任何现有分类的标「新增」），追加到 `docs/review/_feedback-log.md`（同样已 gitignore）：日期、PR/分支、类别、决策（忽略/补充）、简述。
7. **触发自我优化**：追加后检查该日志——同一分类被连续忽略 ≥3 次，或用户补充问题在同一分类下出现 ≥2 次，调用 `doc-update` skill，提议调整本 SKILL.md 的判断标准（新增条目 / 调整表述或优先级 / 降低过时条目权重），经用户确认后写入。

# PR Review 判断标准

按本仓库历史 review 中出现频率排序，越靠前越是反复强调的立场。

## 1. 根因优先于表面修补

遇到 bug 先定位到真实机制，说明机制而不是只描述症状修复。常见根因类别：`LinkLuaModifier` 未注册导致引用的 modifier 从未生效、本地常量与 Dota 引擎全局同名被词法遮蔽（见 CLAUDE.md「本地常量不要与 Dota 引擎全局同名」）。发现类似问题时优先指出根因位置，而不是停留在"这里应该改成 X"。

## 2. 优先复用 Dota 原生机制，警惕自造平行逻辑

为模拟某个效果而手搓一整套状态同步/数值换算逻辑，是最容易出 bug、最难排查、维护成本最高的一类实现。看到这类代码时应该问：有没有现成的原版技能机制、modifier、或已有的项目内 helper 可以复用，而不是重新平行实现一遍。这类问题值得在评论里明确指出，即使已经能跑通。

性能是另一层代价：自定义 Lua modifier 若声明大量属性字段、或靠 `OnIntervalThink` 逐帧检测同步状态，开销明显高于可直接借壳复用的 Dota 原生 modifier。review 时对这类实现要多问一句能否换成原生 modifier，而不是止步于"能跑通"。

## 3. 测试有效性

判断标准见 CLAUDE.md「测试」章节（只测自身分支/计算逻辑，不测引擎契约）。review 时对照该标准检查新增测试是否真的验证了逻辑分支，还是只是字符串匹配或纯 mock 调用断言。

## 4. KV / 本地化一致性与去重

- KV 字段对齐用 tab 不用空格,颜色代码大写（见 CLAUDE.md「本地化文案规约」)
- 多处硬编码的同一个常量/价格（如 bot 出装 tier 配置的 cost 与 KV 的 ItemCost）应收敛成单一来源
- 机制变更后随之失效的 KV 字段（如目标选择方式改变后遗留的 `AbilityUnitTargetTeam`/`Flags`）要一并清理，不要留死配置

## 5. 大范围玩家侧影响需要分阶段验证

涉及全难度/全局机制变化或平衡改动时，倾向建议先做成可选项、或先在自定义模式下验证，而不是直接对所有玩家启用。

## 6. Dota 专属正确性 checkpoint

伤害标志位（`DamageFlag.REFLECTION`/`NO_SPELL_AMPLIFICATION` 等）与技能增强的显式声明、防止数值被无限刷高的上限设计，参见 CLAUDE.md「常见陷阱」里已有的对应条目。

## 依赖 / package 升级 PR

PR 是 `package.json` 依赖版本升级（如 dependabot 自动发起的 PR）时，除上述通用标准外还需要：

- 说明这个包在项目里的作用：运行时依赖还是仅用于构建/测试的 devDependency，被哪些模块/环节用到
- 评估升级风险：版本跨度（patch/minor/major）、有没有已知的破坏性变更或安全公告、是否影响构建产物或运行时行为
- 给出明确的处理建议，分档：
  - **可直接合并**：devDependency 或影响面很小的小版本/补丁升级，无破坏性变更
  - **建议测试后合并**：影响构建产物或运行时行为，或变更说明不够清晰，需要先跑一遍构建/游戏内验证
  - **需要修改后合并**：升级带来破坏性 API 变更，项目里有代码依赖了旧行为，需要同步改代码

## 输出规范

- 先在对话里输出 review 结果，不直接发布到 PR；只有用户明确指示发布时，才用 `gh pr comment`（顶层综述）或 inline 行内评论（定位到具体代码行，按问题需要选用）提交上去，且不提交正式的 APPROVE/REQUEST_CHANGES 状态——最终合并决定权在人工
- 简明，按问题严重度排列，不是逐行罗列的清单
- 小问题指出即可，不必要求对方大改；只有触及上面第 2 条这类架构层面的分歧才值得用较强语气标注
- 找不到实质性问题时给出简短的正面确认，不要为了写而写
- 表述遵循 CLAUDE.md「回复风格」：每个问题先交代涉及的原版机制或改动前现状，再说 PR 改成了什么，最后才是问题和用户要做的具体动作。不要整段堆函数名、变量名，代码名只在中文描述之后作补充
