---
name: awaken-ability
description: 为英雄创作「觉醒技能」时使用——通过觉醒石（item_awaken_stone，抽奖发放）替换/插入/新增英雄技能槽的强化版技能。处理范围包括 src/vscripts/modules/awaken/ 的配置表与替换算法、game/scripts/npc/npc_abilities_custom_awaken.txt 的觉醒技能 KV、对应 Lua/TSTL 实现、game/scripts/npc/npc_abilities_override.txt 的关联差分，以及 addon_schinese.txt/addon_english.txt 的文案。当用户说「加一个觉醒技能」「给 XX 做觉醒」「觉醒后 XX 强化」「觉醒技能等级关联/自动触发/加魔免」等时触发。
---

# Awaken Ability

觉醒 = 玩家用觉醒石对指定英雄做一次技能槽改造。配置表 + 替换算法是纯 TSTL 模块，加一个觉醒通常只改配置 + 补技能资产。

## 架构（三个文件）

| 文件 | 职责 |
| ---- | ---- |
| `src/vscripts/modules/awaken/awaken-config.ts` | `ABILITY_REPLACEMENTS` 配置表 + `AbilityReplacement` 接口。**加觉醒主要改这里** |
| `src/vscripts/modules/awaken/awaken-replacer.ts` | 替换算法 `executeReplacement`（新增/替换/插入三分支，入口有幂等守卫）；对外 `applyAwakenByHero`/`canAwaken`/`isAwakened` |
| `src/vscripts/items/ts_items/item_awaken_stone.ts` | 觉醒石。`OnSpellStart` 调 `applyAwakenByHero`，成功才 `UTIL_Remove`；用 `CastFilterResult`+`GetCustomCastError` 给「不支持/已觉醒」飘字 |

## 三种替换操作

配置表每条记录一个英雄的觉醒。三种操作由字段组合决定：

| 操作 | 含义 | 字段 |
| ---- | ---- | ---- |
| **新增** | 直接加新技能，不动原有技能 | 只填 `newAbility` |
| **替换** | 移除某旧技能，加新技能（同步已学等级，不退点数） | `targetAbility` + `newAbility` |
| **插入** | 在指定槽位插入新技能，原技能保留等级重新加回 | `targetSlot` + `newAbility` |

`AbilityReplacement` 字段：
- `heroName`：适用英雄（`npc_dota_hero_xxx`）
- `targetAbility?` / `targetSlot?`：替换目标技能名 或 插入槽位（二选一；都不填 = 纯新增）
- `newAbility`：觉醒后的新技能名
- `newLevel`：新技能初始等级。替换分支里 `newLevel > 0` 用它，否则套用原技能已学等级
- `inheritLevelFrom?`：见「进阶 1」

> `targetSlot` 命中 `generic_hidden`（占位空槽）时走替换而非插入。

## 添加一个新觉醒的步骤

### 1) 配置

在 `awaken-config.ts` 的 `ABILITY_REPLACEMENTS` 加一条。最小形态（纯新增被动）：

```ts
{
  heroName: 'npc_dota_hero_xxx',
  newAbility: 'special_bonus_unique_xxx_upgrade',
  newLevel: 1,
},
```

### 2) 觉醒技能本体

若 `newAbility` 复用已有技能则跳过本步。新技能需补齐：

- **KV 定义** → 写进 `game/scripts/npc/npc_abilities_custom_awaken.txt`（已 `#base` 引入，无需再加）。关键字段 `BaseClass`、`ScriptFile`（指向实现）、`AbilityTextureName`（图标名）：

  ```
  "special_bonus_unique_xxx_upgrade"
  {
      "BaseClass"             "ability_lua"
      "ScriptFile"            "abilities/special_bonus_unique_xxx_upgrade"
      "AbilityTextureName"    "xxx_some_icon"
      "MaxLevel"              "5"
      "AbilityValues" { ... }
  }
  ```

