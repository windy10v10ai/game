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
      "ScriptFile"            "abilities/ts_abilities/special_bonus_unique_xxx_upgrade"
      "AbilityTextureName"    "xxx_some_icon"
      "MaxLevel"              "5"
      "AbilityValues" { ... }
  }
  ```

- **`ScriptFile` 实现选型** → 与 `custom-ability` skill 同一优先级：① 含被动属性加成（攻速/护甲/移速/属性…）走 **DataDriven**（KV `Modifiers`→`Properties`，引擎原生求值最省，允许其中 `RunScript` 调少量 Lua 补动态值）→ ② 逻辑技能走 **TS（TSTL）**，源码放 `src/vscripts/abilities/`，KV `ScriptFile` 指向编译产物 `abilities/ts_abilities/<name>`（`@registerAbility`/`@registerModifier`，参考斧王 `axe_auto_culling_blade`、宙斯 `special_bonus_unique_zuus_upgrade`）→ ③ **纯 Lua 仅用于维护已有技能，不从零新写**。被动觉醒标准写法：`GetIntrinsicModifierName()` 返回一个隐藏内置 modifier，无需学习即生效，所有可调值从 KV `AbilityValues` 读取。

- **图标** → 引用 Dota2 原版技能名则不放 png；自定义图标才复制同名 png 到 `game/resource/flash3/images/spellicons/<name>.png`。`AbilityTextureName` 也可直接填**至宝/变体 texture 路径**（如 `necrolyte/apostle_of_decay_icons/necrolyte_heartstopper_aura`、`drow_ranger/immortal/drow_ranger_wave_of_silence`、`zuus_static_field_alt1`），引擎直接引用，同样无需放 png。

- **本地化** → 在两个 addon 文件的 `Awaken Abilities 觉醒技能` 模块补条目（中英同步）。标题格式见下。

### 3) 标题本地化格式（统一）

技能名称行用紫色 `#d000ff` 并闭合 `</font>`：
- 中文：`<font color='#d000ff'>名称 觉醒</font>`（**空格**分隔，不要 `-觉醒` 连字符）
- 英文：`<font color='#d000ff'>Name Awakened</font>`

**不要**用 `#8B008B`/`#00ff00`/`#a74abd` 等其他色值、不要漏 `</font>`。新增觉醒后核对该英雄标题与池内其它觉醒一致。

**正文关键词颜色（统一）**：
- 魔法免疫 / 减益免疫等保护类关键词 → 金色 `#FFCC66`（参考 PA、影魔）
- 伤害类型关键词（正文内联的「纯粹伤害 / 魔法伤害」等）→ 纯粹 `#FFE56E`（金色）、魔法 `#05CAFF`（蓝色）。项目既有约定，新增照此对齐
- 自动施放 / 触发类提示 → 红色 `#FF0000`（参考斧王、肉钩）
- 神杖升级说明 → 白色 `#FFFFFF` 配「神杖升级：」前缀（参考死灵竭心光环、火枪暗杀）
- **写死的数值** → 引擎只对 `%key%` 变量自动套白色粗体，正文里手写的具体数字不会变色，须**手动**包成 `<font color='#FFFFFF'><b>数字</b></font>`（白色粗体，模拟引擎数值样式；参考钢背兽、影魔觉醒）。每个技能的强化各占一行（`<br>` 分隔）。

### 4) 物品描述

在觉醒石 `_Description` 的「支持的英雄」列表里加上该英雄名（中英同步）。

### 5) 觉醒预览页

在 `src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx` 的 `AWAKEN_ABILITIES` 加一条 `{ heroName, abilityName }`。该列表是配置表的展示副本，需手动同步，否则新觉醒不会出现在个人中心「觉醒」页。

### 6) 验证

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

> 参考：斧王 `axe_auto_culling_blade` ↔ `axe_culling_blade`。

### 进阶 2：autocast 自动触发（自动施放）

