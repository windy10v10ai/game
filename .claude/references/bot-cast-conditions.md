# Bot 施法条件字段

AbilitySpec 与 ItemSpec 共用的条件字段，`bot-ability-usage` 与 `bot-item-usage` 和用户确认施法条件时查这份。类型定义在 `src/vscripts/ai/action/cast-condition.ts`（`UnitCondition` / `AbilityCoindition` / `NumberRange`）与 `ability-spec.ts`。只用这里和类型里已有的字段；诉求超出现有能力（如「离敌方塔太近不施放」）时告诉用户需要先扩展 dispatcher。

## target：选谁

| 字段 | 含义与用例 |
|---|---|
| `unitCondition.healthPercent` | 最常见。残血斩杀 `lte: 25`，低血队友 `lte: 70`，避开满血 `lte: 95` |
| `unitCondition.health` | 按当前绝对生命值筛选 |
| `count.gte` | 范围内至少 N 个目标才出手。计数范围 = 生效的 `range.lte`（spec 显式写的优先，否则按 cast range / `rangeFromAbilityValue` 补齐），只按存活与距离收窄，不受 `unitCondition` 影响。`range` 同时决定目标筛选，放大会让 bot 追着远处目标跑 |
| `range.lte` | 通常不写，dispatcher 自动用 `AbilityCastRange + GetCastRangeBonus`。想要更小的搜索半径、或 cast range 为 0（无目标技能、多数 NO_TARGET 物品）时才写 |
| `unitCondition.noModifier: [...]` | 已带该状态就跳过，防止重复施放持续 buff/debuff |
| `unitCondition.hasModifier: [...]` | 带其中任一状态才选，用于接在别的技能效果之后（如涤罪之焰只对带命运敕令或虚妄之诺的队友） |
| `unitCondition.notActionable: true` | 跳过已被硬控（眩晕、变羊、噩梦、黑洞）的目标 |
| `unitCondition.disabled: 'hard' \| 'movement'` | 只选行动受限的目标，`notActionable` 的反面。`hard` 只认眩晕、变羊；`movement` 还认缠绕和被减速到跑不出范围。用于接控制才打得满的技能（神秘之耀、魂之挽歌） |
| `unitCondition.neutralOnly: true` | 只选野怪 |
| `unitCondition.excludeAncient: true` | 排除远古野 |
| `excludeSelf: true` | 友方候选排掉施法者自己（自己距离 0 会排第一）。以自身生命为代价的技能（迷雾缠绕）要加，纯增益通常不加 |
| `facing: 'front' \| 'back'` | 只选施法者正面 / 背面半区的目标（正侧方都不满足）。区分追击与撤退的位移（宙斯神圣一跳） |
| `fleeing: <range>` | 该距离内最近的敌方英雄位于目标身后才选（以目标朝向为准）。沿目标朝向推动的效果（推队友的原力法杖） |
| `aheadCircle: { distanceValue, radiusValue }` | 只选施法者身前固定距离处圆内的目标，距离与半径按键名读技能数值（毁灭阴影）。比 `facing` 准；无目标技能还要显式写 `range.lte` |
| `enemiesNearby: { range, count }` | 目标身边至少 count 个敌方单位（英雄与小兵一起数）才选。对友方施放、顺带伤害周围敌人（暗影波） |
| `attackedByTower: true` | 只选正被敌方塔攻击的目标，配合 `FriendlyCreep` 给挨塔打的小兵上增益（炎阳纹章） |
| `outOfAttackRange: true` | 只选普攻够不着的目标（下限取施法者当前攻击距离）。前摇或引导长、贴脸不如普攻的单体技能（暗杀） |
| `healthAbilityValue.multiplier` | 斩杀阈值乘以倍数，冷却短、能连放几次的伤害技能（涤罪之焰取两倍） |
| `ignoresMagicImmune: true` | 不过滤魔免目标。NO_TARGET 物品自身没有 `MAGIC_IMMUNE_ENEMIES` flag，用检测技巧时几乎都要加 |
| `castMode: 'targetPosition'` | 强制点地。运行时同时带 UNIT_TARGET 与 POINT 的技能（有 A 杖的强化图腾、剧变、投掷）指向敌人会被引擎拒绝、每 tick 重试；开发模式 `[bot-cast]` 日志的 `beh=` 是运行时 behavior 位，同一技能短时间反复出现就是命令没执行成功 |

