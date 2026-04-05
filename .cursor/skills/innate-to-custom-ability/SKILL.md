---
name: innate-to-custom-ability
description: >-
  Turns Dota 2 innate abilities into custom KV abilities visible on the skill bar:
  set Innate to 0, drop HIDDEN from AbilityBehavior, BaseClass to vanilla name, copy
  AbilityValues with vanilla values in // line comments, set AbilityTextureName, and
  add matching DOTA_Tooltip keys in addon_english/addon_schinese after grepping
  docs/reference abilities_*.txt. Use for lottery/custom clones or when the user
  asks to expose an innate as a normal custom ability.
---

# 先天技能 → 自定义技能（可上技能栏）

将原版**先天**（`"Innate" "1"`）技能做成自定义技能名（如 `xxx2`），使其能像普通技能一样出现在技能栏并可有独立数值。

## 仓库内路径（执行时直接用）

| 用途 | 路径 |
|------|------|
| 自定义技能 KV（抽奖等） | `game/scripts/npc/npc_abilities_custom_lottery.txt` |
| 原版技能定义（按英雄拆文件） | `docs/reference/<版本>/heroes/npc_dota_hero_<英雄>.txt` |
| 原版技能定义（合并本，若英雄文件无该技能） | `docs/reference/<版本>/npc_abilities.txt` |
| 原版说明文案（英文） | `docs/reference/<版本>/abilities_english.txt` |
| 原版说明文案（中文） | `docs/reference/<版本>/abilities_schinese.txt` |
| 本图 addon 英文 | `game/resource/addon_english.txt` |
| 本图 addon 简体中文 | `game/resource/addon_schinese.txt` |
| 抽奖池注册 | `src/vscripts/modules/lottery/lottery-abilities.ts`（及 bot 用 `lottery-abilities-bot.ts` 若需） |
| 本地化格式细则 | `.claude/skills/localization-format-guide/SKILL.md` 与 `references/localization-format-guide.md` |

`<版本>`：取 `docs/reference/` 下**最新**数字版本目录（与 `.cursor/skills/comment/SKILL.md` 选法一致）。

## 参考范例

`game/scripts/npc/npc_abilities_custom_lottery.txt` 中 `dragon_knight_dragon_blood2` 块；对应本地化在 `addon_english.txt` / `addon_schinese.txt` 中检索 `dragon_knight_dragon_blood2`。

## KV 步骤

1. 在 `docs/reference/<版本>/heroes/` 中打开对应英雄文件，定位原版技能块（如 `"dragon_knight_dragon_blood"`），复制其结构作为草稿。
2. 新技能名：使用新 key（如 `dragon_knight_dragon_blood2`），放入目标 KV 文件（常为 `npc_abilities_custom_lottery.txt`）。
3. `"BaseClass"`：填**原版技能名**（如 `dragon_knight_dragon_blood`），继承脚本与机制。
4. `"Innate"`：必须设为 `"0"`，否则仍按先天处理。
5. `"AbilityBehavior"`：
   - 去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`，否则技能栏不显示。
   - 抽奖用被动参考：`"DOTA_ABILITY_BEHAVIOR_PASSIVE"`；若需保留主动/开关等行为，在去掉 `HIDDEN` 的前提下按原版行为裁剪，避免与「可学习、可显示」需求冲突的 `NOT_LEARNABLE` 等标志残留。
6. `"AbilityValues"`：**按原版块复制全部字段与子键**；本图覆盖后的**每个引号内数值**右侧用行尾 `//` 标注**原版对应引号内文案**（多档则整串对照）。若本图故意删去某原版字段，在提交或 PR 中说明取舍，不在 KV 里用括号写跨文件说明。
7. `"AbilityTextureName"`：必填；可从原版资源、同英雄 persona 路径或本文件内同类技能借鉴，与图标实际存在路径一致。
8. 仅当机制需要时补 `MaxLevel`、`AbilityUnitDamageType` 等其它键；不要无因删减原版里仍被 Lua 读取的键。

## 本地化步骤

1. 在 `abilities_english.txt` 与 `abilities_schinese.txt` 中 grep 原版技能名，例如：
   - `grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<版本>/abilities_english.txt`
   - `grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<版本>/abilities_schinese.txt`
2. 将命中键名中的**原版技能名**替换为**自定义技能名**（如 `dragon_knight_dragon_blood` → `dragon_knight_dragon_blood2`），值保持与原版一致。
3. 至少包含：`DOTA_Tooltip_ability_<name>`、`DOTA_Tooltip_ability_<name>_Description`，以及 `AbilityValues` 里出现在说明中的 `%变量名%` 所对应的 `DOTA_Tooltip_ability_<name>_<suffix>` 行。
4. 同步写入 `game/resource/addon_english.txt` 与 `game/resource/addon_schinese.txt`，缩进与 tab 对齐遵循 localization-format-guide；区块旁可用 `//` 中文注释与英文文件保持同一注释语义。
5. 本图不沿用原版 Facet 文案键时，可不复制 `Facet_` 相关条目，除非自定义技能仍展示该机制。

## 可选：抽奖与 Bot

若技能进抽奖池，在 `lottery-abilities.ts`（及需要的 `lottery-abilities-bot.ts`）中加入新技能名字符串，档位与注释风格与现有条目一致。

## 自检清单

- [ ] `"Innate" "0"`，且 `AbilityBehavior` 无 `HIDDEN`
- [ ] `BaseClass` 指向原版技能名
- [ ] `AbilityValues` 覆盖项均带 `//` 原版对照
- [ ] 已设 `AbilityTextureName`
- [ ] `addon_english.txt` 与 `addon_schinese.txt` 键集合一致，占位符与原版一致
- [ ] 若进抽奖，已改 lottery TS 列表
