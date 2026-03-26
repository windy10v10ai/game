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

#### 标签使用规范

- `<h1>标题</h1>` - 用于主要标题（主动、被动等）
- `<br>` 或 `<br><br>` - 用于段落内换行
- `\n` - 用于分隔不同的主要部分
- `<font color='#RRGGBB'>文本</font>` - 用于颜色文本

#### 颜色代码规范

- **所有颜色代码必须使用大写字母**

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
- [ ] 颜色代码使用大写字母
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
- **俄文 (`addon_russian.txt`)**：仅维护现有键 - 不要添加新键

## 添加新的本地化键

1. 添加到中文文件（`addon_schinese.txt`）
2. 添加到英文文件（`addon_english.txt`）
3. 不要添加到俄文文件（`addon_russian.txt`）- 仅在键已存在时更新

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

