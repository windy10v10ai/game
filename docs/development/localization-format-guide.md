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

**正确示例**：

```
		// item_beast_armor 兽化甲
		// 蝴蝶效应·蓝武（攻击触发）
```

**错误示例**：

```
		// item_beast_armor Beast Armor  ❌
		// Butterfly Effect: Blue (Attack Trigger)  ❌
```

### 3. HTML 标签同步

描述文本中的 HTML 标签格式必须在中英文版本中保持一致：

#### 换行符规则

- **使用 `\n` 分隔不同的 `<h1>` 标题部分**
- **使用 `<br><br>` 用于段落内的换行**

**示例**：

```
"Description"	"<h1>主动：不粘锅</h1>...描述内容...。\n<h1>被动：伤害反弹</h1>...描述内容...。<br><br>每%block_cooldown%秒被动抵挡一次指向性法术。\n<h1>被动：辉耀灼烧</h1>...描述内容...。"
```

#### 标签使用规范

- `<h1>标题</h1>` - 用于主要标题（主动、被动等）
- `<br>` 或 `<br><br>` - 用于段落内换行
- `\n` - 用于分隔不同的主要部分
- `<font color='#RRGGBB'>文本</font>` - 用于颜色文本

#### 颜色代码规范

- **所有颜色代码必须使用大写字母**
- 格式：`<font color='#RRGGBB'>文本</font>`

**正确示例**：

```
<font color='#0096FF'>蝴蝶效应 · 蓝武</font>
<font color='#A74ABD'>蝴蝶效应 · 紫啸</font>
<font color='#87CEEB'>蝴蝶效应 · 青凝</font>
```

**错误示例**：

```
<font color='#a74abd'>蝴蝶效应 · 紫啸</font>  ❌
<font color='#87ceeb'>蝴蝶效应 · 青凝</font>  ❌
```

### 4. 补全 Modifier 说明

所有物品和技能的 modifier 都必须包含完整的说明：

**必须包含的条目**：

```
		"DOTA_Tooltip_modifier_item_name_active"										"状态名称"
		"DOTA_Tooltip_modifier_item_name_active_Description"							"状态描述"

		"DOTA_Tooltip_modifier_item_name_debuff"										"Debuff名称"
		"DOTA_Tooltip_modifier_item_name_debuff_Description"							"Debuff描述"

		"DOTA_Tooltip_modifier_item_name_aura"											"Aura名称"
		"DOTA_Tooltip_modifier_item_name_aura_Description"								"Aura描述"
```

**示例**：

```
		"DOTA_Tooltip_modifier_item_beast_armor_active"									"不粘锅"
		"DOTA_Tooltip_modifier_item_beast_armor_active_Description"						"反弹所有伤害和指向性技能，免疫指向性法术。"

		"DOTA_Tooltip_modifier_item_beast_armor_debuff"									"极寒冲击"
		"DOTA_Tooltip_modifier_item_beast_armor_debuff_Description"						"移动速度降低%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%，攻击速度降低%dMODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT%，魔法抗性降低%dMODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS%%%。"
```

#### Modifier 描述中的变量使用

Modifier 描述中可以使用变量，使用 `%dMODIFIER_PROPERTY_XXX%` 格式：

```
"移动速度降低%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%，攻击速度降低%dMODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT%"
```

## 中英文版本同步要求

### 1. 格式一致性

- **所有格式必须完全一致**（缩进、对齐、空行）
- 英文版本应严格按照中文版本的格式进行对齐

### 2. 内容完整性

- **所有条目都必须同时存在于中英文版本中**
- 新增条目时，必须同时在两个文件中添加
- 删除条目时，必须同时在两个文件中删除

### 3. 必须完全一致的内容

以下内容在中英文版本中必须**完全一致**，不能有任何差异：

- **键名（Key）**：必须完全相同
- **Tab 格式**：缩进和对齐必须完全一致
- **HTML 标签**：`<h1>`、`<br>`、`<font>` 等标签的位置和格式必须完全一致
- **数值占位符**：`%xxx%%%` 格式必须完全一致
- **注释**：注释内容必须完全一致（使用中文）

**示例**：