「开 autocast 后自动检测施放」类觉醒，**已有共享基类 `AutoCastAbility`（`src/vscripts/abilities/ts_abilities/shared/auto-cast-ability.ts`），直接继承，不要重复造轮子**：

- KV：`BaseClass ability_lua`、`AbilityBehavior` = `NO_TARGET | IMMEDIATE | AUTOCAST`、`ScriptFile` 指向 `abilities/ts_abilities/...` 编译产物，**不写 `Modifiers`**（intrinsic modifier 由基类提供）。
- 继承 `AutoCastAbility`，只实现 `OnAutoCastThink(caster)`；需要时覆写 `getThinkInterval()`（默认 0.3）。共享 `modifier_autocast_think` 负责 `IsServer / IsAlive / GetAutoCastState` 守卫后回调。
- 基类 helper：`getFullCastRange`（含施法距离增强）、`findEnemiesInRange(caster, range, targetType, allowMagicImmune?)`（始终排除迷雾/隐身，可选命中魔免）、`castImmediatelyOnTarget`。
- 施放用 **`CastAbilityImmediately`**：玩家英雄的背景自动施放**不能**用 order 式（`CastAbilityOnTarget` 等会打断玩家移动/攻击）。新基类/helper 统一放 `ts_abilities/shared/`。

> 参考：斧王 `ts_abilities/axe_auto_culling_blade.ts`（斩杀线阈值 + 可打魔免）、宙斯 `ts_abilities/special_bonus_unique_zuus_upgrade.ts`（英雄优先、雷击仅英雄、不打魔免）。

### 进阶 3：监听某技能施法后触发效果

要在「英雄施放某个特定技能后」附带效果。下面两种实现**不是对等选项**，按步骤 2 的选型优先级选（① 被动属性加成尤其可能卡顿的 → DataDriven ② 逻辑技能 → TS ③ 纯 Lua 只维护已有不从零写；详见 `custom-ability` skill）：监听 + 造成伤害是**逻辑**，**从零新增一律走 TS**；DataDriven 一节仅作为「维护已有 datadriven 技能」的范例，不要据此从零新写。

- **TS intrinsic modifier（从零新增首选）**：`@registerModifier` 的 modifier 在 `DeclareFunctions` 声明事件，回调里判 `event.unit == parent` 且 `event.ability.GetAbilityName() == "目标技能名"`。不依赖技能 behavior，最通用。**先想清触发时机选对事件**：
  - `MODIFIER_EVENT_ON_ABILITY_START` → `OnAbilityStart`：**前摇开始**就触发（玩家可在前摇结束前取消施法）。只适合需要前摇期就生效的效果（如前摇加魔免防打断，见影魔现有觉醒）。**不要**用它结算附加伤害——玩家取消施法即可反复白嫖。
  - `MODIFIER_EVENT_ON_ABILITY_FULLY_CAST` → `OnAbilityFullyCast`：**前摇走完、真正 OnSpellStart** 才触发，等价「释放完成」。附加伤害/附加效果一律用这个。目标技能是单体指向时，伤害数值可直接 `event.ability.GetSpecialValueFor("xxx")` 读触发技能当前等级的值，天然随其等级/神杖/天赋分级，无需自带 KV 数值。
- **DataDriven modifier（仅维护已有）**：KV `Modifiers` 加 `"Passive" "1"` 常驻 modifier（配 `"RemoveOnDeath" "0"` + `"Attributes" "MODIFIER_ATTRIBUTE_PERMANENT"`），用 **`OnAbilityExecuted`** 块 `RunScript`。被施放的技能是 **`keys.event_ability`**（不是 `keys.ability`），施法者 `keys.caster`。主动技（如 `UNIT_TARGET`）上也会常驻触发。

> **关键坑**：不要为了让 listener 常驻而给主动技 `AbilityBehavior` 叠加 `DOTA_ABILITY_BEHAVIOR_PASSIVE`——实测会使该主动技**无法施放**。DataDriven 的 `Passive` modifier 不依赖技能 behavior 即可常驻，保持原主动 behavior 即可。

