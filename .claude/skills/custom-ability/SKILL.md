---
name: custom-ability
description: 从零自制新技能（TS 实现，非克隆、非觉醒）。
---

# 自定义技能（从零自制）

从零写全新技能：TS `@registerAbility`，KV `BaseClass` = `ability_lua`。继承原版差分走 `clone-ability`，觉醒槽位替换走 `awaken-ability`。KV 格式与 `#base` 见 `game/scripts/npc/CLAUDE.md`，文案见 `game/resource/CLAUDE.md`，图标走 `add-image`。

## 第一步：先查复用

写之前自己对着 `../../references/vanilla-modifiers.md` 过一遍：原版 modifier 是引擎原生 C++，能挑到就不用自己实现。技能常用的是清单「通用状态」一节：眩晕、禁锢、沉默、无敌、击退、定时死亡、魔免，以及「原版技能 modifier」一节里的现成效果（背刺、霜箭减速、锚击瞬击标记）。

清单只收录本仓已在用的，不是全集。里面没有但原版确实有对应技能时，按该文件「表外的怎么找」查出 modifier 名再试。

## 第二步：实现方式选型

**从零新增一律走 TS（TSTL）**：类型安全，能 jest，能复用 `src/` 的 helper 与类型。

| 情况 | 怎么做 |
| ---- | ---- |
| **从零新增**（绝大多数） | **TS** |
| 已有纯 Lua 实现 | **保持 Lua**，不强制迁移，无收益 |
| 已有 DataDriven 实现 | **保持 DataDriven**，仅维护 |

技能通常没有常驻属性加成，DataDriven 的声明式优势用不上，反而丢掉类型检查；纯 Lua 两头都没有。

> **例外：技能确实要挂常驻数值属性时**，Lua/TS modifier 的每个 `GetModifier*` 都是「引擎每查一次 → 回一次 Lua」，单位多时会卡。作用单位少（几个召唤物）可以照写，`OnCreated` 缓存一次值、`GetModifier*` 返回缓存即可（参考巫医觉醒 `special_bonus_unique_witch_doctor_upgrade`，死亡守卫按 spell amp 放大攻击）。作用面大且是纯静态常量时才值得改走 KV `Modifiers`→`Properties`；物品侧的完整取舍见 `custom-item` skill 的「回调税」一节。


## 第三步：骨架

实现放 `src/vscripts/abilities/`（范例 `src/vscripts/abilities/ts_abilities/ward_slot/`），用装饰器自动注册，从 `utils/dota_ts_adapter` 扩展 `BaseAbility` / `BaseModifier`：

```ts
import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility('my_ability')
export class MyAbility extends BaseAbility {
  OnSpellStart(): void { /* ... */ }
}
```

KV `BaseClass` 写 `ability_lua`、`ScriptFile` 指向 TSTL 编译产物路径 `abilities/ts_abilities/<name>`。引擎枚举成员用 normalized 名（`UnitFilterResult.FAIL_CUSTOM`，见 `src/vscripts/CLAUDE.md`）。

被动技能标准写法：`GetIntrinsicModifierName()` 返回一个隐藏内置 modifier，无需学习即生效，可调值全从 KV `AbilityValues` 读。

维护已有 DataDriven / 纯 Lua 技能的骨架 → `references/legacy-skeletons.md`。


## 进阶技法

autocast 自动触发（共享基类 `AutoCastAbility`）、监听某技能施法、加魔免不顶 BKB、`special_bonus` 仅特定技能时生效、借用原生 hardcoded modifier —— 这些目前都只由觉醒技能使用，集中在 `../awaken-ability/references/advanced-techniques.md`，需要时按标题去查。

### 弹道命中判定：用原生 `OnProjectileHit`

`ProjectileManager:CreateTrackingProjectile` / `CreateLinearProjectile` 传入 `Ability = self` 后，弹道真正命中目标时引擎会自动调用技能类的 `OnProjectileHit(target, location)`（创建时传了 `ExtraData` 则是 `OnProjectileHit_ExtraData(target, location, data)`）。伤害/眩晕等命中效果写在这个回调里结算，手算「距离 ÷ 移速」再开 `Timers:CreateTimer` 只是估算，目标中途位移/闪现会跑偏，也绕过了闪避判定。`bIsAttack = true` 不会让引擎自动重复结算一次攻击伤害，回调里手动 `ApplyDamage` / `PerformAttack` 不冲突。参考 `heroes/hero_sniper/sniper_assassinate_upgrade.lua`。


## 收尾

- **进抽奖池** → 在 `src/vscripts/modules/lottery/lottery-abilities.ts`（及 `lottery-abilities-bot.ts`）加技能名。
- **bot 会用** → 见 `bot-ability-usage`。
- **验证** → `npm run build:vscripts` 看报错；运行时行为靠 jest（自己的分支逻辑）+ Dota tools 实跑（`dota-live-test`）。维护已有纯 Lua 时 `script_reload` 实跑。

## 不明确时询问

用 `AskUserQuestion` 菜单确认：
- 技能是被动属性、主动逻辑还是混合
- 主动技是否做成 autocast 自动触发
- 数值是「全局对该英雄生效」还是「仅拥有某技能时生效」
