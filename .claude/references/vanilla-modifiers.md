# 可复用的原版 modifier 清单

自制物品 / 技能时优先从这里挑，能挑到就不用自己实现——原版 modifier 是引擎原生 C++，不交回调税。

**下表全部是本仓已在用、已验证的，远不是全集**。表里没有不代表做不到——原版有对应物品/技能时，按文末「表外的怎么找」去查名字再试，不要直接放弃转为自己实现。

## 两种挂法

```kv
// KV（模式 1）：临时效果，引擎按 Duration 自动摘
"ApplyModifier"
{
    "ModifierName"  "modifier_black_king_bar_immune"
    "Target"        "CASTER"
    "Duration"      "%active_duration"
}
```

```lua
-- 脚本（两个模式都行）：永久型必须自己在 OnDestroy 摘掉
caster:AddNewModifier(caster, ability, "modifier_item_devastator", {})
```

传进去的 `ability` 决定这个 modifier 读谁的 `AbilityValues`——**这就是「连属性一起复用」的来源**，也是同名字段双倍的来源。字段规则见 SKILL.md 第一步。

**来源直接传自己的技能或物品，不要 `CreateItem` 造隐藏的原版物品**：数值由传入 `ability` 的 `AbilityValues` 提供，在自己的 KV 里按原版字段名写好即可（如觉醒魔免 `awaken-magic-immunity.ts` 传觉醒技能本身）。用隐藏原版物品当来源时，部分原版 modifier 不生效，容易误判成「原版 modifier 只能在物品栏用」。

**表现差异不妨碍复用**：原版 modifier 在状态栏多出一个原版图标（如原版光环 buff）这类差异可以接受，原版能提供的效果（属性、光环、普攻吸血）照样交给原版，自制部分只补原版没有的。

**光环优先用原版**：光环 modifier 的挂摘、属性求值、光环里的普攻吸血全由引擎处理，单位再多也不进 Lua。小兵混战实测（两队各 24 个兵对砍）原版光环比「KV 光环 + Lua 登记吸血」每帧少约 0.5 ms，且没有单位被移除后登记残留的报错。原版光环覆盖不到的效果（如攻速光环）再用 KV 光环补，不用 Lua/TS 写 `IsAura` 光环（实测挂不稳）。

**原版吸血只认真实普攻**：脚本 `ApplyDamage` 造的物理伤害不触发原版吸血 modifier，核对回血用 `PerformAttack`，并延迟一帧再读血量。

## 通用状态

不绑定任何物品/技能，任何地方都能直接挂。

| modifier | 效果 | 参数 | 仓库先例 |
| --- | --- | --- | --- |
| `modifier_stunned` | 眩晕 | `duration` | 全仓最常复用的一个，19 个文件在用 |
| `modifier_rooted` | 禁锢 | `duration` | `event-npc-spawned.ts` |
| `modifier_silence` | 沉默 | `duration` | `Debug.ts` |
| `modifier_invulnerable` | 无敌 | `duration` | `primal_split.lua` |
| `modifier_knockback` | 击退位移 | 需传位移参数表（距离/高度/时长） | `item_heavens_halberd_v2.ts`、`liu_kick.lua` |
| `modifier_kill` | 到期杀死宿主 | `duration` | 给眼位/召唤物设寿命，`ability_ward_observer_slot.ts` |
| `modifier_black_king_bar_immune` | 魔免（BKB） | `duration` | `item_beast_shield` KV、`awaken-magic-immunity.ts` |
| `modifier_fountain_glyph` | 防御符文 | `duration` | `event-npc-spawned.ts` |

眩晕别自己写：`modifier_stunned` 已是全仓统一写法，配 `duration` 即可。给敌人挂的时长引擎不会按状态抗性缩短，TS 里先过 `calculateStatusResistedDuration`（规则见 `src/vscripts/CLAUDE.md`），遗留 Lua 里乘 `1 - target:GetStatusResistance()`。

## 原版物品 modifier

复用时在**自己**的 KV 按原版字段名写数值，字段名查 `docs/reference/<version>/items.txt` 对应物品的 `AbilityValues`。