> 参考：影魔 `ability_lua` + `GetIntrinsicModifierName` 监听 `nevermore_requiem`；PA `ability_datadriven`（`UNIT_TARGET`，未加 PASSIVE）的 `modifier_pa_awaken_dagger_listener` 用 `OnAbilityExecuted`；宙斯 `special_bonus_unique_zuus_upgrade` 是 PASSIVE datadriven 监听范例。

### 进阶 4：数值仅觉醒后生效（special_bonus 关联）

想让原技能某个 KV 数值「仅在该英雄拥有觉醒技能时改变」（运行时无法干净改的固定值，如投射物速度），用**觉醒技能名**作 `special_bonus` key 写进原技能 override KV：

```
"dagger_speed"
{
    "value"                                         "1200"
    "special_bonus_unique_phantom_assassin_upgrade" "=2100"   // 觉醒后覆盖
}
```

`=值` 覆盖、`+值` 增加。引擎检测英雄拥有该 key 同名技能时自动应用。

> **关键坑：key 必须是 `special_bonus_` 前缀的技能名**。引擎靠前缀识别哪些子 key 是「bonus 覆盖」，非此前缀的子 key 被当无关元数据**静默忽略**（数值不变，无报错）。觉醒技能即使是普通可学习主动技（如 PA `special_bonus_unique_phantom_assassin_upgrade` 是 `UNIT_TARGET` 主动），只要名字带前缀就能当 key；反之，不带前缀的觉醒技能名（如曾用的 `sniper_assassinate_upgrade`）写进去不生效，须把觉醒技能**重命名**为 `special_bonus_unique_*`（连带改抽奖池引用、Lua 类名、本地化 key；ScriptFile 路径/Lua 文件名可不动，仅同步文件内 ability 类名）。该 key 技能还须被英雄拥有且等级 ≥ 1 才应用。

> 参考：PA 觉醒后潜匿之刺 `dagger_speed` 1200→2100；狙击手 `special_bonus_unique_sniper_assassinate_upgrade` 觉醒后爆头 `proc_chance` `=100`。

### 进阶 5：加魔免但不顶替真 BKB

给英雄加魔免时，直接 `AddNewModifier("modifier_black_king_bar_immune")` 会缩短/顶掉玩家自己的 BKB。一律走全局工具函数（`game/scripts/vscripts/util.lua`）：

```lua
ApplyAwakenMagicImmunity(unit, ability, duration)
```

已有相等或更长的 BKB 时跳过，否则加魔免 + 播音效，**返回是否实际施加**。

**前摇加魔免要防取消刷新**：魔免绑在 `ON_ABILITY_START`（前摇开始）触发时，玩家可在前摇结束前取消再施法反复刷新（取消不进 CD、不耗蓝）。防法：仅当 `ApplyAwakenMagicImmunity` 返回 true 才启动取消检测；`StartIntervalThink` 轮询 `IsInAbilityPhase()`，前摇结束后若 `GetCooldownTimeRemaining() <= 0`（被取消）则移除；**移除前判据**——仅当 `modifier_black_king_bar_immune` 剩余 ≤ 本次魔免时长才 `Destroy()`，**绝不无条件 `RemoveModifierByName`**（同名 modifier 区分不了来源，会误删真 BKB）。

> 参考：影魔 `special_bonus_unique_nevermore_upgrade.lua` 的 `OnIntervalThink` 取消检测；PA 闪烁/匕首魔免。

---

## 不明确时询问

遇到这些决策点用 `AskUserQuestion` 菜单询问，不要自行假设：
- 操作类型不明（新增 vs 替换 vs 插入）
- 数值/效果「仅觉醒后生效」还是「全局对该英雄生效」
- 等级是否需要与某技能关联
- 主动技是否要做成自动触发
