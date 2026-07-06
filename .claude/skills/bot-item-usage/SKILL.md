---
name: bot-item-usage
description: >-
  为指定 Dota 物品编写 bot AI 使用规则（ItemSpec），让 bot 在合适时机自动使用该战斗物品。
  原版物品、克隆物品统一在 src/vscripts/ai/item/specs/ 下登记一个文件（升级链 + 使用逻辑相同的
  多个物品合并为一个文件）。读取物品 KV 判断 behavior/cast range，与用户确认条件后写入并注册。
  区别于购买/出售决策（见 bot-item-build skill）和购买后立即消耗的永久消耗品（见
  src/vscripts/ai/item/consume-item.ts，不走这套框架）。
  适用场景：用户说"让 bot 会用 XX 物品"、"给 bot 写 YY 的战斗使用逻辑"等。
---

# 编写 Bot 物品使用 Spec

把"何时对谁使用该物品"以数据形式登记到 `ItemRegistry`，由 `ItemDispatcher` 在每个 bot tick 自动遍历背包并执行。

> 架构背景：物品与技能共用同一套目标筛选 + 施法派发核心 `TryCastBySpec`
> （[target-dispatch.ts](src/vscripts/ai/action/target-dispatch.ts)），`AbilityDispatcher` 与
> `ItemDispatcher` 只是两个不同的"候选来源"——技能遍历 `hero.GetAbilityByIndex`，物品遍历
> `hero.GetItemInSlot(0~8)`。写 ItemSpec 时能力边界和 AbilitySpec 完全一致，见
> [bot-ability-usage](../bot-ability-usage/SKILL.md) 里对 `cast-condition.ts` 字段的详细说明，本文档
> 只讲物品特有的部分。
>
> 关键路径:
> - 类型: [src/vscripts/ai/item/item-spec.ts](src/vscripts/ai/item/item-spec.ts)
> - 注册表: [src/vscripts/ai/item/item-registry.ts](src/vscripts/ai/item/item-registry.ts)
> - dispatcher: [src/vscripts/ai/item/item-dispatcher.ts](src/vscripts/ai/item/item-dispatcher.ts)
> - 共享条件 / 派发核心: [src/vscripts/ai/action/target-dispatch.ts](src/vscripts/ai/action/target-dispatch.ts)、[cast-condition.ts](src/vscripts/ai/action/cast-condition.ts)
> - spec 目录: [src/vscripts/ai/item/specs/](src/vscripts/ai/item/specs/)
> - 聚合注册: [src/vscripts/ai/item/specs/index.ts](src/vscripts/ai/item/specs/index.ts)

---

## 第一步：判断这个物品该走哪套系统

先分清楚三套互不重叠的物品逻辑，避免走错框架：

| 物品类型 | 归属 | 判断标准 |
|---|---|---|
| **购买后立即消耗、无需战斗时机决策**（急速之翼、真银月、属性之书等） | `consume-item.ts` 的 `ConsumeItem.ConsumeKnownItems` | 买到就用，没有"什么时候用"的判断，只有"能不能用"（CD/蓝耗） |
| **需要战斗时机/目标判断的主动物品**（本 skill 覆盖） | `ItemSpec` + `ItemRegistry` + `ItemDispatcher` | 需要"敌人在附近才用""残血才用""跳过已被控目标"之类的决策 |
| **出装决策**（买什么、什么时候买、卖什么） | `bot-item-build` skill | 与本 skill 完全无关，不要混淆 |

只有第二类才继续往下走。

---

## 第二步：检查是否已有 spec，判断是否属于升级链

```
Glob pattern: src/vscripts/ai/item/specs/<itemName>.ts
```

| 情况 | 处理 |
|------|------|
| 已存在 | 操作模式 = **修正现有 spec**（读取并按用户需求编辑 SPECS 数组） |
| 不存在 | 操作模式 = **新建 spec 文件** |

**新建前先查 `item-tier-config.ts` 的 `prerequisite`/`upgrades` 字段**：若该物品与另一个已有 spec 的物品构成明确升级链（如 `item_wasp_callous` → `item_wasp_golden`），且使用条件完全相同，**合并进对方文件**（以链条起点物品命名），不要新建文件。参考 [item_dagon.ts](src/vscripts/ai/item/specs/item_dagon.ts)（达贡 1~5 级）、[item_wasp_callous.ts](src/vscripts/ai/item/specs/item_wasp_callous.ts)（大核荣耀系列）、[item_refresher.ts](src/vscripts/ai/item/specs/item_refresher.ts)（刷新球系列）等既有写法。

