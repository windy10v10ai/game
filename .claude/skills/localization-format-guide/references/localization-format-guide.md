# 本地化文件格式指南

## 概述

本文档记录了 `game/resource/addon_schinese.txt` 和 `game/resource/addon_english.txt` 本地化文件的格式要求、同步规范和维护策略。

语言文件位于 `game/resource/`,使用 Valve 的 KeyValues 格式。

## 格式要求

### 1. 缩进和对齐

- **统一使用两个 tab 缩进**
- **键名和值之间使用多个 tab 对齐**，使所有值从同一位置开始
- **空行保持一致**

**示例**：

```
		// item_beast_armor 兽化甲
		"DOTA_Tooltip_Ability_item_beast_armor"											"兽化甲"
		"DOTA_Tooltip_ability_item_beast_armor_Description"								"<h1>主动：不粘锅</h1>..."
		"DOTA_Tooltip_ability_item_beast_armor_Lore"									"集四大神器之力于一身的终极护甲..."
		"DOTA_Tooltip_ability_item_beast_armor_bonus_strength"							"+$all"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_health"							"+$health"
```

### 2. 注释格式

- **注释使用中文，不翻译**
- **中英文版本中的注释必须完全一致**（直接复制中文注释到英文文件）
- 格式：`// item_name 中文名称`

### 3. HTML 标签同步

描述文本中的 HTML 标签格式必须在中英文版本中保持一致：

#### 换行符规则

- **使用 `\n` 分隔不同的 `<h1>` 标题部分**
- **使用 `<br><br>` 用于段落内的换行**

**一个物品同时有主动+被动时**，两个 `<h1>` 段落之间用 `\n`（或内容较长时用 `\n\n`）分隔，**不要**用 `<br><br>` 衔接——`<br>` 系列只用在同一段落内部换行。参考既有写法：

```
"<h1>主动：伤害反弹</h1>...伤害提升%active_reflection_pct%%%。\n<h1>被动：伤害反弹</h1>...反弹%passive_reflection_constant%..."
```

（`item_blade_mail_2`、`item_sphere_2` 等均为此惯例，中英文版本的分隔符必须一致）

#### 标签使用规范

- `<h1>标题</h1>` - 用于主要标题（主动、被动等）
- `<br>` 或 `<br><br>` - 用于段落内换行
- `\n` - 用于分隔不同的主要部分
- `<font color='#RRGGBB'>文本</font>` - 用于颜色文本

#### 颜色代码规范

- **不强制大小写**，但同一个色值内部字母大小写需一致（如 `#A74BD1` 或 `#a74bd1`，不要 `#A74Bd1` 这种混写）

#### 常见术语与颜色对照（参考官方中文本地化归纳）

来源：`docs/reference/<version>/abilities_schinese.txt` 中官方对高频状态词的着色约定，以及项目内已有文案（莉娜天赋、Artoria 系列技能等）使用的伤害类型着色约定，归纳自高频用法（非穷举）。新增技能/物品描述遇到下列词时，优先沿用对应颜色，保持与官方视觉语言一致。**官方英文文本通常不对这些词加色**，本项目按现有规则中英文标签仍需保持一致（见上方"HTML 标签同步"）。

