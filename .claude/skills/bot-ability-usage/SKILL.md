---
name: bot-ability-usage
description: 为指定技能编写 bot 施法规则（AbilitySpec），让 bot 在合适时机自动施放。触发：用户说「让 bot 会用 XX 技能」「给 bot 写 YY 的施法逻辑」。区别于 bot-item-usage（战斗物品）。
---

# 编写 Bot 技能施法 Spec

把"何时何处施放该技能"以数据形式登记到 `AbilityRegistry`，由 `AbilityDispatcher` 在每个 bot tick 自动遍历并执行。

> 架构背景：`AbilityDispatcher`（按 spec 注册表）是 bot 精细主动施法的唯一目标架构。存量 `UseAbilityXxx` 手写逻辑属于迁移债务，修改涉及这些技能时应将规则迁入 spec 并删除重复入口。新技能一律走 spec，不要再往英雄文件加。
>
> 关键路径:
> - 类型: [src/vscripts/ai/ability/ability-spec.ts](src/vscripts/ai/ability/ability-spec.ts)
> - 注册表: [src/vscripts/ai/ability/ability-registry.ts](src/vscripts/ai/ability/ability-registry.ts)
> - dispatcher: [src/vscripts/ai/ability/ability-dispatcher.ts](src/vscripts/ai/ability/ability-dispatcher.ts)
> - 共享条件 / 过滤: [src/vscripts/ai/action/cast-condition.ts](src/vscripts/ai/action/cast-condition.ts)
> - spec 目录: [src/vscripts/ai/ability/specs/](src/vscripts/ai/ability/specs/)
> - 聚合注册: [src/vscripts/ai/ability/specs/index.ts](src/vscripts/ai/ability/specs/index.ts)

---

## 第一步：解析技能输入

按 `.claude/CLAUDE.md`「查原版技能」规则处理（支持系统名 / 中文名 / 英雄名-技能名），最终得到 **`abilityName`**（如 `omniknight_purification`）。

---

## 第二步：检查是否已有 spec

```
Glob pattern: src/vscripts/ai/ability/specs/<abilityName>.ts
```

| 情况 | 处理 |
|------|------|
| 已存在 | 操作模式 = **修正现有 spec**（读取并按用户需求编辑 SPECS 数组） |
| 不存在 | 操作模式 = **新建 spec 文件** |

> 同一技能在不同目标场景下条件不同（例如对英雄/对小兵），通过同一文件内 `SPECS` 数组多条 entry 表达，**不要建多个文件**。

---

## 第三步：读取技能 KV，提取关键字段

按 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」找到该技能的 KV 块，提取：

| KV 字段 | 用途 | 取值映射 |
|---|---|---|
| `AbilityBehavior` | 决定 cast 调用方式 | dispatcher 自动按 `UNIT_TARGET / POINT / AOE / NO_TARGET` 派发，**spec 不用关心** |
| `AbilityUnitTargetTeam` | 决定 `TargetSide` | `ENEMY` → `EnemyHero/EnemyCreep/EnemyBuilding`；`FRIENDLY` → `FriendlyHero/FriendlyBuilding`；技能仅作用施法者 → `Self` |
| `AbilityUnitTargetType` | 区分英雄/小兵/建筑 | 含 `HERO` 用 `*Hero`；仅 `BASIC/CREEP` 用 `EnemyCreep`；含 `BUILDING` 用 `*Building`；同一技能多种合法目标且语义合理时**注册多条 spec**（如冰霜魔盾对友方英雄 + 友方建筑） |
| `AbilityCastRange` | 施法距离 | **dispatcher 会自动按 cast range + 施法距离加成过滤目标**，spec 通常**不要**手写 `range.lte` |

如该技能是 `PASSIVE` 或纯 `NO_TARGET` 自身 buff 不需要选目标 → `TargetSide.Self`。

---

## 第四步：与用户确认施法条件

用 `AskUserQuestion` 与用户确认以下几项中需要的项目（不需要的项直接省略，spec 越简单越好）：

