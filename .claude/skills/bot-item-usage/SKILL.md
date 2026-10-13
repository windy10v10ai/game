---
name: bot-item-usage
description: 让 bot 会用或改用某个战斗主动物品（ItemSpec 使用规则）。
---

# Bot 物品使用 Spec

把「何时对谁使用」登记成数据：`ItemRegistry` 收 spec，`ItemDispatcher` 每个 bot tick 遍历背包执行。物品与技能共用派发核心 `TryCastBySpec`（`src/vscripts/ai/action/target-dispatch.ts`），能力边界与 AbilitySpec 一致；本 skill 只讲物品特有的部分，通用流程见 `bot-ability-usage`。

路径：类型 `src/vscripts/ai/item/item-spec.ts`，注册表 `item-registry.ts`，dispatcher `item-dispatcher.ts`，spec 目录 `src/vscripts/ai/item/specs/`，注册 `specs/index.ts`。

## 1. 确认走这套系统

| 物品 | 归属 |
|---|---|
| 买到就用、只看能不能用（急速之翼、真银月、属性之书） | `consume-item.ts` 的 `ConsumeItem.ConsumeKnownItems` |
| 需要战斗时机或目标判断的主动物品 | 本 skill |
| 买什么、何时买卖 | `/bot-item-build` |

## 2. 新建还是合并

`specs/<itemName>.ts` 已存在就修正。新建前查 `item-tier-config.ts` 的 `baseItems`：与已有 spec 的物品构成升级链且条件相同时，合并进链条起点物品的文件（参考 `item_dagon.ts`、`item_wasp_callous.ts`、`item_refresher.ts`）。合并文件里链条上 bot 可能持有的每一档都要有自己的 entry：dispatcher 按 `item.GetName()` 精确匹配，没有 fallback。共享 `baseItems` 但效果不同的平行分支（各类鞋子）分开写。

## 3. 读 KV

原版查 `docs/reference/<version>/items.txt`，克隆/自制查 `npc_items_clone.txt` / `npc_items_custom.txt`，差分查 `npc_items_override.txt`。

**NO_TARGET 物品的检测技巧**：要「周围有敌人/友军才用」时，`targetSide` 填真实检测对象（`EnemyHero` / `FriendlyHero` 等），靠 `target.count` 与显式 `target.range.lte` 检测（这类物品 `AbilityCastRange` 多为 0），再加 `ignoresMagicImmune: true`。实际施放时行为是 NO_TARGET，选中的目标会被忽略（参考 `item_magic_scepter.ts`、`item_wasp_callous.ts`）。`TargetSide.Self` 会跳过所有 target 条件，只给 CD 好了就用的纯 buff（阿迪王 `item_adi_king.ts`）。

## 4. 和用户确认使用条件

用 `AskUserQuestion` 确认，字段从 `.claude/references/bot-cast-conditions.md` 里选。物品特有的：

- **对小兵的规则写全门槛**：`ItemDispatcher` 不叠加技能那套 `EnemyCreep` 默认门槛与模式过滤，显式写 `target.count`、`self.noEnemyHeroInRange` 与蓝量（参考 `item_meteor_hammer.ts`）；对小兵用的物品保留 `excludeAncient: true`
- **激进/保守两条**：同一物品写近距离无条件、远距离 + 残血两条（参考 `item_blade_mail_2.ts`）
- **施放档位 `priority`**：bot 每 2 秒按 `ItemPriority`（`Survival` → `Control` → `Buff` → `Damage` → `Default` → `Refresh`）整理主物品栏，dispatcher 按格子顺序检查，档位决定同时满足时谁先放。明确属于保命、控制、增益、输出或刷新时才标；同一升级链（含分在不同文件的上下位）用同一档位，合并文件里每条 entry 都写（`ItemRegistry.priorityOf` 只读第一条）
- **备用栏 `usableFromBackpack: true`**：只给拾取物 / 情景物品（肉山战旗、烟雾），且 KV 要有 `AllowedInBackpack "1"` 或 `ItemCanBeUsedWithoutInventory "1"`，否则引擎拒绝施放

完成：每条 spec 的 `targetSide`、条件、档位都经用户确认。

## 5. 写 spec 并注册

```ts
import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** <物品中文名>：<一句话说明何时使用、为什么这样限定>。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: '<itemName>',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
];
```

在 `specs/index.ts` 按字母序加 import，在 `registerItemSpecs()` 对应分组段落（B1/B2/…/拾取物）加 `ItemRegistry.registerAll(<camelName>);`。物品间优先级由所在槽位决定，同一物品多条 spec 由数组顺序决定。

## 6. 验证

`npm run lint && npm run build:vscripts`，`npm test`；游戏内让 bot 买到该物品并构造触发条件，看 `[AI] CastByBehavior <itemName>`，需要时走 `dota-live-test`（`--testItems` 开局发物品）。