- **`ScriptFile` 实现** → 纯 Lua 放 `game/scripts/vscripts/abilities/<name>.lua`（`class({})` + `LinkLuaModifier`，不经 TSTL）；TSTL 写法放 `src/vscripts/abilities/`。被动觉醒标准写法：`GetIntrinsicModifierName()` 返回一个隐藏内置 modifier，无需学习即生效，所有可调值从 KV `AbilityValues` 读取。

- **图标** → 引用 Dota2 原版技能名则不放 png；自定义图标才复制同名 png 到 `game/resource/flash3/images/spellicons/<name>.png`。`AbilityTextureName` 也可直接填**至宝/变体 texture 路径**（如 `necrolyte/apostle_of_decay_icons/necrolyte_heartstopper_aura`、`drow_ranger/immortal/drow_ranger_wave_of_silence`、`zuus_static_field_alt1`），引擎直接引用，同样无需放 png。

- **本地化** → 在两个 addon 文件的 `Awaken Abilities 觉醒技能` 模块补条目（中英同步）。标题格式见下。

### 3) 标题本地化格式（统一）

技能名称行用紫色 `#d000ff` 并闭合 `</font>`：
- 中文：`<font color='#d000ff'>名称 觉醒</font>`（**空格**分隔，不要 `-觉醒` 连字符）
- 英文：`<font color='#d000ff'>Name Awakened</font>`

**不要**用 `#8B008B`/`#00ff00`/`#a74abd` 等其他色值、不要漏 `</font>`。新增觉醒后核对该英雄标题与池内其它觉醒一致。

### 4) 物品描述

在觉醒石 `_Description` 的「支持的英雄」列表里加上该英雄名（中英同步）。

### 5) 验证

`npm run build:vscripts` 不报错 + `npx jest awaken-replacer` 过。槽位顺序 / 点数退还 / 飘字 / 运行时行为须 Dota tools 实跑确认。改完 vscripts 只看编译是否通过，不读编译产物 `.lua`。

---

## 进阶方案

按需选用。每项都有对应的真实落地参考（斧王、卓尔、PA、影魔）。

### 进阶 1：等级与原技能关联（插入/新增也继承等级）

替换分支天然继承原技能等级，但**插入/新增**分支默认用 `newLevel`，初始等级不跟随关联技能。需要全程等级关联（如觉醒技能与某个大招同步升级）时，两步配套：

1. **KV 双向 `LinkedAbility`**（升级时等级同步）——在 `npc_abilities_override.txt` 的关联技能、和 `npc_abilities_custom_awaken.txt` 的觉醒技能，两边各加一行指向对方：
   ```
   "LinkedAbility"   "对方技能名"   // 双向联动同步升级
   ```
   两个技能的 `MaxLevel` 须一致。

2. **配置 `inheritLevelFrom`**（添加时继承初始等级）——`awaken-config.ts` 该条加：
   ```ts
   inheritLevelFrom: '关联技能名',
   ```
   `resolveNewLevel` 会在加新技能时取该关联技能当前等级作初始等级（在移除任何技能前求值，故 `inheritLevelFrom` 可以正是被插入槽位的技能）。

> 参考：斧王 `axe_auto_culling_blade` ↔ `axe_culling_blade`，卓尔 `special_bonus_unique_drow_ranger_upgrade` ↔ `drow_ranger_multishot`。

### 进阶 2：自动触发（开启自动施法后自动检测施放）

主动型觉醒若手动按键违和，可改为「开启 autocast 后自动检测并施放」，保留技能原有的窗口/CD 逻辑：

- 技能 KV `AbilityBehavior` 含 `DOTA_ABILITY_BEHAVIOR_AUTOCAST`。
- 给技能加常驻被动 modifier（`GetIntrinsicModifierName`），低频 `StartIntervalThink`。think 内判断：`GetAutoCastState()` 开启 + `IsCooldownReady()` + 当前没在执行窗口 + 检测到符合条件目标 → `SetCursorPosition(...)` + `CastAbilityImmediately(...)` 走原 `OnSpellStart`。
- `CastAbilityImmediately` 会正常进 CD，`IsCooldownReady` 守卫防重复触发。
- 检测目标的判定逻辑抽成技能层一个方法（如 `FindXxxTarget()`），被动 think 与原主动逻辑共用，避免重复。