```
// 中文版本
"DOTA_Tooltip_ability_item_example_Description"				"<h1><font color='#A74ABD'>主动：技能名</h1>描述内容。<br><br>持续时间: %duration% 秒"

// 英文版本（格式必须完全一致）
"DOTA_Tooltip_ability_item_example_Description"				"<h1><font color='#A74ABD'>Active: Skill Name</h1>Description content.<br><br>Duration: %duration% seconds"
```

### 4. 翻译文本要求

- **翻译文本保持意思大致相同即可**，不需要逐字翻译
- 可以适当调整表达方式以符合目标语言习惯
- 但必须保持核心含义和功能描述准确

### 5. 条目对应关系

确保中英文版本的条目顺序和结构保持一致：

**检查清单**：

- [ ] 注释格式一致（使用中文）
- [ ] 所有条目都存在
- [ ] HTML 标签格式一致（特别是 `\n` 和 `<br>` 的使用）
- [ ] 颜色代码使用大写字母
- [ ] Tab 对齐一致
- [ ] 空行位置一致
- [ ] 数值占位符格式一致

## 参考示例

完整示例（item_beast_armor）：

```kv
		// item_beast_armor 兽化甲
		"DOTA_Tooltip_Ability_item_beast_armor"											"兽化甲"
		"DOTA_Tooltip_ability_item_beast_armor_Description"								"<h1>主动：不粘锅</h1>发出极寒冲击波，对%blast_radius%范围内敌人造成%blast_damage%点魔法伤害，降低%movement_slow%%%移动速度和%attack_slow%攻击速度，降低%spell_resist_reduction%%%魔法抗性。同时反弹%active_reflection_pct%%%所有伤害并反弹指向性技能，持续%active_duration%秒。\n<h1>被动：伤害反弹</h1>每次受到攻击时，反弹%passive_reflection_constant% + 所受攻击伤害的%passive_reflection_pct%%%。<br><br>每%block_cooldown%秒被动抵挡一次指向性法术。\n<h1>被动：辉耀灼烧</h1>每秒对%aura_radius%范围内敌军造成%aura_damage%点魔法伤害，并使其物理攻击有%blind_pct%%%几率不会命中。"
		"DOTA_Tooltip_ability_item_beast_armor_Lore"									"集四大神器之力于一身的终极护甲，兽化符文赋予了它无与伦比的防御和反击能力。"
		"DOTA_Tooltip_ability_item_beast_armor_Note0"									"反弹的均为减免前的伤害。"
		"DOTA_Tooltip_ability_item_beast_armor_Note1"									"伤害反弹不会反弹来自其他刃甲的伤害。"
		"DOTA_Tooltip_ability_item_beast_armor_Note2"									"反弹伤害的类型与受到时相同。"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_strength"							"+$all"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_health"							"+$health"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_armor"								"+$armor"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_spell_resist"						"%+$spell_resist"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_health_regen"						"+$hp_regen"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_mana_regen"						"+$mana_regen"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_damage"							"+$damage"
		"DOTA_Tooltip_ability_item_beast_armor_evasion"									"%+$evasion"

		"DOTA_Tooltip_modifier_item_beast_armor_active"									"不粘锅"
		"DOTA_Tooltip_modifier_item_beast_armor_active_Description"						"反弹所有伤害和指向性技能，免疫指向性法术。"

		"DOTA_Tooltip_modifier_item_beast_armor_debuff"									"极寒冲击"
		"DOTA_Tooltip_modifier_item_beast_armor_debuff_Description"						"移动速度降低%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%，攻击速度降低%dMODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT%，魔法抗性降低%dMODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS%%%。"

		"DOTA_Tooltip_modifier_item_beast_armor_radiance"								"辉耀灼烧"
		"DOTA_Tooltip_modifier_item_beast_armor_radiance_Description"					"每秒对周围敌人造成灼烧伤害。"

		"DOTA_Tooltip_modifier_item_beast_armor_radiance_enemy_aura"					"灼烧伤害"
		"DOTA_Tooltip_modifier_item_beast_armor_radiance_enemy_aura_Description"		"每秒受到%dMODIFIER_PROPERTY_TOOLTIP%点伤害，而且攻击有%dMODIFIER_PROPERTY_MISS_PERCENTAGE%%%几率不会命中。"
```