| modifier | 来源物品 | 效果 | 仓库先例 |
| --- | --- | --- | --- |
| `modifier_item_blade_mail` | 刃甲 | 被动反伤 + 属性 | `item_beast_armor` |
| `modifier_item_blade_mail_reflect` | 刃甲 | 主动反伤（带 `duration`） | `item_beast_armor` |
| `modifier_item_battlefury` | 狂战斧 | 溅射 + 属性 | `item_magic_sword` |
| `modifier_item_desolator` | 黯灭 | 攻击减甲 + 属性 | `item_hawkeye_turret`、`item_magic_sword` |
| `modifier_item_devastator` | 圣斧 | 智力转伤害 / 减魔抗 + 属性 | `item_magic_crit_blade` |
| `modifier_item_eternal_shroud` | 永世法衣 | 法伤转魔法 + 属性 | `item_beast_shield` |
| `modifier_item_gungir` | 缚灵索 | 攻击触发群体禁锢 + 属性 | `item_forbidden_staff` |
| `modifier_item_angels_demise` | 绝刃 | 被动本体 | `item_shadow_impact` |
| `modifier_item_angels_demise_slow` / `_break` | 绝刃 | 减速 / 破坏（带 `duration`） | `item_shadow_impact` |
| `modifier_item_lotus_orb_active` | 清莲宝珠 | 反弹指向性法术（带 `duration`） | `item_saint_orb.ts`、`item_beast_armor` |
| `modifier_heavens_halberd_debuff` | 天堂之戟 | 缴械（带 `duration`） | `item_heavens_halberd_v2.ts` |
| `modifier_item_force_staff_motion` | 原力法杖 | 直线位移（带 `duration`） | `item_force_staff` |
| `modifier_item_swift_blink_buff` | 迅疾闪光 | 攻速/移速增益 | `item_jump_jump_jump` |
| `modifier_item_overwhelming_blink_debuff` | 盛势闪光 | 减速（带 `duration`） | `item_jump_jump_jump` |
| `modifier_item_arcane_blink_buff` | 秘奥闪光 | 施法前摇与蓝耗降低，读旧版字段 `cast_pct_improvement` / `manacost_reduction`（当前原版 KV 已删这两个字段，引擎仍认，已实测）（带 `duration`） | `item_jump_jump_jump` |
| `modifier_item_meteor_hammer` | 陨星锤 | 被动属性（三维 / 技能增强 / 魔法恢复增强） | `item_jump_jump_jump` |
| `modifier_item_meteor_hammer_burn` | 陨星锤 | 燃烧伤害 + 减速，单位与建筑分别读 `burn_dps_units` / `burn_dps_buildings`（带 `duration`） | `item_jump_jump_jump` |
| `modifier_item_blink_dagger` | 跳刀 | 受敌方英雄或肉山伤害后让整件物品进入 `blink_damage_cooldown` 冷却，`item_lua` 物品也生效 | `item_jump_jump_jump` |
| `modifier_item_vladmir` | 弗拉迪米尔的祭品 | 光环：吸血、基础攻击力、回蓝、护甲，对英雄与范围内友方小兵生效（小兵吸血 ×0.6），读 `lifesteal_aura` / `damage_aura` / `mana_regen_aura` / `armor_aura` / `aura_radius` | `item_vladmir_2` |
| `modifier_item_ultimate_scepter` | 阿哈利姆神杖 | 神杖效果（`duration = -1` 为永久） | `item_ultimate_scepter_2` |
| `modifier_item_buff_ward` | 侦察守卫 | 眼位存在状态 | `ability_ward_observer_slot.ts` |
| `modifier_item_ward_true_sight` | 岗哨守卫 | 真视 | `ability_ward_sentry_slot.ts` |

## 原版技能 modifier

借某个英雄技能的现成效果。

| modifier | 来源 | 效果 | 仓库先例 |
| --- | --- | --- | --- |
| `modifier_tidehunter_anchor_smash_caster` | 潮汐猎人 锚击 | 包在 `PerformAttack` 外层标记「技能触发的瞬间攻击」，10 个技能统一这么写 | `sword_master_tap.lua`、`artoria_strike_air.lua` |
| `modifier_riki_backstab` | 力丸 刀光谍影 | 背后攻击加伤 | `windrunner_whirlwind_custom.ts` |
| `modifier_drow_ranger_frost_arrows_slow` | 卓尔游侠 霜冻之箭 | 攻击减速（带 `duration`） | `special_bonus_unique_drow_ranger_upgrade.ts` |
| `modifier_brewmaster_belligerent_damage` | 酒仙 元素分离 | 分身增伤 | `primal_split.lua` |
| `modifier_brewmaster_void_brawler_slow` | 酒仙 元素分离 | 分身减速 | `primal_split.lua` |

`modifier_tidehunter_anchor_smash_caster` 的写法固定为 挂 → `PerformAttack` → 立即摘，照抄先例即可，不要只挂不摘。

## 表外的怎么找

原版 modifier 名是引擎内部名，**KV 文件里没有**（`grep items.txt` 查不到不代表不存在）。按下面顺序找，找到候选就先试：

**1. 原版本地化反查**——覆盖所有**可见** buff/debuff（玩家能看到图标的那些），`abilities_schinese.txt` 里有 2596 个 `DOTA_Tooltip_modifier_*` 键：

```bash
# 已知是哪件物品/技能：用它的系统名当关键词
grep -o "DOTA_Tooltip_modifier_.*blade_mail.*" docs/reference/<version>/abilities_schinese.txt
# 只知道中文效果名：先搜中文定位到键，再取键里的 modifier 名
grep "缴械" docs/reference/<version>/abilities_schinese.txt
```

**2. 猜命名惯例**——**隐藏的被动 modifier 没有 tooltip，本地化里查不到**（圣斧、缚灵索、绝刃的被动本体都是这种）。多数是 `modifier_` + 物品系统名，但**有例外，只能当候选**：

| 物品 | modifier | 偏差 |
| --- | --- | --- |
| `item_blade_mail` | `modifier_item_blade_mail` | 无，直接拼 |
| `item_bfury` | `modifier_item_battlefury` | 用的是全名不是系统名缩写 |
| `item_heavens_halberd` | `modifier_heavens_halberd_debuff` | 没有 `item_` 前缀 |

**3. 查文档**——上面两步都没结果时走 `dota-docs-lookup` skill（ModDota API 索引 / Valve Wiki）。

**4. 实机验证**——名字猜错**不会报错**，只是静默没效果。拿到候选后必须在 Dota Tools 里挂上去确认真的生效，不要凭名字看着像就写进代码。

四步都没找到，才按 SKILL.md 第二步选模式自己实现。