> 参考：斧王 `game/scripts/vscripts/abilities/axe_auto_culling_blade.lua`（autocast 自动斩杀 + `FindCullableEnemy` 共用）。

### 进阶 3：数值仅觉醒后生效（special_bonus 关联）

想让原技能的某个 KV 数值「仅在该英雄拥有觉醒技能时改变」（运行时无法干净改的固定值，如投射物速度），用觉醒技能名作为 `special_bonus` key：

```
"dagger_speed"
{
    "value"                                         "1200"
    "special_bonus_unique_phantom_assassin_upgrade" "=2100"   // 觉醒后覆盖为2100
}
```

引擎检测英雄拥有该 key 同名技能时自动应用。`=值` 覆盖、`+值` 增加。写在原技能的 override KV 里。

> 参考：PA 觉醒后潜匿之刺 `dagger_speed` 1200→2100。

### 进阶 4：加魔免但不顶替真 BKB（工具函数）

觉醒给英雄加魔法免疫时，若直接 `AddNewModifier("modifier_black_king_bar_immune")` 会缩短/顶掉玩家自己开的 BKB。用工具函数（`game/scripts/vscripts/util.lua`，全局可用）：

```lua
ApplyAwakenMagicImmunity(unit, ability, duration)
```

它在已有相等或更长的 `modifier_black_king_bar_immune` 时跳过，否则加魔免 + 播 BKB 音效。**所有觉醒加魔免一律走它**，不要各自手写比较逻辑。

> 参考：影魔魂之挽歌前摇魔免、PA 闪烁魔免、PA 匕首施法魔免均复用此函数。

### 进阶 5：监听某技能施法后触发效果

觉醒要在「英雄施放某个特定技能后」附带效果（如施法后加魔免）：

- **Lua intrinsic modifier**（`ability_lua`）：`GetIntrinsicModifierName` 返回一个 Lua modifier，其 `DeclareFunctions` 返回 `MODIFIER_EVENT_ON_ABILITY_START`，`OnAbilityStart(keys)` 里判断 `keys.unit == parent` 且 `keys.ability:GetAbilityName() == "目标技能名"`。不依赖技能 behavior，最通用。
- **DataDriven modifier**（`ability_datadriven`）：在 KV `Modifiers` 加 `"Passive" "1"` 的常驻 modifier（加 `"RemoveOnDeath" "0"` + `"Attributes" "MODIFIER_ATTRIBUTE_PERMANENT"`），用 **`OnAbilityExecuted`** 块 `RunScript`。函数里被施放的技能是 **`keys.event_ability`**（不是 `keys.ability`），施法者是 `keys.caster`。这个 listener 在主动型觉醒（如 `UNIT_TARGET`）上也会常驻并触发，无需技能是 passive。

> **关键坑**：不要为了让 listener 常驻而给主动技 `AbilityBehavior` 叠加 `DOTA_ABILITY_BEHAVIOR_PASSIVE`——实测会使该主动技**无法施放**。DataDriven 的 `Passive` modifier 不依赖技能 behavior 即可常驻，保持原主动 behavior 即可。

施法后的附带魔免配合进阶 4 的工具函数。

> 参考：影魔 `ability_lua` + `GetIntrinsicModifierName` 监听 `nevermore_requiem`；PA `ability_datadriven`（`UNIT_TARGET`，未加 PASSIVE）的 `modifier_pa_awaken_dagger_listener` 用 `OnAbilityExecuted` 监听 `phantom_assassin_stifling_dagger`；宙斯 `special_bonus_unique_zuus_upgrade` 是 PASSIVE datadriven 监听的范例。

---

## 不明确时询问

遇到这些决策点用 `AskUserQuestion` 菜单询问，不要自行假设：
- 操作类型不明（新增 vs 替换 vs 插入）
- 数值/效果「仅觉醒后生效」还是「全局对该英雄生效」
- 等级是否需要与某技能关联
- 主动技是否要做成自动触发