1. **目标血量条件**（最常见）：例如"残血斩杀"`target.unitCondition.healthPercent.lte: 25`；"低血量队友"`lte: 70`；"避开满血"`lte: 95`。
2. **目标数量条件**：群体技能要求"施法范围内至少 N 个敌人才出手"`target.count.gte: 3`。**计数范围 = 生效的 `range.lte`**（spec 显式写的优先，未写时按 cast range / `rangeFromAbilityValue` 自动补齐），不是固定的 1800 预搜半径。计数只按存活与距离收窄，不受 `target.unitCondition` 影响。若判据需要比施法距离更大的观察范围，注意 `range` 同时决定目标筛选，放大会让 bot 追着远处目标跑。
3. **施法者条件**：例如"蓝量够才用"`self.unitCondition.manaPercent.gte: 50`，或"血量低才用某保命技能"。
4. **技能等级 / 充能条件**：`ability.level.gte: 3`、`ability.charges.gte: 1`。
5. **避免重复施法**：`target.unitCondition.noModifier: ['modifier_xxx']`，常用于持续 debuff/buff。Modifier 名查 `DOTA_Tooltip_modifier_<name>` 取 `<name>`：**优先查项目 `game/resource/addon_schinese.txt`**（自定义/克隆/override 技能以项目本地化为准）；项目搜不到再查 reference 最新版本 `docs/reference/<version>/abilities_schinese.txt`（原版技能兜底）。例：寒霜魔盾 = `modifier_lich_frost_shield`；`lich_frost_armor` 是项目把奥术法师寒冰盔甲克隆给巫妖，原版 lich 无此技能，modifier 名 = `modifier_lich_frost_armor`，仅在项目本地化有定义。
6. **跳过已被控目标**：`target.unitCondition.notActionable: true`，目标处于眩晕/变羊/噩梦/虚空大等硬控状态则跳过，对已被控的目标使用控制技能通常是浪费。
7. **附近无敌方英雄才施法**：`self.noEnemyHeroInRange: 900`（距离可自定义），常用于对小兵或建筑施法前确认安全。此字段在 dispatcher `tryCast` 层检查，**不是** `self.unitCondition` 的子字段，直接挂在 `self` 下。
8. **附近需要足够友方小兵**：`self.friendlyCreepNearby: { count: { gte: 3 } }`，常用于推塔场景（对 `EnemyBuilding` 施法时确认有推线波）。`range` 不填默认 900。此字段也直接挂在 `self` 下，dispatcher inline `FindUnitsInRadius` 检查。
9. **排除施法者自己**：`target.excludeSelf: true`。友方候选天然包含施法者且距离 0 排在首位，以自身生命为代价的技能（如亚巴顿迷雾缠绕）必须排掉；纯增益给自己用通常合理，不要随手加。
10. **目标相对朝向**：`target.facing: 'front' | 'back'`，只保留位于施法者正面 / 背面半区的目标（水平面点积取符号，正侧方两者都不满足）。用于带位移的技能区分追击（朝目标跳）与撤退（背对目标跳），如宙斯神圣一跳。
11. **附近有 / 没有队友**：`self.allyHeroInRange: 1200` / `self.noAllyHeroInRange: 900`，只算真英雄、不含自己。控制与持续施法大招要队友跟进输出或护住引导时用前者（如魔爪、极寒领域）；受到伤害就解除的控制用后者（如噩梦）。与 `noEnemyHeroInRange` 同样直接挂在 `self` 下。
12. **只选行动受限的目标**：`target.unitCondition.disabled: 'hard' | 'movement'`，是 `notActionable`（被控就跳过）的反面。`hard` 只认眩晕、变羊等硬控；`movement` 还认缠绕和被减速到跑不出范围。用于接控制才打得满的技能（如神秘之耀、魂之挽歌）。
13. **身前固定位置的圆形区域**：`target.aheadCircle: { distanceValue, radiusValue }`，只选落在施法者身前固定距离处圆内的目标，距离与半径按键名读技能数值。用于朝面前固定位置生效的无目标技能（如毁灭阴影），比 `facing` 准；无目标技能 cast range 为 0，还要显式写 `range.lte`。
14. **大招没好才放**：`self.ultimateNotReady: true`，大招已学会且能放时跳过。用于放完会被引导锁住的技能（如剧变），让大招先交出去。
15. **提前结束持续施法**：spec 顶层 `stopChannel: { noEnemyHeroInRange?, afterSeconds? }`，由英雄执行器在引导中检查。不写就引导到底；只给确实需要的技能加，如剧变在敌人离开后停下、气运之末放出即结束引导让它立刻生效。
16. **目标身边敌人多才选**：`target.enemiesNearby: { range, count }`，只选身边至少 count 个敌方单位（英雄与小兵一起数）的目标。用于对友方施放、顺带伤害其周围敌人的技能（如暗影波对队友或己方小兵放）。
17. **目标带某状态才选**：`target.unitCondition.hasModifier: [...]`，带其中任一 modifier 才选，是 `noModifier` 的反面。用于接在别的技能效果之后放（如涤罪之焰只对身上有命运敕令或虚妄之诺的队友放）。
18. **斩杀阈值倍数**：`healthAbilityValue.multiplier`，阈值乘以倍数，用于冷却短、预计能连放几次的伤害技能（如涤罪之焰取两倍伤害）。
19. **这波打得过才放**：`self.canWinFight: true`，按团队大脑对当前交战的战力判断（与英雄执行器「打起来后继续打」同一口径）。用于跳进敌人身边、放了就难退的技能（如幻影突袭、闪烁突袭）。
20. **以树为目标**：`targetSide: TargetSide.Tree`，对施法者附近最近的一棵树施放（如抓树），目标条件不适用，只看施法者条件。
21. **同名多条 spec**：若英雄/小兵/建筑 不同目标场景条件不同（如群蛇守卫对英雄/对塔），写多条 `AbilitySpec` entry，按"重要的写前面"排序。

