# 本地化格式细则

`game/resource/CLAUDE.md`「文案规约」的展开：写技能/物品描述、modifier 说明、着色时查这份。三个文件是 Valve KeyValues，UTF-8 无 BOM，行尾 CRLF。

## 对齐

两个 tab 缩进，键与值之间多个 tab 对齐，让值从同一列开始。注释格式 `// item_name 中文名称`，三语文件里都用这句中文：

```
		// item_beast_armor 兽化甲
		"DOTA_Tooltip_Ability_item_beast_armor"											"兽化甲"
		"DOTA_Tooltip_ability_item_beast_armor_Description"								"<h1>主动：不粘锅</h1>..."
		"DOTA_Tooltip_ability_item_beast_armor_bonus_strength"							"+$all"
```

## 标签与换行

- `<h1>标题</h1>` 用于主动、被动等主标题；不同 `<h1>` 段落之间用 `\n`（内容长时 `\n\n`）分隔
- `<br>` / `<br><br>` 只用于同一段落内换行
- 主动 + 被动的写法参考 `item_blade_mail_2`、`item_sphere_2`：`"<h1>主动：…</h1>…。\n<h1>被动：…</h1>…"`
- `<font color='#RRGGBB'>文本</font>` 着色；同一个色值内部字母大小写一致（`#A74BD1` 或 `#a74bd1`）
- 能用通用变量（`$damage`、`$all` 等）时优先用

## 术语着色

新描述遇到下列词时沿用对应颜色。官方英文文本通常不着色，本项目三语标签保持一致。

| 中文术语 | English | 颜色 | 备注 |
|---|---|---|---|
| 纯粹伤害 | Pure Damage | `#FFE56E` | |
| 魔法伤害 | Magic Damage | `#05CAFF` | |
| 眩晕 / 击晕 | Stun | `#2DD5E4` | |
| 沉默 | Silence | `#6DB6E9` | |
| 缴械 | Disarm | `#AFB912` | |
| 锁闭 | Muted（物品） | `#C3E1DB` | 常与沉默/缴械连用 |
| 破坏 | Break | `#DD621E` | |
| 减益免疫 | Debuff Immunity | `#D76907` | |
| 状态抗性 | Status Resistance | `#B99012` | |
| 减速抗性 | Slow Resistance | `#9EC8E3` | |
| 隐身 / 隐形 | Invisible | `#D7CCC7` | |
| 恐惧 | Fear | `#1EDDB7` | |
| 虚无 | Ethereal | `#57E550` | |
| 束缚 | Leash | `#E3D59E` | |
| 缠绕 | Entangle | `#CAE96D` | |
| 相位移动 | Phased | `#9019E3` | |
| 治疗 / 回复 | Heal | `#07D738` | |
| 作用范围 | AoE / Radius | `#C450E5` | |
| 护盾（通用/全伤害） | Shield / Barrier | `#B97812` | |
| 物理伤害护盾 | Physical Damage Barrier | `#B94512` | |
| 魔法伤害护盾 / 法术护盾 | Magic Damage Barrier / Spell Shield | `#1278B9` | |
| 阿哈利姆神杖 / 魔晶 | Aghanim's Scepter / Shard | `#92ACF5` | |
| 警告或负面属性变动 | — | `#E03E2E` | 「无法丢弃」、属性被削减的数值 |
| 灰色补充说明 | — | `#7D7D7D` | 圆括号内补充，如「（仅对远程有效）」 |
| 自动施法 | Autocast | `#00CED1` | 与警告红色区分 |
| 觉醒强化 | Awakening Bonus | `#d000ff` | 与技能标题的觉醒标记同色 |

「自动施法：」「觉醒强化：」这类段落标题写成 `<font color='#颜色'>标题：</font>说明文字`，标题与说明同一行（参考 `elder_titan_ancestral_spirit_awaken`、`special_bonus_unique_bristleback_upgrade`）。

## 措辞

- 魔抗降低按实现标注：Lua modifier 的 `MAGICAL_RESISTANCE_DIRECT_MODIFICATION` 写「（减法叠加）」/ `(additive)` / `(вычитается)`；`MAGICAL_RESISTANCE_BONUS` 是乘法，不加标注。两者算法见 `datadriven-properties.md`「魔抗的两种叠加」
- 全属性总和写 `[自身属性总和]`，对齐英文 `the sum of all your attributes`
- 「自动施法」指 `DOTA_ABILITY_BEHAVIOR_AUTOCAST` 的开关型自动触发（如法力之盾）；「多样施法」指同一技能可切换多种施法方式（如萨尔岩浆流）。技能走 `AUTOCAST` 行为时写「自动施法」
- 中文用全角标点；数字、英文、HTML、占位符保持原样

## AbilityValues 数值展示

一个数值只选一种展示方式：

- **内联**：Description/Note 正文里用 `%xxx%`，不定义 `_xxx` 标签行
- **单独成行**：定义 `_xxx` 标签行（如 `"DOTA_Tooltip_ability_xxx_search_radius" "SEARCH RADIUS:"`），正文不再用 `%xxx%`

同一机制下的多个关联数值（持续时间、次数、削减幅度）各自单独成行；孤立的单个数值按通顺选一种。

## modifier 说明

每个 modifier 都有 `DOTA_Tooltip_modifier_<name>` 与 `_Description` 两条：

- `_Description` 写效果本身（照 ability 的描述写），末尾再接当前累计/动态数值
- ability 那边单独成行展示的数值，modifier 正文里用 `%dMODIFIER_PROPERTY_TOOLTIP%` / `%dMODIFIER_PROPERTY_TOOLTIP2%` 内联补回来（每个 modifier 最多两个，超出的用文字概括或拆 modifier）
- 占位符用 `%dMODIFIER_PROPERTY_XXX%`，读的是 modifier 自己声明的 `Properties` 值。ability 的 `%key%` 在没有 KV `Properties` 块的 `ability_lua`/脚本 modifier 里显示空白
- 自定义动态数值用 `MODIFIER_PROPERTY_TOOLTIP`（仅 Lua/TS modifier）：`DeclareFunctions` 加 `ModifierFunction.TOOLTIP`，`OnTooltip()` 返回值，第二个用 `TOOLTIP2` / `OnTooltip2`。值随等级/天赋变化时用它，真正固定的才写死
- **`OnTooltip` 只返回实例字段**：tooltip 在客户端渲染，现调 `GetSpecialValueFor` 会失败、占位符被吞掉只剩百分号。在 `OnCreated` / `OnRefresh` 里、`if (!IsServer()) return;` 之前缓存值（参考 `windrunner_whirlwind_custom.ts` 的 `refreshValues`）
- `%dMODIFIER_PROPERTY_TOOLTIP%` 不会自动套白色粗体，手动包 `<font color='#FFFFFF'><b>...</b></font>`

## 代码里引用

`<Label text="#my_new_key" />`、`$.Localize("#my_new_key")`。
