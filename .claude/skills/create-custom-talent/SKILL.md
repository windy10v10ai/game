---
name: create-custom-talent
description: 在 Dota 自定义平衡中新增或替换英雄天赋（尤其是把通用天赋改为技能联动天赋）时使用。处理范围包括 game/scripts/npc/npc_abilities_override.txt 的天赋定义与技能挂接、game/scripts/npc/npc_heroes_custom.txt 的 Ability10-17 与 Bot.Build 档位联动、以及 game/resource/addon_schinese.txt 和 addon_english.txt 的天赋文案同步。
---

# Create Custom Talent

为英雄新增或替换天赋时，按以下顺序执行，确保键名、档位和文案一致。

## 1) 设计天赋系统名

- 使用不绑定数值的系统名：`special_bonus_unique_<hero>_<effect>`
- 避免在系统名中写固定数值（例如 `_200`、`_50`）
- 仅在明确复用官方天赋时保留原名；自定义天赋优先新建独立键

## 2) 修改技能与天赋定义（npc_abilities_override.txt）

- 在目标技能的 `AbilityValues` 中挂接天赋键（例如 `"+200"`、`"-4"`、`"x2"`）
- 在同英雄区段新增天赋定义块
- 沿用固定模板：

```kv
// 自定义天赋
"special_bonus_unique_<hero>_<effect>"
{
	"AbilityType"					"ABILITY_TYPE_ATTRIBUTES"
	"AbilityBehavior"				"DOTA_ABILITY_BEHAVIOR_PASSIVE"
	"BaseClass"						"special_bonus_base"
}
```

## 3) 更新英雄天赋槽位与 Build（npc_heroes_custom.txt）

- 在英雄块内覆盖对应天赋槽位（通常 `Ability10-17`）
- 同步 `Bot.Build` 的天赋键：
- `10/15/20/25` 填所选天赋
- `27/28/29/30` 分别填 `10/15/20/25` 的另一个天赋
- 若替换旧天赋，确保 `Ability 槽位` 与 `Build` 同时替换，不留旧键

## 4) 更新中英文文案（addon_schinese.txt / addon_english.txt）

- 添加或替换键：`DOTA_Tooltip_ability_<talent_name>`
- 文案使用变量占位符，不写死数值
- 例：`"+{s:bonus_heal} 巫毒疗法治疗量"`、`"+{s:bonus_heal} Voodoo Restoration Heal"`

## 5) 自检

- 同一天赋名在 4 个文件中的键完全一致
- `npc_abilities_override.txt` 已包含：
- 技能挂接行
- 天赋定义块
- `npc_heroes_custom.txt` 已包含：
- 正确的 Ability10-17 槽位覆盖
- 正确的 Build 档位（含 27/28/29/30）
- 本地化中英文都存在对应 tooltip 键
- 无旧天赋残留引用（替换场景必须清理）

## 6) 常用检查命令

```powershell
Select-String -Path `
  game\scripts\npc\npc_abilities_override.txt,`
  game\scripts\npc\npc_heroes_custom.txt,`
  game\resource\addon_schinese.txt,`
  game\resource\addon_english.txt `
  -Pattern 'special_bonus_unique_<hero>_<effect>|DOTA_Tooltip_ability_special_bonus_unique_<hero>_<effect>'
```
