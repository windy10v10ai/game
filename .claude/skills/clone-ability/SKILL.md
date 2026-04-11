---
name: clone-ability
description: >-
  Create or fix a custom KV ability that inherits from a vanilla Dota ability
  (BaseClass = original ability name). Handles both innate and regular source
  abilities. Stops and asks for manual handling if BaseClass is ability_lua or
  ability_datadriven. Uses interactive menus for ambiguous decisions.
---

# 自定义继承技能（新建 / 修正）

将原版 Dota 技能（先天或普通）克隆为自定义技能名，写入本图 KV 并补全本地化。

---

## 第一步：前置交互（不明确时用菜单询问）

**遇到任何不确定的情况，必须通过 `AskUserQuestion` 工具以选项菜单询问，不得自行假设。**

### 1-A 目标文件（用户未指定时询问）

> 「请选择目标文件」

| 选项 | 文件 | 说明 |
|------|------|------|
| 抽奖池技能 | `game/scripts/npc/npc_abilities_custom_lottery.txt` | 随机抽奖系统 |
| 单位 / 英雄专属技能 | `game/scripts/npc/npc_abilities_custom.txt` | 特定单位或自定义英雄 |

### 1-B 操作模式（用户未明确时询问）

> 「请选择操作」

| 选项 | 说明 |
|------|------|
| 新建技能 | 从原版技能克隆，写入目标文件 |
| 修正现有技能 | 比对原版，修正已有自定义块的错误或缺失 |

---

## 第二步：BaseClass 类型检查

读取**目标技能块**（新建时读用户指定的原版名；修正时读现有块）的 `BaseClass`：

| BaseClass 值 | 处理 |
|---|---|
| 原版技能名（如 `dragon_knight_dragon_blood`） | 继续 |
| `ability_datadriven` | **停止**：「该技能为 DataDriven 类型，请人工处理。」 |
| `ability_lua` | **停止**：「该技能为 Lua 类型，请人工处理。」 |

---

## 第三步：识别原版技能类型

在 `docs/reference/<版本>/heroes/npc_dota_hero_<英雄>.txt`（或合并本 `npc_abilities.txt`）中定位原版技能块，判断：

| 原版字段 | 判定结果 |
|----------|---------|
| `"Innate" "1"` | **先天技能**，走 A 流程 |
| `"Innate" "0"` 或无 Innate 字段 | **普通技能**，走 B 流程 |
| 无法确定 | 用 `AskUserQuestion` 询问用户 |

---

## 第四步：KV 处理

### 流程 A — 先天技能（原版 Innate "1"）

1. 复制原版块结构，使用新 key（如 `xxx2`）写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 改为 `"0"`（**必须**，否则引擎仍按先天处理）。
4. `"AbilityBehavior"` → 去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`；抽奖用被动时改为 `"DOTA_ABILITY_BEHAVIOR_PASSIVE"`；保留主动/开关时按原版行为裁剪，确保无 `NOT_LEARNABLE` 等阻止显示的标志。
5. `"AbilityValues"` → 复制全部字段与子键；每个数值右侧用 `//` 标注原版数值（多档整串对照）。
6. `"AbilityTextureName"` → 必填；参考原版资源或同英雄 persona 路径。
7. 仅机制需要时补其他键（`MaxLevel`、`AbilityUnitDamageType` 等）；不删减仍被 Lua 读取的键。

### 流程 B — 普通技能（原版 Innate "0" 或无）

1. 复制原版块结构，使用新 key 写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 无需写（普通技能默认即为 0）。
4. `"AbilityBehavior"` → 按需保留原版行为；若用于抽奖且为主动技能，确认无需调整 behavior。
5. `"AbilityValues"` → 同流程 A 第 5 步。
6. `"AbilityTextureName"` → 必填。
7. 同流程 A 第 7 步。

---

## 第五步：本地化

1. grep 原版技能名的所有 Tooltip 键：
   ```
   grep "DOTA_Tooltip_ability_<原版名>" docs/reference/<版本>/abilities_english.txt
   grep "DOTA_Tooltip_ability_<原版名>" docs/reference/<版本>/abilities_schinese.txt
   ```
2. 将键名中的原版技能名替换为自定义技能名，值保持与原版一致。
3. 至少包含：`DOTA_Tooltip_ability_<name>`、`_Description`，以及说明中 `%变量名%` 对应的 `_<suffix>` 行。
4. 同步写入 `game/resource/addon_english.txt` 与 `addon_schinese.txt`，遵循 localization-format-guide 的缩进与 tab 规则。
5. 不沿用原版 Facet 文案键时可跳过 `Facet_` 条目。

---

## 可选：抽奖与 Bot 注册

若技能进抽奖池，在 `src/vscripts/modules/lottery/lottery-abilities.ts`（及需要时 `lottery-abilities-bot.ts`）中加入新技能名，档位与注释风格与现有条目一致。

---

## 仓库路径速查

| 用途 | 路径 |
|------|------|
| 抽奖技能 KV | `game/scripts/npc/npc_abilities_custom_lottery.txt` |
| 单位/英雄专属技能 KV | `game/scripts/npc/npc_abilities_custom.txt` |
| 原版技能（按英雄） | `docs/reference/<版本>/heroes/npc_dota_hero_<英雄>.txt` |
| 原版技能（合并本） | `docs/reference/<版本>/npc_abilities.txt` |
| 原版英文说明 | `docs/reference/<版本>/abilities_english.txt` |
| 原版中文说明 | `docs/reference/<版本>/abilities_schinese.txt` |
| addon 英文 | `game/resource/addon_english.txt` |
| addon 简体中文 | `game/resource/addon_schinese.txt` |
| 抽奖池注册 | `src/vscripts/modules/lottery/lottery-abilities.ts` |
| 本地化格式细则 | `.claude/skills/localization-format-guide/SKILL.md` |

`<版本>`：取 `docs/reference/` 下最新数字版本目录。

## 参考范例

`npc_abilities_custom_lottery.txt` 中 `dragon_knight_dragon_blood2`（先天→普通，流程 A）；本地化在 `addon_english.txt` / `addon_schinese.txt` 中检索同名。

---

## 自检清单

- [ ] BaseClass 为原版技能名（非 `ability_lua` / `ability_datadriven`）
- [ ] 流程 A：`"Innate" "0"` 且 `AbilityBehavior` 无 `HIDDEN`
- [ ] 流程 B：Innate 字段按需处理，Behavior 与原版一致
- [ ] `AbilityValues` 所有覆盖项带 `//` 原版对照
- [ ] `AbilityTextureName` 已填写
- [ ] `addon_english.txt` 与 `addon_schinese.txt` 键集合一致，占位符与原版一致
- [ ] 若进抽奖池，已改 lottery TS 列表
