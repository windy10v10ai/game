# 英雄改动同步

按 `SKILL.md`「英雄改动」展开。样例是 7.42 同步：主 issue `windy10v10ai/game#2790`，它的两个 artifact「执行说明」「摸底分类」（`gh issue artifact view 2790 1|2 -R windy10v10ai/game`）和 C 类子 issue 可对照。

## 1. 英雄清单（手工）

1. 读 `docs/reference/<版本>/patchnotes_schinese.md`「英雄改动」一节，摘出出现的英雄（部分条目是英文原文，没翻译成中文，别漏）
2. 每名对应 `npc_dota_hero_*`，英雄名与 ID 查 `docs/reference/<版本>/abilities_schinese.txt` 或 `heroes/` 文件名
3. 排除 `override_hero` 宿主原版：技能由本图自己的 override 实现，不在核对范围，在 issue 正文里点名说明
4. 写成主 issue 正文的勾选清单，每行 ``- [ ] **中文名** · `npc_dota_hero_x` ``。同一英雄有附属单位（如熊灵）时行尾注明

## 2. 摸底分类

只读，派最便宜档。按清单分 4 组并行，同时最多 2 组。

分类只看「本图要不要动手、动手要不要判断」，不看官方改动大小。英雄总分类取最高类（C > B > A）。

| 类 | 含义 | 处理 |
|---|---|---|
| A | 本图没有触点，新版直接继承。官方机制改动只要本图没覆盖没引用，也是 A | 不改，直接勾掉 |
| B | 照规则机械同步：覆盖文件写了被改的键，键被删除或改名，天赋 key 替换或槽位变化只影响 `npc_heroes_custom.txt`，`npc_heroes_custom.txt` 覆盖了被改的基础属性 | 按批自动同步 |
| C | 本图觉醒、自制、克隆、抽奖技能，电脑施法规则，TS / Lua 代码依赖被改行为，或覆盖值与新机制冲突 | 子 issue，先定方向再改 |

抽奖池只是列出技能名（`lottery-abilities.ts` 的池子）不算依赖，只有抽奖克隆的 `BaseClass` 指向该技能才归 C。

要查的触点：

- `game/scripts/npc/npc_abilities_override.txt`
- `game/scripts/npc/npc_heroes_custom.txt`
- `game/scripts/npc/npc_abilities_custom_awaken.txt`
- 克隆了该英雄技能的抽奖技能、塔技能（做法见 `SKILL.md`「克隆技能与物品」）
- `game/scripts/npc/npc_abilities_custom.txt`
- `game/scripts/npc/npc_abilities_custom_lottery.txt`
- `src/vscripts/ai/ability/specs/`
- `src/vscripts/` 里按技能名 grep
- `herolist.txt` 确认该英雄在本图启用

产出挂成主 issue 的 artifact「摸底分类」，每名英雄一节，表格列：官方改动、系统名与键、旧值到新值、本图触点、分类、理由。A 类在 issue 里直接勾掉，并留一条「维护者复核 A 类」待办，维护者认为判错的取消勾选并改回 B 或 C。

摸底是初步分类，B 批执行者以自己核对为准。

## 3. 执行说明

另挂 artifact「执行说明」（Markdown，格式见 `.claude/references/agent-issue.md`），写：分类口径、A / C 名单、B 类分批表、每批流程、并行规则、C 类子 issue 与已定方向、更新日志安排。

## 4. B 类按批同步

第 1 批约 8 名试跑，挑能覆盖这几种情况的英雄：天赋替换、数值在 `AbilityValues` 子块、日志与参考可能对不上。之后每批约 10 名。

每批流程：

1. 从最新 `develop` 切 `feature/<issue>-sync-<版本>-heroes-b<批号>`
2. 执行者（主力档）按 `update-abilities-override`「补丁日志同步」自动模式同步数值，再按 `update-bot-hero-build` 校验 `Bot.Build`。本批只改 `npc_abilities_override.txt`、`npc_heroes_custom.txt`，需要时含本地化。觉醒、自制、抽奖技能和 `src/vscripts/` 不碰，发现要改的写进 PR「需要机制处理（未改）」
3. `npm test`、`npm run lint` 通过
4. 开正式 PR，正文首行 `- #<issue>`，不写 Release Note
5. 只读审查（主力档）：改动与日志、参考是否一一对应，有没有冲掉本图有意改的值，待确认有没有漏报、自动判定有没有把真正的设计取舍当成规则题，顶层与 `AbilityValues` 子块位置是否正确
6. 审查通过直接 squash 合并。有问题不合并，写进 PR 等维护者确认
7. 合并后更新主 issue：勾掉改完的英雄，待确认技能追加到「待确认技能」一节

主力档执行者一轮没做对就升级。

## 5. 待确认

自动判定与待确认的界线、以技能为最小单位、记录模板见 `update-abilities-override` SKILL.md「自动判定与待确认」，这里不重复。规则能唯一定下的由执行者直接改，记进 PR「自动判定」。命中待确认的技能整块不改，记进 PR「待确认」（带建议）与主 issue「待确认技能」。

## 6. C 类子 issue

按「碰到本图哪一类东西」拆，每名英雄只进一个，归到最重的一类：

- 覆盖值与新机制冲突
- 抽奖克隆
- 觉醒
- 自制技能实现
- 电脑施法规则

正文每名英雄写三项：官方改了什么、碰到本图哪里、建议方向。维护者先定方向再改，按 `issue-impl` 实现，要实机验证。

摸底的 C 类细节错得多（7.42 里自制实现是否存在、覆盖里有没有某个键、觉醒依赖哪个技能都有误报），开子 issue 时由主力档逐条核实触点再写，核实后不再属于 C 的挪回 B 类分批。

## 7. 并行

- B 批在 worktree 并行，同时最多 2 批，改的是同两份 KV 的不同英雄块
- 合并串行，后合并的 PR 先 rebase 到最新 `develop`，冲突就重跑 `npm test`
- worktree 的 `node_modules` 用 junction 借主目录的，删前先拆，见 `.claude/references/git-workflow.md`「worktree 与 node_modules」
- C 类实机验证只在主目录

## 8. 更新日志

各 PR 不写，发版 PR 合成一条「同步 <版本> 英雄改动」。

## 坑

- 分类按官方改动大小做会把大部分英雄归 C（7.42 第一轮 30 名里 21 名归 C，全部重跑），所以把分类标准原样写进每个摸底子代理的提示
- 上一版参考目录可能带字母（如 `7.41f`），按实际存在的目录取
- 7.41f 起天赋与技能槽位在 `docs/reference/<版本>/heroes/npc_dota_hero_<hero>.txt`，不在 `npc_heroes.txt`
- 官方会把冷却等键从技能顶层移进 `AbilityValues`，覆盖要跟着移，否则失效
