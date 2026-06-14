---
name: custom-ability
description: 从零自制一个全新自定义技能时使用——BaseClass 为 ability_datadriven / ability_lua / TS @registerAbility 的非继承技能。核心是「DataDriven vs Lua vs TS」实现选型（含性能取舍）与通用技法库（被动 intrinsic modifier、autocast 自动触发、施法监听、special_bonus 关联、加魔免）。区别于 clone-ability（继承原版差分克隆）与 awaken-ability（觉醒石替换槽位）。当用户说「写一个新技能」「自制技能」「这个技能用 datadriven/lua/ts 怎么写」「纯属性加成技能」「自动触发/施法监听技法」等时触发。
---

# 自定义技能（从零自制）

写一个**全新**技能（不继承原版数值、不走觉醒替换）。先用下表确认这是不是该用的 skill：

| 场景 | skill |
| ---- | ---- |
| 继承原版技能差分改数值/行为（`BaseClass` = 原版名） | `clone-ability` |
| 觉醒石替换/插入英雄技能槽 | `awaken-ability` |
| **从零自制**（`BaseClass` = `ability_datadriven` / `ability_lua` / TS `@registerAbility`） | **本 skill** |

> 图标、本地化、KV tab 缩进、`#base` 引入、技能系统名查找、参考文件路径 —— 全部见 CLAUDE.md「图片资源管理」「Dota 2 参考文件速查」与 `localization-format-guide`，本文不重复。

---

## 第一步：实现方式选型（先定这个）

| 技能内容 | 推荐实现 | 原因 |
| ---- | ---- | ---- |
| **含被动属性加成**（攻击/护甲/属性/移速/抗性…） | **DataDriven**（KV `Modifiers`→`Properties`） | 引擎原生求值，**无 per-frame Lua 回调**，性能最好 |
| 无属性、逻辑简单 | **Lua 或 TS** | 看与周边一致 / 个人偏好 |
| **逻辑复杂**（状态机、多文件依赖、要 jest、要复用 `src/` 类型） | **TS（TSTL）** | 类型安全；ts 编译不是负担（开发环境自动编译） |
| 既有属性又有逻辑 | 属性走 DataDriven/KV，逻辑部分 Lua/TS | 各取所长 |
| 已有 Lua 实现 | **保持 Lua** | 不强制迁移，无收益 |

### 性能：高频查询的属性一律走 DataDriven

Lua modifier 的每个 `GetModifier*` 属性都是「引擎每次查询 → 回调一次 Lua」。单位越多、查询越频繁越卡。**以下属性用 Lua 实现会明显卡顿，纯数值加成时必须用 DataDriven `Properties`**：

- 移速：`MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE`
- 攻速 / 攻击伤害：`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`、`MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`
- 护甲 / 魔抗 / 状态抵抗：`MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`、`MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING`
- 伤害增减：`MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`
- 属性：`MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

> 实测范例：`game/scripts/npc/npc_items_modifier.txt` —— 项目里这些属性加成**全部**因为卡顿迁成了 DataDriven `Modifiers`/`Properties`，不再用 Lua。新写纯属性技能照此办。

---

## 第二步：三种 BaseClass 的落点与骨架

### A. DataDriven（`ability_datadriven`）— 属性 / 声明式触发首选

KV 直接写 `Modifiers`，数值用 `%key` 引 `AbilityValues`（范式见 `npc_items_modifier.txt`）：

```
"my_ability"
{
    "BaseClass"             "ability_datadriven"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_PASSIVE"
    "AbilityTextureName"    "some_icon"
    "AbilityValues" { "bonus_armor" "10" }
    "Modifiers"
    {
        "modifier_my_ability"
        {
            "Passive"           "1"
            "IsHidden"          "1"
            "RemoveOnDeath"     "0"
            "Properties" { "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS" "%bonus_armor" }
        }
    }
}
```

含逻辑时用 `OnAbilityExecuted` / `OnIntervalThink` 等事件块 `RunScript` 调一段 Lua（见技法库「施法监听」）。

### B. 纯 Lua（`ability_lua`）

实现放 `game/scripts/vscripts/abilities/<name>.lua`，`class({})` + `LinkLuaModifier`，**不经 TSTL**，改完 `script_reload` 热重载。被动技能标准写法：`GetIntrinsicModifierName()` 返回一个隐藏内置 modifier，无需学习即生效，可调值全从 KV `AbilityValues` 读。

```lua
my_ability = class({})
function my_ability:GetIntrinsicModifierName() return "modifier_my_ability" end