## 维护注意事项

1. **每次修改本地化文件时**，必须同时检查格式和对齐
2. **添加新条目时**，确保格式符合规范
3. **同步中英文版本时**，不仅要同步内容，还要同步格式
4. **提交前检查**：使用 linter 检查是否有格式错误
5. **避免使用 TODO 注释**：所有条目都应该完整补全

## 语言文件维护策略

- **中文 (`addon_schinese.txt`)**: 必须维护 - 添加所有新键
- **英文 (`addon_english.txt`)**: 必须维护 - 添加所有新键
- **俄文 (`addon_russian.txt`)**: 仅维护现有键 - 不要添加新键

## 添加新的本地化键

当添加需要翻译的新 UI 元素或文本时:

1. **添加到中文文件** (`addon_schinese.txt`):

   ```
   "my_new_key"    "我的新文本"
   ```

2. **添加到英文文件** (`addon_english.txt`):

   ```
   "my_new_key"    "My New Text"
   ```

3. **不要添加到俄文文件** (`addon_russian.txt`) - 仅在键已存在时更新

## 中文标点符号规范

**重要**: 中文本地化文本必须使用全角标点符号（`，` `。` `：` `？` `！`），不要使用半角标点（`,` `.` `:` `?` `!`）。

### 标点符号使用规则

- **不使用分号（`；`）和顿号（`、`）**
- **根据上下文使用逗号（`，`）和句号（`。`）替代**
  - 并列的词语或短语之间使用逗号（`，`）
  - 完整的句子之间使用句号（`。`）
  - 句子内部的停顿使用逗号（`，`）

**示例**：

```
// ❌ 错误
"item_description"    "主动: 一念成佛。持续 4 秒,造成伤害。"
"item_description"    "技能包括：攻击、防御、治疗；效果持续10秒。"
"item_description"    "获得力量、敏捷、智力加成。"

// ✅ 正确
"item_description"    "主动：一念成佛。持续 4 秒，造成伤害。"
"item_description"    "技能包括：攻击，防御，治疗。效果持续10秒。"
"item_description"    "获得力量，敏捷，智力加成。"
```

**注意**：数字、英文字母、HTML 标签和变量占位符（如 `%active_duration%`）保持原样。

## 查找 Dota 2 官方技能名称

当添加项目语言文件中不存在的 Dota 2 技能时，从参考文件中查找官方翻译：

1. **在参考文件中搜索**，位于 `docs/reference/7.39/`：

   - 英文：`abilities_english.txt`
   - 中文：`abilities_schinese.txt`

2. **搜索模式**：使用技能内部名称(例如 `medusa_split_shot`)查找条目：

   ```
   English: "DOTA_Tooltip_ability_medusa_split_shot"    "Split Shot"
   Chinese: "DOTA_Tooltip_ability_medusa_split_shot"    "分裂箭"
   ```

3. **示例工作流**:

   ```bash
   # Search for the ability name in reference files
   grep "luna_moon_glaive" docs/reference/7.39/abilities_english.txt
   grep "luna_moon_glaive" docs/reference/7.39/abilities_schinese.txt

   # Results will show:
   # English: "DOTA_Tooltip_ability_luna_moon_glaive"    "Moon Glaives"
   # Chinese: "DOTA_Tooltip_ability_luna_moon_glaive"    "月刃"
   ```

**注意**：参考文件来自 Dota 2 版本 7.39，包含所有标准技能的 Valve 官方翻译。

## 本地化通用规则

**重要**：在对数值进行描述时，如果有标准通用翻译，应该使用它替代直接文本。

**规则示例**：

❌ **错误** - 直接使用文本：

```
"DOTA_T_ability_item_time_gem_manacost_reduction"    "%+魔法消耗降低"
```

✅ **正确** - 使用标准通用翻译：

```
"DOTA_Tooltip_ability_item_time_gem_manacost_reduction"    "%+$manacost_reduction"
```

**标准通用变量翻译列表**：

以下列表中的变量可以在工具提示中使用，系统会自动用对应的中文文本替换 `$variable_name`：

