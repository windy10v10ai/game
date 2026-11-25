---
name: review-pr
description: 审查 PR 或分支：做了什么、值不值得合入、会不会卡。
disable-model-invocation: true
---

# PR Review

取材和「审什么」两节对所有入口相同，入口只决定产出去哪：

| 入口 | 谁触发 | 报告 | PR 评论 | 提问 |
|---|---|---|---|---|
| 手动 | 用户给出 PR 或分支 | 发 Artifact，在评论里答疑 | 用户明确说了才发 | 要用户拍板的逐项问 |
| 自动模式 | `issue-impl` 第 8 步、`issue-autorun` 审执行者开的 PR | 结论交回调度员 | 不发 | 不问 |

## 取材

- 读 PR 正文与评论（`gh pr view <pr> -R windy10v10ai/game --comments`，含「验证记录」评论与截图）、`gh pr diff`、`gh pr checks`、提交列表
- 需求以关联 issue 的正文（要求、验收）和附件为准：`gh issue artifact list <issue>` / `view` 读「设计」「执行说明」
- 不动主目录的 checkout。CI 没跑过的 PR（fork 来的首次贡献不会自动跑）派最便宜档 SubAgent 在临时 worktree 里验证：`git fetch origin pull/<PR号>/head:<本地分支>`、`git worktree add`、借主目录的 `node_modules`（见 `.claude/references/git-workflow.md`「worktree 与 node_modules」），依次跑 `npm run build:vscripts`、`npm run build:panorama`、`npm run lint`、对改动文件 `npx prettier --check`、`npm test`。带回每条通过或失败、失败的关键错误行、落后 `develop` 的提交数，跑完删掉 worktree 和本地分支
- 外部贡献者的 PR（`gh pr view --json isCrossRepository` 为 true）另外核对：issue 下有没有维护者同意、PR 模板填了没有

完成：diff 全文读过，编译、lint、测试都有通过或失败的结论（来自 CI 或本地验证）。

## 审什么

### 代码

1. **根因优先于表面修补**：定位到真实机制再说修法，指出根因位置。常见根因：`LinkLuaModifier` 未注册导致 modifier 从未生效、本地常量与引擎全局同名被遮蔽（`src/vscripts/CLAUDE.md`「TSTL 陷阱」）
2. **优先复用 Dota 原生机制**：为模拟效果手搓一整套状态同步/数值换算，是最易出 bug、最难维护的实现。即使能跑通也要问：有没有现成的原版技能机制、modifier 或项目 helper 可复用
   - 先查 `docs/reference/<version>/heroes/` 里相关原版技能的 `AbilityValues` 和天赋说明文字：原版已有开关或数值能表达的效果，建议用 KV special bonus 行打开（写法见 `awaken-ability` 的 `references/advanced-techniques.md`「进阶 4」），不自写脚本
   - 为改一个数值声明 `MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL(_VALUE)` 的，持有者每次读任何技能数值都回调 Lua，能改成 KV special bonus 行、或对产物 modifier 直接 `SetDuration` 的要指出。同时核对它改的值是不是本来就等于默认值
3. **卡顿**：PR 新增的每个 Lua modifier 逐个过一遍，常驻的、临时 buff、几帧就消失的都算，各写清挂在谁身上、最多几个实例、每个回调多久跑一次。能用原版 modifier 或 KV 的要指出，按规定该跑性能基准而没跑的要指出（见 `src/vscripts/CLAUDE.md`「写技能、物品、modifier」）
4. **按命中自动触发的效果算峰值**：每命中一个单位就代为施放一次技能、打一次普攻或播一次特效的，估算一次施法最多触发多少次（穿过兵线、神杖范围版叠加），没有限英雄、限次数或触发冷却的要指出
5. **数值上限**：防止数值被无限刷高。属性按比例转成另一种加成的（如敏捷转技能增强），按本图后期几千点属性算一个例子，同一属性在一次伤害里被算两遍的要指出。伤害标志位（`REFLECTION`、`NO_SPELL_AMPLIFICATION`）与技能增强要显式声明
6. **界面定时器与键位**：Panorama 里新增的 `setInterval` 对所有玩家的客户端都跑，只服务某个英雄的要先判断本地英雄再启动。写死键位的对照现有改键设置，会顶掉玩家自己键位的要指出
7. **KV / 本地化一致性与去重**：格式按 `game/resource/CLAUDE.md`；多处硬编码的同一常量/价格（如出装 tier 的 cost 与 KV 的 ItemCost）收敛成单一来源；机制变更后失效的 KV 字段（如遗留的 `AbilityUnitTargetTeam`/`Flags`）一并清理
8. **大范围玩家侧影响分阶段验证**：全难度/全局机制或平衡改动，倾向建议先做成可选项或先在自定义模式验证