## self：施法者

| 字段 | 含义与用例 |
|---|---|
| `unitCondition.manaPercent` / `healthPercent` | 蓝量够才用、血量低才用保命技能 |
| `unitCondition.noModifier` | 自己身上没有对应 buff 才用（烟雾的隐身） |
| `noEnemyHeroInRange: 900` | 附近有敌方英雄就跳过，对小兵或建筑施法前确认安全 |
| `noEnemyBuildingInRange` | 附近有敌方建筑就跳过 |
| `allyHeroInRange` / `noAllyHeroInRange` | 附近有 / 没有队友真英雄（不含自己）。控制与引导大招要队友跟进时用前者（魔爪、极寒领域）；受伤即解除的控制用后者（噩梦） |
| `friendlyCreepNearby: { count: { gte: 3 } }` | 附近足够友方小兵，推塔时对 `EnemyBuilding` 施法确认有兵线，`range` 默认 900 |
| `stance: 'fight' \| 'retreat'` | 读英雄层已做出的打/撤决定（已接战、塔的战力、敌人被控都算在内）。既能先手又能脱身的位移、隐身按它拆成两条，局势判断交给它而不是自身血量。`'fight'` 用于放了难退的先手（幻影突袭、神圣一跳朝前、穿刺），还会跳过站在越不了的塔下的目标；`'retreat'` 用于脱身（神圣一跳背身、影刃） |
| `ultimateNotReady: true` | 大招已学会且能放时跳过，让大招先交（放完会被引导锁住的剧变） |
| `abilitiesOnCooldown: { seconds, count }` | 至少 count 个已学会的主动技能剩余冷却 ≥ seconds 才放，不计物品（疯狂面具） |
| `cooldownTotal: { gte: N }` | 全部技能 + 主栏（0~5 槽）物品剩余冷却之和，给刷新类用 |

`noEnemyHeroInRange`、`allyHeroInRange`、`friendlyCreepNearby` 等直接挂在 `self` 下，不在 `self.unitCondition` 里。

## ability 与 spec 顶层

| 字段 | 含义与用例 |
|---|---|
| `ability.level.gte` / `ability.charges.gte` | 技能等级、充能 |
| `targetSide: TargetSide.Tree` | 对施法者附近最近的一棵树施放（抓树），只看施法者条件 |
| `action.toggleOn` / `toggleOff` / `autoCastOn` | 开关与自动施法：命中后只切到目标状态，已处于目标状态返回 false、继续尝试后续规则 |
| `action.toggleByTarget: true` | 有符合条件的目标就开、没有就关，一条 spec 同时管开关（腐烂、巫毒回复术）。`toggleOff` 只能在找到目标时关 |
| `stopChannel: { noEnemyHeroInRange?, graceSeconds?, afterSeconds? }` | 提前结束持续施法，由英雄执行器在引导中检查；`graceSeconds` 让敌人短暂离开时不交掉长引导。只给确实需要的技能加（剧变在敌人离开后停、气运之末放出即结束让它立刻生效） |

同一技能对不同目标场景条件不同时，在同一文件的 `SPECS` 数组写多条，重要的在前。

## 修改 dispatcher 时

`target-dispatch.ts` 的 `fillRangeFromCastRange` 要返回新对象：spec 是注册表里的模块级单例，跨所有英雄与 tick 共享，原地写入 `condition.target` 会把第一次算出的值冻结进去。写 spec 文件不涉及这条。
