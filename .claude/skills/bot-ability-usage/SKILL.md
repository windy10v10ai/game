---
name: bot-ability-usage
description: >-
  为指定 Dota 技能编写 bot AI 施法规则（AbilitySpec），让 bot 在合适时机自动施放该技能。
  无论是原版技能、自定义技能还是 lottery 抽到的技能，统一在 src/vscripts/ai/ability/specs/
  下登记一个文件。读取 docs/reference 中该技能的 KV 自动判断目标方向，与用户确认条件后写入并注册。
  适用场景：用户说"让 bot 会用 XX 技能"、"给 bot 写 YY 的施法逻辑"等。
---

# 编写 Bot 技能施法 Spec

把"何时何处施放该技能"以数据形式登记到 `AbilityRegistry`，由 `AbilityDispatcher` 在每个 bot tick 自动遍历并执行。

> 架构背景：bot 主动施法走两条链路——`AbilityDispatcher`（按 spec 注册表）优先，未命中再回落到老的 `UseAbilityXxx` 手写逻辑。新技能一律走 spec，不要再往英雄文件加。
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

按 CLAUDE.md「技能系统名查找」规则处理（支持系统名 / 中文名 / 英雄名-技能名），最终得到 **`abilityName`**（如 `omniknight_purification`）。

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

按 CLAUDE.md「Dota 2 参考文件速查」找到该技能的 KV 块，提取：

| KV 字段 | 用途 | 取值映射 |
|---|---|---|
| `AbilityBehavior` | 决定 cast 调用方式 | dispatcher 自动按 `UNIT_TARGET / POINT / AOE / NO_TARGET` 派发，**spec 不用关心** |
| `AbilityUnitTargetTeam` | 决定 `TargetSide` | `ENEMY` → `EnemyHero/EnemyCreep`；`FRIENDLY` → `FriendlyHero`；技能仅作用施法者 → `Self` |
| `AbilityUnitTargetType` | 当 team=ENEMY 时区分英雄/小兵 | 含 `HERO` 用 `EnemyHero`；仅 `BASIC/CREEP` 用 `EnemyCreep`；同时含两者并且语义合理时**注册多条 spec** |
| `AbilityCastRange` | 施法距离 | **dispatcher 会自动按 cast range + 施法距离加成过滤目标**，spec 通常**不要**手写 `range.lte` |

如该技能是 `PASSIVE` 或纯 `NO_TARGET` 自身 buff 不需要选目标 → `TargetSide.Self`。

---

## 第四步：与用户确认施法条件

用 `AskUserQuestion` 与用户确认以下几项中需要的项目（不需要的项直接省略，spec 越简单越好）：

1. **目标血量条件**（最常见）：例如"残血斩杀"`target.unitCondition.healthPercent.lte: 25`；"低血量队友"`lte: 70`；"避开满血"`lte: 95`。
2. **目标数量条件**：群体技能要求"周围至少 N 个敌人才出手"`target.count.gte: 3`。
3. **施法者条件**：例如"蓝量够才用"`self.unitCondition.manaPercent.gte: 50`，或"血量低才用某保命技能"。
4. **技能等级 / 充能条件**：`ability.level.gte: 3`、`ability.charges.gte: 1`。
5. **避免重复施法**：`target.unitCondition.noModifier: 'modifier_xxx'`，常用于持续 debuff。
6. **跳过已被控目标**：`target.unitCondition.notActionable: true`，目标处于眩晕/变羊/噩梦/虚空大等硬控状态则跳过，对已被控的目标使用控制技能通常是浪费。
7. **附近无敌方英雄才施法**：`self.noEnemyHeroInRange: 900`（距离可自定义），常用于对小兵施法前确认安全。此字段在 dispatcher `tryCast` 层检查，**不是** `self.unitCondition` 的子字段，直接挂在 `self` 下。
8. **同名多条 spec**：若英雄/小兵 两种目标条件不同（如 Medusa 分裂箭），写多条 `AbilitySpec` entry，按"重要的写前面"排序。

> **EnemyCreep 默认条件**（`CREEP_DEFAULT_CONDITION`，由 dispatcher 自动套用，无需在 spec 中重复写）：
> - `self.unitCondition.manaPercent.gte: 50`
> - `self.unitCondition.healthPercent.gte: 50`
> - `ability.level.gte: 3`
> - `self.noEnemyHeroInRange: 900`
>
> spec 中显式指定的同路径值会通过 `DeepMerge` 覆盖默认值（NumberRange 整体替换，非 key 级合并）。例如想在自身蓝量低时才吸蓝：`self.unitCondition.manaPercent: { lte: 50 }` 会替换默认的 `gte: 50`。

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
    targetSide: TargetSide.<EnemyHero | EnemyCreep | FriendlyHero | Self>,
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

## 第六步：在 index.ts 中注册

修改 [src/vscripts/ai/ability/specs/index.ts](src/vscripts/ai/ability/specs/index.ts)：

1. 顶部加 `import { SPECS as <camelName> } from './<abilityName>';`（按字母序）
2. 在 `registerAbilitySpecs()` 内对应的分组段落调用 `AbilityRegistry.registerAll(<camelName>);`
   - 治疗 / 护盾类（friendly target） → 友方组
   - 高伤大招（enemy hero） → 敌方组
   - 其他根据技能性质判断；段落不够时新加注释段落

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
- **不要往英雄文件 `UseAbilityXxx` 加新技能**：新技能一律走 spec。旧英雄文件保留是为了不破坏现有逻辑，**不是**新技能的入口。
- **toggle / autoCast 类技能**：通过 `condition.action.toggleOn / autoCastOn` 表达。这条路径目前只在老 `ActionAbility.doAction` 中实现，dispatcher 暂未串接 —— 遇到这类技能告知用户「该开关类目前需要走老链路或扩展 dispatcher」，不要自行硬塞。
- **TSTL 对象 spread 陷阱**：见 CLAUDE.md「常见陷阱」末条；spec 文件本身用不到 spread，但若需要扩展 dispatcher / cast-condition，**绝对**不能写 `{ ...maybeUndefined }`。
- **KV 数值字段术语**：Dota 2 现行 KV 中数值字段块名为 `AbilityValues`（旧版 `AbilitySpecial` 已废弃）。在注释、字段命名、文档中统一使用 `AbilityValue` 表述；引擎 API `GetSpecialValueFor(key)` 仍可调用，但变量名和注释应写 `abilityValue` / `rangeFromAbilityValue`，不用 `specialValue`。
