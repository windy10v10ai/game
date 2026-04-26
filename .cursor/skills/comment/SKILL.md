---
name: comment
description: Updates only inline // comments in KV files using Dota 2 vanilla AbilityValues from docs/reference/<latest-version>, without changing quoted gameplay numbers. Use when the user invokes /comment, asks to sync reference comments, or to refresh 7.xx baseline annotations after specifying scope (files, item or ability names).
---

# /comment

## 目标

在用户**明确指定更新范围**（要改的文件路径、物品/技能名、或具体区块）后，从 `docs/reference/<版本号>/` 读取 Dota2 **原版**数值，**只更新行内注释**（`//` 及其后内容），**严禁修改任何引号内的实际设定数值**。

## 选择参考版本目录

1. 列出仓库内 `docs/reference/` **下一层**子目录（如 `7.41`），忽略非版本目录（若有）。
2. 取**最新版本**：将目录名按「主.次」数字比较（例：`7.41` > `7.40`）；若无法解析则按字典序取最新并在回复中说明依据。
3. 若用户**显式指定**版本（例：`用 7.40`），以用户指定为准。
4. 最终路径形如：`docs/reference/<ver>/items.txt`、`npc_units.txt`、`npc_abilities.txt` 等。

## 按范围查找原版数据

| 范围类型 | 优先参考文件 |
|----------|----------------|
| 物品 / 中立附魔等 `"item_..."` 的 `AbilityValues` | `docs/reference/<ver>/items.txt` 中同名 `"item_..."` 块 |
| 单位基础字段 | `docs/reference/<ver>/npc_units.txt` |
| 技能（非物品） | `docs/reference/<ver>/npc_abilities.txt`，或 `heroes/` 下对应英雄文件（仅当用户范围涉及） |

在 `items.txt` 中用**技能/物品名**（带引号的 key，如 `"item_enhancement_greedy"`）检索块，读取其 `"AbilityValues"` 下各字段的**原版**引号内字符串，用于写注释。

## 编辑规则（必须遵守）

1. **只动注释**：每行形如 `"field"\t"override values"\t// old comment` —— **仅**替换从 `//` 到行尾；**不得**改动两段引号内的文本（字段名与当前地图使用的数值）。
2. **不改 MaxLevel、不改结构**：除非用户单独要求，否则不增删键、不改 `MaxLevel`、不合并块。
3. **列对齐**：保持与原文件一致的 tab 与列宽习惯；`//` 前保留与相邻行相同的对齐方式（通常与左侧数值列之间用 tab）。
4. **字段名与原版不一致**：若本图使用了 Valve 不同 key（例：本图 `bonus_cast_range` 对应 7.41 `manacost_reduction`），注释中写**原版字段的 AbilityValues** 字符串，必要时在括号内标注原版字段名；仍**不**改左侧覆盖数值。
5. **原版无同名条目**：不写假数据；可写 `// (items.txt 无同名条目)` 或保留原注释并在回复中说明未找到。
6. **原版单档、本图多档**：注释只记录**原版** AbilityValues（如单档 `"30"`）；不因本图有多档而修改引号内数值。

## 工作流（建议顺序）

1. 与用户确认**更新范围**（路径 + 可选物品/技能列表）；未指定范围则先请用户列出或默认仅处理用户 @ 的文件。
2. 解析 `docs/reference/<最新>/` 路径。
3. 在参考文件中定位块，抄录各 `AbilityValues` 行对应的原版字符串。
4. 仅更新目标文件中对应行的 `//` 注释。
5. **自检**：对改动文件执行 `git diff`（或等价查看），确认 diff 中**没有出现**引号内数值串的变更；若出现则回退并修正。

## 反例（禁止）

- 为「对齐原版」而修改 `"600 1000 1400"` 等引号内内容。
- 删除用户的长说明型注释并换成数字，除非用户要求仅保留原版对照。
- 在未指定范围时对整个 `npc/` 批量改注释导致误伤。

## 与仓库其他约定的关系

- `game/scripts/npc/neutral_items.txt` 若注明需同步 TS 等，**本技能不涉及**；仅改注释时不触发那些同步，除非用户另行要求。