### 是否补一条对小兵的清兵规则

对英雄的规则确认完之后，再判断这个技能要不要顺带清兵。**不要自行决定，用 `AskUserQuestion` 问用户**，并在选项说明里带上该技能的冷却与法力消耗，让用户有判断依据。

三个条件全部满足才提问：

1. **范围伤害**。`AbilityBehavior` 含 `AOE`，或是 `POINT` 类技能，或 `UNIT_TARGET` 同时带 `AOE`。
2. **能作用于普通单位**。`AbilityUnitTargetType` 含 `BASIC` 或 `CREEP`；`POINT` 与 `NO_TARGET` 类天然满足。仅 `HERO` 的单位指定技能选不中小兵，直接排除。
3. **拿去清兵不亏**。冷却与法力属于关键技能级别的不要提问，直接排除。经验线是冷却 45 秒以上或法力 200 以上；同时看这个技能在英雄战里的地位，核心机动与保命技能即使便宜也不清兵。

以下类型任何情况都不提问：单体伤害与单体控制、增益 / 护盾 / 治疗、纯位移、被动。

用户同意后，在同一文件的 `SPECS` 数组里再加一条 `targetSide: TargetSide.EnemyCreep` 的 entry，排在对英雄的规则之后。默认门槛由 dispatcher 自动套用，通常不需要再写任何条件。

> **EnemyCreep 默认条件**（`CREEP_DEFAULT_CONDITION`，由 dispatcher 自动套用，无需在 spec 中重复写）：
> - `self.unitCondition.manaPercent.gte: 40`
> - `self.unitCondition.healthPercent.gte: 40`
> - `ability.level.gte: 3`
> - `self.noEnemyHeroInRange: 900`
>
> spec 中显式指定的同路径值会通过 `DeepMerge` 覆盖默认值（NumberRange 整体替换，非 key 级合并）。例如想在自身蓝量低时才吸蓝：`self.unitCondition.manaPercent: { lte: 40 }` 会替换默认的 `gte: 40`。

> 现有条件结构见 [cast-condition.ts](src/vscripts/ai/action/cast-condition.ts) 的 `UnitCondition / AbilityCoindition / NumberRange`。

不要发明 `cast-condition.ts` 没有的字段；若用户的诉求超出现有条件能力（例如"距离敌方塔太近不施放"），告知用户当前框架不支持，需要扩展 dispatcher，不要自行加 spec 字段。

---

## 第五步：写 spec 文件

文件名 = `<abilityName>.ts`，路径 `src/vscripts/ai/ability/specs/`。

模板：

```ts
import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * <技能中文名>：<原版 behavior / target team 摘录，例如 UNIT_TARGET / ENEMY / HERO>。
 *
 * <一句话说明何时施放、为什么这样限定。>
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: '<abilityName>',
    targetSide: TargetSide.<EnemyHero | EnemyCreep | EnemyBuilding | FriendlyHero | Self>,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 25 } },
      },
    },
  },
];
```

