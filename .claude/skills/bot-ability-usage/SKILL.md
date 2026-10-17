---
name: bot-ability-usage
description: 让 bot 会用或改用某个技能（AbilitySpec 施法规则）。
---

# Bot 技能施法 Spec

把「何时何处施放」登记成数据：`AbilityRegistry` 收 spec，`AbilityDispatcher` 每个 bot tick 遍历执行。spec 是 bot 主动施法的唯一目标架构；英雄文件里存量的 `UseAbilityXxx` 手写规则是迁移债务，碰到时把有效条件迁入 spec，确认行为等价后删掉英雄覆盖。

路径：类型 `src/vscripts/ai/ability/ability-spec.ts`，注册表 `ability-registry.ts`，dispatcher `ability-dispatcher.ts`，条件 `src/vscripts/ai/action/cast-condition.ts`，spec 目录 `src/vscripts/ai/ability/specs/`。

## 1. 定技能名

按 `game/scripts/npc/CLAUDE.md`「查原版技能」得到 `abilityName`（如 `omniknight_purification`）。`specs/<abilityName>.ts` 已存在就是修正模式，否则新建。同一技能的不同目标场景写在同一文件的 `SPECS` 数组里。

## 2. 读 KV

按 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」找到 KV 块：

| KV 字段                                           | 用途                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbilityBehavior`                                 | dispatcher 自动按 UNIT_TARGET / POINT / AOE / NO_TARGET 派发，spec 不用管                                                                                                                                                                                            |
| `AbilityUnitTargetTeam` + `AbilityUnitTargetType` | 定 `TargetSide`：敌方含 HERO → `EnemyHero`，仅 BASIC/CREEP → `EnemyCreep`，含 BUILDING → `EnemyBuilding`；友方同理 `FriendlyHero` / `FriendlyBuilding`；只作用自身或 PASSIVE / 纯自身 buff → `Self`。多种合法目标且都有意义时写多条（冰霜魔盾对友方英雄 + 友方建筑） |
| `AbilityCastRange`                                | dispatcher 自动填入 `range.lte`                                                                                                                                                                                                                                      |

## 3. 和用户确认施法条件

用 `AskUserQuestion` 确认需要的条件，字段从 `.claude/references/bot-cast-conditions.md` 里选，spec 越简单越好。`noModifier` / `hasModifier` 的 modifier 名查 `DOTA_Tooltip_modifier_<name>`：先查项目 `game/resource/addon_schinese.txt`（自定义、克隆、override 技能以项目为准，如项目把寒冰盔甲克隆给巫妖得到 `modifier_lich_frost_armor`），查不到再查最新 `docs/reference/<version>/abilities_schinese.txt`。

**要不要补一条清兵规则**：对英雄的规则确认后，三条全满足时用 `AskUserQuestion` 问用户，选项说明里带上冷却与法力消耗：

1. 范围伤害：`AbilityBehavior` 含 AOE，或是 POINT，或 UNIT_TARGET 带 AOE
2. 能作用于普通单位：`AbilityUnitTargetType` 含 BASIC 或 CREEP（POINT 与 NO_TARGET 天然满足）
3. 清兵不亏：冷却 45 秒以上或法力 200 以上的不问；核心机动与保命技能即使便宜也不问

单体伤害与控制、增益 / 护盾 / 治疗、纯位移、被动都不问。用户同意后在对英雄的规则之后加一条 `targetSide: TargetSide.EnemyCreep`，通常不写条件：

- dispatcher 自动套 `CREEP_DEFAULT_CONDITION`（自身蓝量与血量 ≥ 40%、技能 ≥ 2 级、900 内无敌方英雄、目标 ≥ 2 个），只在 laning / push / farm / defend 模式尝试。spec 里写同路径的值会经 `DeepMerge` 整体替换默认（NumberRange 整体换，如 `self.unitCondition.manaPercent: { lte: 40 }` 表示蓝低才吸蓝）；明确的单体用途写 `target.count.gte: 1`
- 远古野由 dispatcher 统一处理：farm 模式下技能等级达到 `target-dispatch.ts` 的 `ANCIENT_MIN_ABILITY_LEVEL` 时自动加入候选，KV 带 `NOT_ANCIENTS` 的照引擎口径跳过。个别技能不该打远古时写 `target.unitCondition.excludeAncient: true`

完成：每条 spec 的 `targetSide` 和条件都经用户确认。

## 4. 写 spec 文件

`src/vscripts/ai/ability/specs/<abilityName>.ts`：

```ts
import { AbilitySpec, TargetSide } from "../ability-spec";

/** <技能中文名>：<一句话说明何时施放、为什么这样限定>。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: "<abilityName>",
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 25 } } },
    },
  },
];
```

没有条件就不写 `condition`，`target` / `self` / `ability` 只写有内容的。注释写意图，数值只在 condition 里出现一次（注释规约）；发现注释与代码数值不一致时，先查 git blame 或实测确认哪个是设计意图再改。

## 5. 注册

按技能名首字母找 `specs/index-<起>-<止>.ts`（如 `index-a-d.ts`），按字母序加 `import { SPECS as <camelName> } from './<abilityName>';` 和注册函数里的 `AbilityRegistry.registerAll(<camelName>);`。import 留在分组文件里：每个 import 在 Lua 里是一个顶层局部变量，单文件超过 200 个会报 `main function has more than 200 local variables`，整个技能 AI 加载失败；分组文件接近约 90 个 import 时再按字母细分。

dispatcher 按 `hero.GetAbilityByIndex` 槽位顺序遍历，技能间优先级由槽位决定，同名多条 spec 由数组顺序决定。

## 6. 验证

- `npm run lint && npm run build:vscripts`，`npm test`（框架已有测试，spec 不用新增）
- 游戏内让 bot 学到该技能并构造触发条件，看控制台 `[AI] CastByBehavior <abilityName>`；需要时走 `dota-live-test`

完成：编译与测试通过，告诉用户要在游戏里看什么现象。
