---
name: clone-ability
description: 继承原版技能做差分克隆（BaseClass = 原版技能名），或修正已有克隆技能。
---

# 克隆原版技能（新建 / 修正）

把原版技能（先天或普通）克隆为自定义技能名，写入 KV 并补全本地化。参考文件路径与技能系统名查找见 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」。

## 1. 定技能与模式

按「查原版技能」得到原版系统名与自定义名（如 `xxx2`），在 `npc_abilities_custom_lottery.txt` 与 `npc_abilities_custom.txt` 里搜自定义名：

| 情况 | 处理 |
|---|---|
| 只在一个文件找到 | 目标文件就是它，**修正模式**，告诉用户「已在 `<文件>` 找到 `<技能名>`，进入修正模式」 |
| 两个文件都有 | `AskUserQuestion` 选文件，修正模式 |
| 都没有 | **新建模式**（用户明确说修正除外）。用户没指定目标文件时问：抽奖池技能 `npc_abilities_custom_lottery.txt` / 单位或自定义英雄专属 `npc_abilities_custom.txt` |

`npc_abilities_custom_lottery.txt` 分三个区域（`grep -n "^//"` 定位），新块插在对应区域末尾：`// Innate 天赋 技能`（流程 A）、`// 普通升级 技能`（流程 B）、`// lua 技能`（纯 lua 实现）。

读目标块（新建读原版，修正读现有块）的 `BaseClass`：是原版技能名就继续；是 `ability_datadriven` / `ability_lua` 说明不是继承原版，转 `custom-ability`。

## 2. 修正模式：同步原版 K 键

规则同 `update-abilities-override` 的 P1：

1. 从原版 KV 读当前版本的完整键集合，原版键值已被 override 改过的用 override 的值
2. 删掉与原版同值的键（引擎会继承）
3. 删掉原版已不存在的键（行尾注明 `// 原版不存在，手动修改` 的保留）
4. 补齐运行所需的缺失键：多档数值、`AbilityUnitTargetTeam` / `AbilityUnitTargetType` / `AbilityCastRange`、`SpellImmunityType`、`SpellDispellableType` 等

完成后跳到第 5 步。

## 3. 新建模式：合并原版与 override

1. 从 `npc_abilities.txt` 或对应英雄文件读原版技能块
2. `npc_abilities_override.txt` 里有同名块时，把其中与原版不同的键值（含标注 `// 原版不存在，手动修改` 的键）叠加上去

- 含 `hero_levelup` 的 `dynamic_value` 子块克隆后不生效，按流程 A 第 5 步扩展为多级；用于 tooltip 实时显示的字段（`current_slow_resistance`、`current_aoe`、`attack_speed_tooltip` 等）保留 `dynamic_value` 子块
- 原版子块含 `affected_by_aoe_increase "1"` 的字段（如 `radius`）保留子块形式并显式写这一行，否则 AOE 增益无效

## 4. 选流程并处理 KV

| 原版 | 流程 |
|---|---|
| `"Innate" "1"`，`AbilityBehavior` 只多一个 `HIDDEN`，去掉即可正常显示生效 | **C**：override 去 HIDDEN，原版名直接入池（优先考虑） |
| `"Innate" "1"`，要改数值 / 多级成长 / 调整行为 | **A**：克隆为自定义技能名 |
| `"Innate" "0"` 或无 Innate | **B** |
| 无法确定 | `AskUserQuestion` |

各流程的逐步规则 → `references/kv-flows.md`。

完成：KV 块写入目标文件，`AbilityValues` 里每个覆盖项都带 `//` 原版对照。

## 5. 本地化（流程 C 跳过）

grep 原版两份说明文本里的 `DOTA_Tooltip_ability_<原版名>`，把键名换成自定义名、值保持原版，至少包含名称、`_Description` 和说明里 `%变量名%` 对应的 `_<suffix>` 行。按 `game/resource/CLAUDE.md` 三语同步写入，每组条目前加 `// 英雄名 技能名` 注释、条目后空一行。不沿用原版 Facet 文案时跳过 `Facet_` 条目。

## 6. 抽奖与 bot

进抽奖池时在 `src/vscripts/modules/lottery/lottery-abilities.ts`（需要时 `lottery-abilities-bot.ts`）加技能名，档位与注释风格和现有条目一致。bot 施法规则走 `bot-ability-usage`。

参考范例：`npc_abilities_custom_lottery.txt` 的 `dragon_knight_dragon_blood2`（先天 → 普通，流程 A）。

## 完成标准

- `BaseClass` 是原版技能名；新建时已叠加 override
- 流程 A：`"Innate" "0"`，`AbilityBehavior` 无 `HIDDEN`；有 `hero_levelup` 的已扩展为 5 级
- `AbilityValues` 里没有 `special_bonus_*` 天赋引用行，删行后 `value` 为 `"0"` 的空子块已删
- `AbilityTextureName` 已填；`UNIT_TARGET` 技能显式写了施法属性；`IsGrantedByShard` / `HasShardUpgrade` 已覆盖为 `"0"`
- 修正模式已删同值键、删废键、补新键
- 三语本地化键集合一致，占位符与原版一致；进池的已改 lottery 列表
- 流程 C：override 去 `HIDDEN`（其余 behavior 保留）并加 `IsOnCastBar "1"`，原版名进 lottery 的 `// 被动技能` 区域，没有新建 KV 块与本地化