### 测试与证据

- **测试有效性**：每条目标都有 jest 用例或实机验证项对应，边界和易错处有覆盖。对照 `src/vscripts/CLAUDE.md`「测试与验证」，新增测试要真的验证了逻辑分支，不是字符串匹配或纯 mock 调用断言
- **证据与结论一致**：PR 里每条「通过」「已完成」都有出处（CI 结果、命令与 exit code、`[check]` 原文与数字）。测试通过以 CI 为准，推送以远端 SHA 为准。没有实机验证记录的，把读代码确认不了的点逐条列成待实测
- **截图**：打开每张图，对照设计或执行说明写的正确画面判定，PR 里的文字描述不算结论

### 范围

- 实现与「设计」「执行说明」一致，偏离的地方逐条指出
- 只改了该改的范围，与功能无关的改动要指出（按 `issue-impl` 做的 PR，范围外只允许 `agent-issue.md`「顺手发现的问题」里的小改动）
- 没有改测试迁就代码、删用例

### 依赖升级 PR

如 dependabot，另外说明：这个包是运行时依赖还是构建/测试用、被哪些环节用到；版本跨度与已知破坏性变更、安全公告；处理建议分三档——可直接合并（devDependency 或无破坏性的小升级）/ 建议测试后合并（影响构建产物或运行时）/ 需要修改后合并（项目代码依赖了旧行为）。

## 手动入口的产出

### 1. 报告

用 `Artifact` 工具发布 HTML，按这个顺序：

1. **结论**：值不值得合、卡不卡、最大的问题是什么，各一句
2. **它做了什么**：从玩家视角讲，数值按等级列表
3. **卡顿评估**：一张表，一行一块新增逻辑，列「多久跑一次」与判断。数字是读代码估算的要写明是估算。不涉及游戏逻辑的 PR 省掉这一节
4. **其他问题**：每条写是什么、对玩家的影响、建议，要用户拍板的排最前。没问题的项不展开
5. **接下来**

### 2. 在 Artifact 评论里答疑

用户会在报告上划词评论提问，用 `ArtifactComments` 在该评论串里回答。

- 评论指出报告漏了东西，或用户在评论里定了方向：改报告并重新发布，再回复
- 问题答完或改动做完、没有留给用户决定的事：回复后直接 `resolve` 该评论串
- 还有待用户决定的事：回复里写明等什么，留着不关

### 3. 定方案

用户开始给修改方向（改数值、换实现方式）时：

- 用户在两个做法之间征求意见，给出推荐，并用一组后期属性算出两种做法的对比数字
- 定下的每一项记进报告顶部的「已定的修改方向」表，列：改什么、原来、改成、还要确认
- 本机验证不了的前提（Dota Tools 只能在 Windows 上跑）写成待实测，同时写出前提不成立时的退路

完成：报告里每个问题都有了结论（已定方向 / 待实测 / 不处理）。

### 4. 落地

怎么落地由用户定，用户明确说了才做：

- **自己改**：要在 PR 分支上直接改时按 `references/checkout.md` 取分支
- **回复到 PR**：按 `references/publish.md` 把方案挂到 issue、在 PR 上发评论
- **合并前查更新日志**：用一两句复述本次改动对玩家的实际影响，再查聚合 release PR（`gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`）的 body 里有没有这次的条目。缺失时按 `.claude/references/release-version.md` 算出目标版本，问用户是否补写，同意则调用 `release-note`，参数写 PR 号、目标版本与「仅写入聚合 release PR」。对玩家无感知的改动直接说明无需日志

## 自动模式

取材与「审什么」同上，不 checkout、不发 Artifact、不发 PR 评论、不问用户。结论交回调度员：

- PASS / NEEDS-FIX / NEEDS-DECISION 三选一
- 逐条发现带 `file:line`（截图写图名与看到的画面）与严重度
- 测量类 issue（不开 PR）审留言与报告：每个数字有出处，局数和步骤与执行说明一致，结论没有超出数据
