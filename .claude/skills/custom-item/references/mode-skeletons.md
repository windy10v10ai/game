# 两个模式的骨架

## 模式 1「DataDriven 主体」

数值与触发在同一个 KV 块内。范例 `item_wasp_despotic`（零脚本：`Random` / `ApplyModifier` / `RemoveModifier` / `FireSound` 串出概率暴击 + 主动增益）：

```kv
"item_my_new_item"
{
    "BaseClass"             "item_datadriven"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_PASSIVE"
    "AbilityTextureName"    "my_new_item"
    "AbilityValues" { "bonus_armor" "30" }
    "Modifiers"
    {
        "modifier_item_my_new_item"
        {
            "Passive"        "1"
            "IsHidden"       "1"
            "Attributes"     "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"
            "Properties" { "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS" "%bonus_armor" }
        }
    }
}
```

Actions 完整清单见 [Valve Wiki](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven#Actions)。KV 里可以直接 `ApplyModifier` 一个原版 modifier（范例 `item_beast_shield` 的 `modifier_black_king_bar_immune`），不必先在自己的 `Modifiers` 块声明。

Actions 表达不了时接 `RunScript`，Lua 放 `game/scripts/vscripts/items/<name>.lua`，只写全局函数：

```kv
"OnSpellStart"
{
    "RunScript" { "ScriptFile" "items/item_my_new_item"  "Function" "MyNewItemOnSpell" }
}
```

`ScriptFile` 指向原生 Lua：TSTL 产物是模块包装，函数不在文件全局作用域。要写 TS 就走模式 2。

## 模式 2「TS 主体」

KV `BaseClass` = `item_lua`，`ScriptFile` 指向 `items/ts_items/<name>`；实现放 `src/vscripts/items/ts_items/`，物品继承 `BaseItem`、intrinsic modifier 继承 `BaseItemModifier`。范例 `item_saint_orb.ts`、`item_six_paths_reincarnation_gun.ts`：

```ts
import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_my_new_item')
export class ItemMyNewItem extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_my_new_item_passive';
  }
}

@registerModifier('items/ts_items/item_my_new_item', 'modifier_item_my_new_item_passive')
export class ModifierItemMyNewItemPassive extends BaseItemModifier {
  override statsModifierName = 'modifier_item_my_new_item_stats'; // 无永久属性时填 ''
  override vanillaModifierNames = ['modifier_item_xxx'];          // 复用原版 modifier，没有则不写
  // 只手写 datadriven-scope.md 表外的逻辑
}
```

- `BaseItemModifier` 已实现三个生命周期的 `_stats` 同步（按背包里该物品实例数对齐层数）与 `vanillaModifierNames` 的挂摘。override 这三个回调时调 `super.XXX()`，否则属性静默失效
- `vanillaModifierNames` 可放多个原版 modifier，基类按句柄逐个 `Destroy()`
- 没有永久属性的物品（消耗品 / 工具类）`statsModifierName` 填 `''`，不碰 `item_apply_modifiers`
- 物品新增的**可见** buff/debuff（`IsHidden()` 为 `false`）覆盖 `GetTexture()`，返回物品的**系统注册名**（带 `item_` 前缀），引擎据此找 KV 的 `AbilityTextureName`
- `StartIntervalThink(interval)` 的第一次 `OnIntervalThink` 立即触发。「每隔 N 秒结算一次」要用标记跳过首次回调