LinkLuaModifier("modifier_my_ability", "abilities/my_ability", LUA_MODIFIER_MOTION_NONE)
modifier_my_ability = class({})
function modifier_my_ability:IsHidden() return true end
```

KV `BaseClass` = `ability_lua`，`ScriptFile` = `abilities/<name>`。

### C. TS（TSTL）— 逻辑复杂 / 要复用 src 类型

实现放 `src/vscripts/abilities/`（范例 `src/vscripts/abilities/ts_abilities/ward_slot/`），用装饰器自动注册，从 `utils/dota_ts_adapter` 扩展 `BaseAbility` / `BaseModifier`：

```ts
import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility('my_ability')
export class MyAbility extends BaseAbility {
  OnSpellStart(): void { /* ... */ }
}
```

KV `BaseClass` 同样写 `ability_lua`、`ScriptFile` 指向 TSTL 编译产物路径。引擎枚举成员用 normalized 名（`UnitFilterResult.FAIL_CUSTOM`，见 CLAUDE.md）。

---

## 通用技法库

按需取用。每项有项目内真实落地参考。

### 被动 intrinsic modifier

无需学习即常驻：技能 `GetIntrinsicModifierName()` 返回一个 `IsHidden` 的 modifier。被动数值优先用 DataDriven `Properties`（性能）；需要程序判定的才在 Lua/TS modifier 里算。

### autocast 自动触发（主动技自动施放）

主动技手动按键违和时，改为「开 autocast 后自动检测施放」，保留原窗口/CD：

- KV `AbilityBehavior` 含 `DOTA_ABILITY_BEHAVIOR_AUTOCAST`。
- 加常驻被动 modifier（`GetIntrinsicModifierName`），低频 `StartIntervalThink`。think 内：`GetAutoCastState()` 开 + 目标技能 `IsFullyCastable()`（CD+蓝就绪）+ 检测到目标 → `SetCursorCastTarget/Position` + `CastAbilityImmediately`。
- 检测目标的判定抽成技能层一个方法（如 `FindXxxTarget()`），被动 think 与主动 `OnSpellStart` 共用，避免重复。

> 参考：斧王 `game/scripts/vscripts/abilities/axe_auto_culling_blade.lua`（autocast 自动斩杀，`FindCullableEnemy` 共用）。

### 监听某技能施法后触发效果

要在「英雄施放某个特定技能后」附带效果：

- **Lua/TS intrinsic modifier**：modifier `DeclareFunctions` 返回 `MODIFIER_EVENT_ON_ABILITY_START`，`OnAbilityStart(keys)` 判断 `keys.unit == parent` 且 `keys.ability:GetAbilityName() == "目标技能名"`。不依赖技能 behavior，最通用。
- **DataDriven modifier**：KV `Modifiers` 加 `"Passive" "1"` 常驻 modifier（配 `"RemoveOnDeath" "0"` + `"Attributes" "MODIFIER_ATTRIBUTE_PERMANENT"`），用 **`OnAbilityExecuted`** 块 `RunScript`。被施放的技能是 **`keys.event_ability`**（不是 `keys.ability`），施法者 `keys.caster`。主动技（如 `UNIT_TARGET`）上也会常驻触发。

> **关键坑**：不要为了让 listener 常驻而给主动技 `AbilityBehavior` 叠加 `DOTA_ABILITY_BEHAVIOR_PASSIVE`——实测会使该主动技**无法施放**。DataDriven 的 `Passive` modifier 不依赖技能 behavior 即可常驻，保持原主动 behavior 即可。

> 参考：影魔 `ability_lua` + `GetIntrinsicModifierName` 监听 `nevermore_requiem`；PA `ability_datadriven`（`UNIT_TARGET`，未加 PASSIVE）的 `modifier_pa_awaken_dagger_listener` 用 `OnAbilityExecuted`；宙斯 `special_bonus_unique_zuus_upgrade` 是 PASSIVE datadriven 监听范例。

### 数值仅「英雄拥有某技能时」生效（special_bonus 关联）

想让某 KV 数值「仅在英雄拥有指定技能时改变」（运行时无法干净改的固定值，如投射物速度），用那个技能名作 `special_bonus` key 写在原技能 override KV：

```
"dagger_speed"
{
    "value"                                         "1200"
    "special_bonus_unique_phantom_assassin_upgrade" "=2100"   // 拥有该技能时覆盖
}
```

`=值` 覆盖、`+值` 增加。引擎检测英雄拥有该 key 同名技能时自动应用。

> 参考：PA `dagger_speed` 1200→2100。

### 加魔免但不顶替真 BKB

给英雄加魔免时，直接 `AddNewModifier("modifier_black_king_bar_immune")` 会缩短/顶掉玩家自己的 BKB。一律走全局工具函数（`game/scripts/vscripts/util.lua`）：

```lua
ApplyAwakenMagicImmunity(unit, ability, duration)
```

已有相等或更长的 BKB 时跳过，否则加魔免 + 播音效，**返回是否实际施加**。

**前摇加魔免要防取消刷新**：魔免绑在 `ON_ABILITY_START` 时，玩家可在前摇结束前取消再施法反复刷新（取消不进 CD、不耗蓝）。防法：仅当 `ApplyAwakenMagicImmunity` 返回 true 才启动取消检测；`StartIntervalThink` 轮询 `IsInAbilityPhase()`，前摇结束后若 `GetCooldownTimeRemaining() <= 0`（被取消）则移除；**移除前判据**——仅当 `modifier_black_king_bar_immune` 剩余 ≤ 本次魔免时长才 `Destroy()`，**绝不无条件 `RemoveModifierByName`**（同名 modifier 区分不了来源，会误删真 BKB）。

> 参考：影魔 `special_bonus_unique_nevermore_upgrade.lua` 的 `OnIntervalThink`；PA 闪烁/匕首魔免。

---

## 收尾

- **图标 / 本地化 / `#base` 引入新 KV 文件** → 见 CLAUDE.md 与 `localization-format-guide`。
- **进抽奖池** → 在 `src/vscripts/modules/lottery/lottery-abilities.ts`（及 `lottery-abilities-bot.ts`）加技能名。
- **bot 会用** → 见 `bot-ability-usage`。
- **验证** → 纯 Lua `script_reload` 实跑；TS 仅在收尾跑一次 `npm run build:vscripts` 看是否报错，不读编译产物；运行时行为靠 jest（自己的分支逻辑）+ Dota tools 实跑。

## 不明确时询问

用 `AskUserQuestion` 菜单确认，不要自行假设：
- 实现方式（datadriven / lua / ts）当语义不明时
- 技能是被动属性、主动逻辑还是混合
- 主动技是否做成 autocast 自动触发
- 数值是「全局对该英雄生效」还是「仅拥有某技能时生效」