只有逻辑不同的平行分支（同一 `prerequisite` 但效果不同，如各类鞋子）才应该分开成独立文件或干脆不共用。

---

## 第三步：读取物品 KV，提取关键字段

按 CLAUDE.md「Dota 2 参考文件速查」定位该物品的 KV 块（原版查 `docs/reference/<version>/items.txt`，克隆/自制查 `game/scripts/npc/npc_items_clone.txt` / `npc_items_custom.txt`，override 差分查 `npc_items_override.txt`）：

| KV 字段 | 用途 | 取值映射 |
|---|---|---|
| `AbilityBehavior` | 决定 cast 调用方式 | dispatcher 自动按 `UNIT_TARGET / POINT / AOE / NO_TARGET` 派发，spec 不用关心 |
| `AbilityUnitTargetTeam` / `AbilityUnitTargetType` | 决定 `TargetSide` | 同 AbilitySpec 规则；**但见下方"NO_TARGET 物品的检测技巧"，不能直接照抄** |
| `AbilityCastRange` | 施法距离 | 同 AbilitySpec，dispatcher 自动填入；**许多 NO_TARGET 物品该字段为 0**，此时必须显式写 `target.range.lte` |
| `AllowedInBackpack` / `ItemCanBeUsedWithoutInventory` | 是否允许在备用栏直接使用 | 只有 KV 声明了其中之一，`usableFromBackpack: true` 才有意义（见下方备用栏一节） |

### NO_TARGET 物品的"检测技巧"（非常重要，容易写错）

很多物品是 `NO_TARGET` 行为（自身 buff、群体效果），但仍需要"周围有敌人/友军才用"这类判断。**不要**因为是 NO_TARGET 就用 `TargetSide.Self`——`TargetSide.Self` 会跳过所有 `target` 条件检查（`pickTarget` 对 Self 直接返回自身，见 target-dispatch.ts）。

正确写法：`targetSide` 照样填 `EnemyHero` / `FriendlyHero` 等真实检测对象，靠 `target.count`/`target.range` 做检测；由于实际行为是 NO_TARGET，`CastAbilityOnTargetByBehavior` 最终会忽略选中的 target，直接 `CastAbilityNoTarget`。参考 [item_magic_scepter.ts](src/vscripts/ai/item/specs/item_magic_scepter.ts)、[item_wasp_callous.ts](src/vscripts/ai/item/specs/item_wasp_callous.ts)。

只有真正"不需要检测任何东西，CD 好了就用"的纯 buff 物品（如阿迪王）才用 `TargetSide.Self` 且不写 `condition`，参考 [item_adi_king.ts](src/vscripts/ai/item/specs/item_adi_king.ts)。

**这个 trick 下 `ignoresMagicImmune: true` 几乎总要加**：NO_TARGET 物品自身没有 `MAGIC_IMMUNE_ENEMIES` flag，若不显式设置，魔免的敌人会被 `FilterTargetWithCondition` 过滤掉导致找不到目标、放不出技能。

---

## 第四步：与用户确认使用条件

除了 [bot-ability-usage](../bot-ability-usage/SKILL.md) 已列出的通用条件（血量、数量、等级、`notActionable`、`noModifier` 等）外，物品场景常见的还有：

1. **排除远古野**：`target.unitCondition.excludeAncient: true`（团队之手/无限手套等对小兵使用的物品，即使候选池本身不含远古野也建议保留，属于防御性写法）。
2. **附近没有敌方英雄/建筑才用**（安全场景判断，如烟雾）：`self.noEnemyHeroInRange` / `self.noEnemyBuildingInRange`，语义是"存在则跳过"，与"要求敌人存在"相反，不要混淆。
3. **身上没有对应 buff 才用**（避免重复施放同一效果，如烟雾自身的隐身 buff）：`self.unitCondition.noModifier: '<modifier名>'`。
4. **技能+物品总冷却压力**（刷新球类）：`self.cooldownTotal: { gte: N }`，统计范围是全部技能 + 主栏（0~5号槽）物品的剩余冷却之和。
5. **开关类**（切换形态/模式）：`condition.action.toggleOn: true`。
6. **激进/保守 OR 逻辑**：同一物品写两条 spec，一条近距离无条件、一条远距离+残血，参考 B2 组写法（如 [item_blade_mail_2.ts](src/vscripts/ai/item/specs/item_blade_mail_2.ts)）。

