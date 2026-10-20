# 可写进 DataDriven `Properties` 的属性

自制物品（`custom-item`）与玩家属性（`src/vscripts/modules/property/`）把数值常量写成 DataDriven `Properties` 时查这份。DataDriven 由引擎原生求值，不交 Lua 回调税；写错属性名或用了不支持的属性不会报错，只会静默不生效。

下列属性可直接写 KV `Properties`，**均为本仓已在用的**，出现次数取自 `npc_items_custom.txt` / `npc_items_artifact.txt` / `npc_items_modifier.txt`：

**基础属性**

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

**攻击相关**

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`、`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_ATTACK_RANGE_BONUS`
- `MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE`（暴击倍率；触发概率用 `Random` 事件块，见下）

**防御相关**

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`
- `MODIFIER_PROPERTY_EVASION_CONSTANT`、`MODIFIER_PROPERTY_MISS_PERCENTAGE`
- `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`

**移动相关**

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE` / `_UNIQUE`、`MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE`
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE`

**生命 / 魔法 / 视野**

- `MODIFIER_PROPERTY_HEALTH_BONUS`、`MODIFIER_PROPERTY_MANA_BONUS`
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT`、`MODIFIER_PROPERTY_MANA_REGEN_CONSTANT`
- `MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE`
- `MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE`、`MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE`
- `MODIFIER_PROPERTY_BONUS_DAY_VISION`、`MODIFIER_PROPERTY_BONUS_NIGHT_VISION`

**法术相关**

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE`、`MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE`
- `MODIFIER_PROPERTY_CASTTIME_PERCENTAGE`（施法前摇缩短，写 `50` 前摇 ×0.5，多件按乘法叠加）

实测过的属性与原版物品、Lua modifier 的同类加成按加法叠加，互不覆盖。

表里没有的属性名不代表一定不行（DataDriven 支持面比这更宽），但**没有本仓先例**，先在 Dota Tools 验证再铺开。

**已确认不可用**，命中直接留在脚本侧，不要试图下沉：

- `MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING`
- `MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING`
- `MODIFIER_PROPERTY_AOE_BONUS_CONSTANT_STACKING`
- `MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT`（写 `"1"` 挂上后移速仍卡在上限）
- `States` 里的 `MODIFIER_STATE_UNSLOWABLE`（挂上后减速照常生效）
- `MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DIRECT_MODIFICATION`（减法减魔抗只有 Lua modifier 的 `GetModifierMagicalResistanceDirectModification` 生效，算法见下节）
- `MODIFIER_PROPERTY_MANACOST_PERCENTAGE` / `_STACKING`（蓝耗降低改挂 `modifier_item_enhancement_mystical`，见 `vanilla-modifiers.md`）
- `MODIFIER_PROPERTY_SLOW_RESISTANCE_STACKING` / `_UNIQUE`（减速抗性同理只能借原版 modifier）
- `MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE`（上表的 `HP_REGEN_AMPLIFY_PERCENTAGE` 是回复放大，语义不同，替代不了；非 UNIQUE 的 `HEALTH_REGEN_PERCENTAGE` 可用，但多件同时生效时会叠加）

`npc_items_custom.txt` 里那几处 `（不在可优化列表）` 注释指的就是这份名单。

## 魔抗的两种叠加

实测得出的结算顺序：

- **减法**（`MAGICAL_RESISTANCE_DIRECT_MODIFICATION`）改的是基础魔抗：基础值、智力魔抗、项目给每个英雄挂的 `modifier_intelect_magic_resist`、各来源的减法值先直接相加
- **乘法**（`MAGICAL_RESISTANCE_BONUS`，KV 可用）再逐项相乘：受到的魔法伤害 = (1 − 基础魔抗合计) × Π(1 − 各项加成)，减魔抗 −x 即乘 (1 + x)
- **减益免疫**（BKB 的 `modifier_black_king_bar_immune`）单位无视来自减益的减魔抗，乘法与减法都无效，魔抗按 BKB 自身的 `spell_reduce` 计

基础魔抗越高，同样数值的减法相对伤害提升越大（90% 魔抗减 20：伤害 ×3），乘法始终是固定倍率（乘 20%：×1.2）。说明文字的叠加标注按实现选，见 `localization-format.md`「措辞」。

新确认一个属性能用或不能用时（实机读引擎数值核对），补进上面对应的列表。