| 中文术语 | English | 颜色 | 备注 |
|---|---|---|---|
| 纯粹伤害 | Pure Damage | `#FFE56E` | 金色，项目既有约定 |
| 魔法伤害 | Magic Damage | `#05CAFF` | 蓝色，项目既有约定 |
| 眩晕 / 击晕 | Stun | `#2DD5E4` | 最高频状态色 |
| 沉默 | Silence | `#6DB6E9` | 禁止施法 |
| 缴械 | Disarm | `#AFB912` | 禁止普攻 |
| 锁闭 | Muted（物品） | `#C3E1DB` | 禁止使用物品，常与沉默/缴械三件套连用（如妖术、灭寂） |
| 破坏 | Break | `#DD621E` | 使被动技能失效 |
| 减益免疫 | Debuff Immunity | `#D76907` | |
| 状态抗性 | Status Resistance | `#B99012` | |
| 减速抗性 | Slow Resistance | `#9EC8E3` | |
| 隐身 / 隐形 | Invisible | `#D7CCC7` | |
| 恐惧 | Fear | `#1EDDB7` | |
| 虚无 | Ethereal | `#57E550` | 无法攻击/被攻击，受到的魔法伤害增加 |
| 束缚 | Leash | `#E3D59E` | 超出范围会打断的牵制效果 |
| 缠绕 | Entangle | `#CAE96D` | 生根类禁锢 |
| 相位移动 | Phased | `#9019E3` | 无视单位碰撞、无法被减速 |
| 治疗 / 回复 | Heal | `#07D738` | |
| 作用范围 | AoE / Radius | `#C450E5` | |
| 护盾（通用/全伤害） | Shield / Barrier | `#B97812` | 吸收任意类型伤害 |
| 物理伤害护盾 | Physical Damage Barrier | `#B94512` | 仅吸收物理伤害 |
| 魔法伤害护盾 / 法术护盾 | Magic Damage Barrier / Spell Shield | `#1278B9` | 仅吸收魔法伤害 |
| 阿哈利姆神杖 / 阿哈利姆魔晶 | Aghanim's Scepter / Shard | `#92ACF5` | |
| 红色强调（警告或负面属性变动） | — | `#E03E2E` | 用于"无法丢弃/无法摧毁"等警告文案，或攻击力、护甲等属性被削减时的数值强调 |
| 灰色补充说明 | — | `#7D7D7D` | 圆括号内的补充说明，如"（仅对远程有效）" |

#### 常用措辞对照

- **魔法抗性降低的叠加方式**：不写"（固定值）"，写"（减法叠加）"（英文 `(flat)` → `(additive)`），这是 Dota 术语里区分"减法叠加 vs 乘法叠加"的标准说法，比"固定值"更准确
- **全属性总和类描述**：中文写`[自身属性总和]`，不写`[你的全属性]`，对齐英文固定写法 `the sum of all your attributes`

### 4. 补全 Modifier 说明

所有物品和技能的 modifier 都必须包含完整的说明：

```
		"DOTA_Tooltip_modifier_item_name_active"										"状态名称"
		"DOTA_Tooltip_modifier_item_name_active_Description"							"状态描述"

		"DOTA_Tooltip_modifier_item_name_debuff"										"Debuff名称"
		"DOTA_Tooltip_modifier_item_name_debuff_Description"							"Debuff描述"

		"DOTA_Tooltip_modifier_item_name_aura"											"Aura名称"
		"DOTA_Tooltip_modifier_item_name_aura_Description"								"Aura描述"
```

#### Modifier 描述中的变量使用

Modifier 描述中可以使用变量，使用 `%dMODIFIER_PROPERTY_XXX%` 格式：

```
"移动速度降低%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%，攻击速度降低%dMODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT%"
```

**坑：`%key%` 引用技能自身 `AbilityValues` 在 modifier 里不生效**——`%dMODIFIER_PROPERTY_XXX%` 之所以能用，是因为它读的是 modifier 自己 KV 声明的 `Properties` 值；而直接照搬 ability 描述里的 `%splinter_targets%` 之类、引用技能 `AbilityValues` 字段的写法，对 `ability_lua`/纯脚本类技能的 modifier（没有 KV `Properties` 块）不生效，会显示空白或吞掉百分号。ability 自身的描述不受影响，仍可正常用 `%key%`。

**modifier 想显示自定义动态数值（非标准 MODIFIER_PROPERTY 枚举），用 `MODIFIER_PROPERTY_TOOLTIP`**：仅对 Lua/TS 脚本类 modifier 有效（DataDriven modifier 没有脚本可实现，只能写死数字）。modifier 脚本里 `DeclareFunctions` 加 `MODIFIER_PROPERTY_TOOLTIP`（TS 写 `ModifierFunction.TOOLTIP`），实现 `OnTooltip(): number` 返回目标值（如读 ability 的 `GetSpecialValueFor`），本地化用 `%dMODIFIER_PROPERTY_TOOLTIP%` 占位。同一 modifier 最多两个动态值，第二个用 `MODIFIER_PROPERTY_TOOLTIP2`/`OnTooltip2`/`%dMODIFIER_PROPERTY_TOOLTIP2%`。数值会随等级/天赋变化时优先用这个，而不是写死（实测：卓尔游侠裂影箭觉醒分裂概率会被天赋提升，改用此机制而非写死数字）。只有真正固定不变的数值才写死。**`%dMODIFIER_PROPERTY_TOOLTIP%` 不会自动套白色粗体**（与 ability 的 `%key%` 不同，实测确认），要手动包 `<font color='#FFFFFF'><b>...</b></font>`，和写死数值一样处理。