---

## 第五步：备用栏可用性（`usableFromBackpack`）

默认 `ItemDispatcher` 跳过备用栏（6~8号槽）物品。只有拾取物 / 情景性物品（肉山战旗、烟雾）才适合设 `usableFromBackpack: true`。

**两处必须同时满足，缺一不可**：
1. TS 侧：spec 里加 `usableFromBackpack: true`（只影响我们自己的 dispatcher 是否尝试）。
2. KV 侧：该物品的 KV 块需要 `AllowedInBackpack "1"` 或 `ItemCanBeUsedWithoutInventory "1"` 之一（否则引擎本身拒绝备用栏施法，就算我们的 dispatcher 尝试了也会被引擎拒掉）。**只改 TS 不改 KV 是常见遗漏**，加 `usableFromBackpack` 时顺手确认 KV。

---

## 第六步：写 spec 文件

文件名 = `<itemName>.ts`（升级链场景用链条起点物品名），路径 `src/vscripts/ai/item/specs/`。

模板：

```ts
import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** <物品中文名>：<一句话说明何时使用、为什么这样限定，不要带具体数值>。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: '<itemName>',
    targetSide: TargetSide.<EnemyHero | EnemyCreep | FriendlyHero | FriendlyCreep | Self>,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
    // usableFromBackpack: true,  // 仅拾取物/情景物品需要，见第五步
  },
];
```

可省略的部分尽量省，同 AbilitySpec 规则（无 condition 不写、空的 target/self 不写）。

---

## 第七步：在 index.ts 中注册

修改 [src/vscripts/ai/item/specs/index.ts](src/vscripts/ai/item/specs/index.ts)：

1. 顶部加 `import { SPECS as <camelName> } from './<itemName>';`（按字母序）
2. 在 `registerItemSpecs()` 内对应分组段落调用 `ItemRegistry.registerAll(<camelName>);`（沿用文件内已有的 B1/B2/.../拾取物 分组注释，找不到合适分组再新加）

> dispatcher 按 `hero.GetItemInSlot(0~8)` 槽位遍历顺序尝试，物品间优先级由"物品实际所在槽位"决定；同一物品多条 spec 的优先级才由 `SPECS` 数组顺序决定。

---

## 第八步：验证

| 检查 | 命令 / 动作 |
|---|---|
| 类型 / 编译 | `npm run lint && npm run build:vscripts` |
| 单元测试 | `npm test`（无需新增 spec 测试，框架本身已有测试覆盖） |
| 游戏内 | `npm run start` 进 tools，让 bot 买到该物品并构造触发条件，观察控制台 `[AI] CastByBehavior <itemName>` 日志 |

---

## 常见陷阱

- **不要把需要目标检测的 NO_TARGET 物品写成 `TargetSide.Self`**：见第三步"检测技巧"一节，这是最容易写错的地方。
- **不要在 spec 里手写 `range.lte`，除非物品 `AbilityCastRange` 为 0**：dispatcher 会自动用 KV 施法距离填入；NO_TARGET 物品这个值通常是 0，不写会导致搜索半径永远是 0（等于找不到任何目标），必须显式写。
- **升级链且逻辑相同的物品默认合并成一个文件**：新建前先查 `prerequisite`/`upgrades`，见第二步。
- **`usableFromBackpack` 只改 TS 不改 KV 不会生效**：见第五步，两处必须同时满足。
- **不要把"购买后立即消耗"的物品塞进 ItemSpec**：那类物品走 `consume-item.ts`，不需要战斗决策，混进 ItemSpec 是过度设计。
- **spec 文件头部注释不要复述 condition 里的具体数值**（同 bot-ability-usage 的规则）：只写意图，不写"900 范围""≥60秒"这类会随数值调整而与代码脱节的具体值。
- **`target-dispatch.ts` 的 `fillRangeFromCastRange` 绝不能原地修改 `condition.target`**：spec 是 `ItemRegistry`/`AbilityRegistry` 里的模块级单例，跨所有英雄/所有 tick 共享同一引用，原地写入会把第一次算出的值"冻结"进共享 spec。只有修改 target-dispatch.ts 本身时才需要留意这条，写 spec 文件不会触发。