可省略的部分尽量省：
- 无 condition → 直接 `targetSide: TargetSide.Self,` 后不写 `condition`。
- 没有 `target` / `self` / `ability` 任一分支 → 别写空对象。

---

## 第六步：注册

按技能名首字母找到 `src/vscripts/ai/ability/specs/index-<起>-<止>.ts`（如 `index-a-d.ts`），在该文件里：

1. 按字母序加 `import { SPECS as <camelName> } from './<abilityName>';`
2. 在注册函数里按字母序加 `AbilityRegistry.registerAll(<camelName>);`

不要把 import 加回 `index.ts`：每个 import 在 Lua 里是顶层局部变量，单文件超过 200 个会报 `main function has more than 200 local variables`，整个技能 AI 加载失败。某个分组文件接近上限（约 90 个 import）时再按字母细分。

> dispatcher 按 `hero.GetAbilityByIndex` 槽位顺序遍历，所以多个技能间的优先级由"技能挂在英雄第几槽"决定；同名多条 spec 的优先级才由 SPECS 数组顺序决定。

---

## 第七步：验证

| 检查 | 命令 / 动作 |
|---|---|
| 类型 / 编译 | `npm run lint && npm run build:vscripts` |
| 单元测试 | `npm test`（无需新增 spec 测试，框架本身已有测试覆盖） |
| 游戏内 | `npm run start` 进 tools，让一个 bot 学到 / 抽到该技能并构造触发条件，观察控制台 `[AI] CastByBehavior <abilityName>` 日志 |

---

## 常见陷阱

- **不要在 spec 里手写 `range.lte`**：dispatcher 会用技能 KV 中的 `AbilityCastRange + GetCastRangeBonus` 自动填入。手写反而会覆盖默认值，导致超出施法距离也尝试施放。例外：spec 想要更小的搜索半径才显式覆盖。
- **不要为 spec 加新的字段类型**：spec 字段只能是 `ability-spec.ts` 中已定义的；新需求先扩展 `cast-condition.ts` 与 dispatcher，再消费。
- **不要往英雄文件 `UseAbilityXxx` 加新技能**：新技能一律走 spec。遇到已有手写规则时，将有效条件迁入 spec，并在确认行为等价后删除对应英雄覆盖，不能把英雄专属施法保留为长期第二执行层。
- **toggle / autoCast 类技能**：通过 `condition.action.toggleOn / toggleOff / autoCastOn` 表达。dispatcher 命中 action 条件后只切换到目标状态，不走正常施法派发；已经处于目标状态时返回 false，继续尝试后续规则。
- **有目标才开着的开关**：`action.toggleByTarget: true`，找到符合条件的目标就开、找不到就关，一条 spec 同时管开和关（如腐烂、巫毒回复术）。`toggleOff` 只能在「找到目标」时关，表达不了「没有目标就关」。
- **TSTL 对象 spread 陷阱**：见 `src/vscripts/CLAUDE.md`「常见陷阱」末条；spec 文件本身用不到 spread，但若需要扩展 dispatcher / cast-condition，**绝对**不能写 `{ ...maybeUndefined }`。
- **KV 数值字段术语**：Dota 2 现行 KV 中数值字段块名为 `AbilityValues`（旧版 `AbilitySpecial` 已废弃）。在注释、字段命名、文档中统一使用 `AbilityValue` 表述；引擎 API `GetSpecialValueFor(key)` 仍可调用，但变量名和注释应写 `abilityValue` / `rangeFromAbilityValue`，不用 `specialValue`。
- **spec 文件头部注释不要复述 condition 里的字段/数值**：注释只写意图（"范围内有敌人即用"），不要带上 `range.lte` 等字段的具体值（"900 范围内"）。同一个数值出现两处，后续只改其中一处就会自相矛盾，且无法判断哪个是真相源。此规则同样适用于 ItemSpec（`ai/item/specs/`）文件。发现注释数值与代码不一致时，**不要默认注释代表设计意图、代码是笔误就去改代码**——应先查 git blame / 实机测试确认谁是真相源，再决定改代码还是改注释。