### 5. AbilityValues 数值展示方式

一条 `AbilityValues` 数值只能选其一种展示方式，不要两处都写：

- **内联在 Description/Note 正文**：用 `%xxx%` 直接嵌进句子里，不额外定义 `_xxx` 标签行
- **单独成行**：定义 `_xxx` 标签行（如 `"DOTA_Tooltip_ability_xxx_search_radius" "SEARCH RADIUS:"`），正文不再用 `%xxx%` 复述

**多个关联数值**（同一机制下的若干档位/字段，如持续时间、每秒次数、削减幅度）建议各自单独成行，方便玩家在数值面板逐条对照。**孤立的单个数值**（只影响一处、不成体系）两种方式都可以，按哪种更通顺易读来选，但同一个数值不要既内联又单独成行——那样正文会显得重复。

## 中英文版本同步要求

### 1. 格式一致性

- **所有格式必须完全一致**（缩进、对齐、空行）
- 英文版本应严格按照中文版本的格式进行对齐

### 2. 内容完整性

- **所有条目都必须同时存在于中英文版本中**
- 新增条目时，必须同时在两个文件中添加
- 删除条目时，必须同时在两个文件中删除

### 3. 必须完全一致的内容

- **键名（Key）**：必须完全相同
- **Tab 格式**：缩进和对齐必须完全一致
- **HTML 标签**：位置和格式必须完全一致
- **数值占位符**：`%xxx%%%` 格式必须完全一致
- **注释**：注释内容必须完全一致（使用中文）

### 4. 翻译文本要求

- **翻译文本保持意思大致相同即可**，不需要逐字翻译
- 但必须保持核心含义和功能描述准确

### 5. 条目对应关系检查清单

- [ ] 注释格式一致（使用中文）
- [ ] 所有条目都存在
- [ ] HTML 标签格式一致（特别是 `\n` 和 `<br>` 的使用）
- [ ] 颜色代码同一色值内部大小写一致
- [ ] Tab 对齐一致
- [ ] 空行位置一致
- [ ] 数值占位符格式一致

## 维护注意事项

1. 每次修改本地化文件时，必须同时检查格式和对齐
2. 添加新条目时，确保格式符合规范
3. 同步中英文版本时，不仅要同步内容，还要同步格式
4. 提交前检查：检查是否有格式错误
5. 避免使用 TODO 注释：所有条目都应该完整补全

## 语言文件维护策略

- **中文 (`addon_schinese.txt`)**：必须维护 - 添加所有新键
- **英文 (`addon_english.txt`)**：必须维护 - 添加所有新键
- **俄文 (`addon_russian.txt`)**：仅维护 UI 相关键（Panorama 界面文本）；技能/物品/游戏逻辑类键不翻译

## 添加新的本地化键

1. 添加到中文文件（`addon_schinese.txt`）
2. 添加到英文文件（`addon_english.txt`）
3. 若为 UI 相关键，同步添加到俄文文件（`addon_russian.txt`）
4. 技能/物品/游戏逻辑类键不添加到俄文文件

## 中文标点符号规范

**重要**：中文本地化文本必须使用全角标点符号（`，` `。` `：` `？` `！`），不要使用半角标点（`,` `.` `:` `?` `!`）。

## 查找 Dota 2 官方技能名称

当添加项目语言文件中不存在的 Dota 2 技能时，从参考文件中查找官方翻译（示例路径见文档原文）。

## 本地化通用规则

尽量使用标准通用变量翻译（如 `$damage`、`$all` 等）替代直接文本。

## 在代码中使用

```xml
<Label text="#my_new_key" />
```

```javascript
$.Localize("#my_new_key");
```

## 文件格式

- 格式：Valve KeyValues
- 编码：UTF-8 with BOM

## 相关文件

- `game/resource/addon_schinese.txt`
- `game/resource/addon_english.txt`
- `game/resource/addon_russian.txt`（仅维护现有键）

