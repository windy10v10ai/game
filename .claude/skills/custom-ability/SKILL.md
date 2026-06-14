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

**默认优先级**（同等可行时）：① DataDriven + 少量 Lua → ② TS → ③ 纯 Lua。

- ①② 之间按**复杂度**选，不是「先试 ① 再升级」：简单/声明式走 ①，复杂/有状态（状态机、要 jest、复用 `src/` 类型）直接 ②。
- ① 里的「少量 Lua」是补 DataDriven 的**动态值短板**（读运行时 spell amp / 智力等 KV 静态值表达不了的量），不写主体逻辑；那段 Lua 一旦不再「少量」、开始承载状态逻辑，就是切 ② 的信号。
- ③ 仅指**维护已有纯 Lua**，不从零新写纯 Lua（既无类型又无声明式便利，是最差组合）。

### 性能：高频查询的属性一律走 DataDriven

Lua modifier 的每个 `GetModifier*` 属性都是「引擎每次查询 → 回调一次 Lua」。单位越多、查询越频繁越卡。**以下属性用 Lua 实现会明显卡顿，纯数值加成时必须用 DataDriven `Properties`**：

- 移速：`MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE`
- 攻速 / 攻击伤害：`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`、`MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`
- 护甲 / 魔抗 / 状态抵抗：`MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`、`MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING`
- 伤害增减：`MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`
- 属性：`MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

> 实测范例：`game/scripts/npc/npc_items_modifier.txt` —— 项目里这些属性加成**全部**因为卡顿迁成了 DataDriven `Modifiers`/`Properties`，不再用 Lua。新写纯属性技能照此办。

> **例外（按规模豁免）**：上面「必须 DataDriven」针对的是**单位多 / 查询频繁**的规模。当 (1) 数值是**动态的**、DataDriven 静态 `%value` 表达不了（如召唤物要按召唤瞬间施法者的 spell amp / 智力放大），且 (2) 作用单位很少（几个召唤物），可用 Lua modifier：`OnCreated` 缓存一次值、`GetModifier*` 返回缓存，单查询开销可忽略。参考巫医觉醒 `special_bonus_unique_witch_doctor_upgrade`（死亡守卫按 spell amp 放大攻击）。

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

## 进阶技法

觉醒及「自动施放」类技法——autocast 自动触发（含共享基类 `AutoCastAbility`）、监听某技能施法、加魔免不顶 BKB、`special_bonus` 仅特定技能时生效——目前都只由觉醒技能使用，集中在 **`awaken-ability`** 的「进阶」章节，需要时去那里查。

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