| 中文文本                                              | 变量名                           |
| ----------------------------------------------------- | -------------------------------- |
| 生命值                                                | `$health`                        |
| 魔法值                                                | `$mana`                          |
| 护甲                                                  | `$armor`                         |
| 攻击力                                                | `$damage`                        |
| 力量                                                  | `$str`                           |
| 智力                                                  | `$int`                           |
| 敏捷                                                  | `$agi`                           |
| 全属性                                                | `$all`                           |
| 主属性                                                | `$primary_attribute`             |
| 攻击速度                                              | `$attack`                        |
| 基础攻击速度                                          | `$attack_pct`                    |
| 生命恢复                                              | `$hp_regen`                      |
| 吸血                                                  | `$lifesteal`                     |
| 魔法恢复                                              | `$mana_regen`                    |
| 魔法恢复光环                                          | `$mana_regen_aura`               |
| 技能伤害                                              | `$spell_amp`                     |
| 负面状态持续时间                                      | `$debuff_amp`                    |
| 移动速度                                              | `$move_speed`                    |
| 闪避                                                  | `$evasion`                       |
| 魔法抗性                                              | `$spell_resist`                  |
| 技能吸血                                              | `$spell_lifesteal`               |
| 对英雄的攻击                                          | `$spell_lifesteal_hero_attacks`  |
| 对英雄的技能                                          | `$spell_lifesteal_hero_spells`   |
| 对非英雄的攻击                                        | `$spell_lifesteal_creep_attacks` |
| 对非英雄的技能                                        | `$spell_lifesteal_creep_spells`  |
| 对英雄的攻击                                          | `$lifesteal_hero_attacks`        |
| 对英雄的技能                                          | `$lifesteal_hero_spells`         |
| 对非英雄的攻击                                        | `$lifesteal_creep_attacks`       |
| 对非英雄的技能                                        | `$lifesteal_creep_spells`        |
| 所选属性                                              | `$selected_attribute`            |
| 攻击距离<font color='#7d7d7d'>（仅对远程有效）</font> | `$attack_range`                  |
| 攻击距离<font color='#7d7d7d'>（仅对近战有效）</font> | `$attack_range_melee`            |
| 攻击距离<font color='#7d7d7d'>（近战/远程）</font>    | `$attack_range_all`              |
| 施法距离                                              | `$cast_range`                    |
| 状态抗性                                              | `$status_resist`                 |
| 弹道速度                                              | `$projectile_speed`              |
| 魔法消耗降低                                          | `$manacost_reduction`            |
| 冷却时间减少                                          | `$cooldown_reduction`            |
| 额外最大魔法值                                        | `$max_mana_percentage`           |
| 减速抗性                                              | `$slow_resistance`               |
| 作用范围加成                                          | `$aoe_bonus`                     |
| 移动速度加成                                          | `$exclusive_movespeed`           |
| 对外治疗增强                                          | `$healing_amp`                   |
| 生命回复                                              | `$restoration_amp`               |

**使用方法**：

在工具提示中使用变量名而不是直接文本：

```
"DOTA_Tooltip_ability_item_time_gem_manacost_reduction"    "%+$manacost_reduction"
"DOTA_Tooltip_ability_item_example_damage"                "+$damage"
"DOTA_Tooltip_ability_item_example_attributes"            "+$str / $agi / $int 属性"
```

系统会自动将 `$variable_name` 替换为对应的本地化文本。

## 在代码中使用

在 XML/Panorama 中引用本地化键：

```xml
<Label text="#my_new_key" />
```

或在 JavaScript/TypeScript 中:

```javascript
$.Localize("#my_new_key");
```

## 文件格式

- 格式：Valve KeyValues (具有特定结构的 `.txt` 文件)
- 编码：UTF-8 with BOM
- **缩进**：详见[格式要求](#格式要求)部分
- 结构：
  ```
  "lang"
  {
      "Language"  "schinese"  // or "english", "russian"
      "Tokens"
      {
          "key_name"    "translated text"
      }
  }
  ```

## 相关文件

- `game/resource/addon_schinese.txt` - 简体中文本地化文件
- `game/resource/addon_english.txt` - 英文本地化文件
- `game/resource/addon_russian.txt` - 俄文本地化文件（仅维护现有键）
