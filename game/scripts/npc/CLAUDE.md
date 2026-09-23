# game/scripts/npc/ KV 文件说明

本目录是所有 NPC 相关 KV（技能 / 物品 / 单位 / 英雄）的存放处。改动本目录任何 `.txt` 前先读本文件。

## 文件结构

引擎直接加载 4 个入口文件，其余文件通过 `#base` 被引入。**新建 `.txt` 后必须在对应入口文件顶部加 `#base "<filename>.txt"`，否则引擎不加载。**

| 入口文件 | `#base` 引入 | 用途 |
|---|---|---|
| `npc_abilities_custom.txt` | `npc_abilities_custom_lottery.txt`<br>`npc_abilities_custom_awaken.txt` | 全新自定义技能。入口本体放单位/英雄专属技能，lottery 放抽奖池技能，awaken 放觉醒技能 |
| `npc_abilities_override.txt` | `npc_items_override.txt`<br>`npc_items_override_neutral.txt`<br>`npc_items_override_neutral_passive.txt`<br>`npc_abilities_creep.txt` | 对原版技能/物品写**差分**覆盖（缺失键由引擎合并原版值）。creep 放小兵野怪技能 |
| `npc_items_custom.txt` | `npc_items_modifier.txt`<br>`npc_items_artifact.txt`<br>`npc_items_clone.txt` | 自制物品。modifier 放物品间共享的 DataDriven modifier（`item_apply_modifiers` 引用），artifact 放神器，clone 放原版物品的倍率克隆 |
| `npc_units_custom.txt` | `npc_units_building.txt`<br>`npc_units_creep.txt`<br>`npc_units_neutral.txt` | 自定义单位 |

其余独立文件：`npc_heroes_custom.txt`（英雄覆盖与 `Bot.Build` 加点）、`herolist.txt`（可选英雄开关）、`neutral_items.txt`（中立物品掉落表，改动需同步 `src/vscripts/ai/item/neutral-item.ts` 的 `GetDefaultConfig`）、`portraits_custom.txt`（自定义模型头像）。

`npc_items_clone.txt` 由 `clone-item` skill 生成，勿手改。

## ID 分配

### 背景

自定义游戏写的 `"ID"` 字段落在**官方单位技能的 ID 空间**里，官方占用表是 `docs/reference/<version>/npc_ability_ids.txt`。撞号时引擎报 `FATAL ERROR: Encountered duplicate assigned ability id: <id> for ability <name>`，且**只在该官方技能实际被加载时才触发**——冲突可以潜伏多个版本，直到 Valve 启用某个技能才爆。

官方 `UnitAbilities` 最大占用 **9999**，`ItemAbilities` 最大 4302。**10000 以上完全空闲**，是本项目唯一安全区。

### 号段

| 号段 | 归属文件 | 已用 |
|---|---|---|
| 10000–10099 | `npc_items_modifier.txt` | 10000–10003 |
| 10100–10299 | `npc_items_artifact.txt` | 10100–10121 |
| 10300–10999 | `npc_items_custom.txt` | 10300–10464 |

新增条目取所属号段**已用区间的下一个数**，段内连续，不要跳号也不要复用被删条目的号。段尾留有空位，用尽再向后扩段。

### 何时可以不写 ID

`"ID"` 字段是可选的，不写引擎自动分配（`npc_items_clone.txt` 全部如此）。自定义技能（lottery / awaken / custom）一律不写 ID。**只有本目录三个物品文件沿用手写 ID**，新增物品跟随所在文件的既有做法即可。

### 冲突自检

改完 ID 或同步新版本 Dota 后，比对官方占用表：

```bash
# 本目录所有有效 ID（排除注释行）
for f in game/scripts/npc/*.txt; do perl -ne 'if(/^(.*?)"ID"\s+"(\d+)"/ && $1 !~ m{//}){print "$2\n"}' "$f"; done | sort -u > /tmp/ours.txt
# 官方占用 ID
grep -oE '"[^"]+"[[:space:]]+"[0-9]+"' docs/reference/<version>/npc_ability_ids.txt | grep -oE '[0-9]+"$' | tr -d '"' | sort -u > /tmp/valve.txt
comm -12 /tmp/ours.txt /tmp/valve.txt   # 有输出即冲突
```

## 格式

所有 `.txt` 全程使用 **tab**，包括行首缩进与 key/value 之间的对齐间距，不得用空格。

## 数值配置

技能射程、伤害值及其他可调参数一律从 KV 文件**动态读取**，不要在 TS/Lua 里硬编码已存在于 KV 中的数值。

- **让 tooltip 计入技能增强**：某条 `AbilityValues` 数值想在游戏中按住 ALT 时显示「被技能增强放大后」的值，在该数值块内加 `"CalculateSpellDamageTooltip" "1"`（**不是** `affected_by_spell_amplify`，没有这个字段）。原版默认多为 `"0"`（不计入）。配套字段：`"DamageTypeTooltip"`（伤害类型）、`"display_type"`（如 `kMagicalDamagePercentage` 百分比显示）

## 原版 KV 参考

`<version>` 取 `docs/reference/` 下最新版本目录（含字母后缀，如 `7.41f` 新于 `7.41`）。

| 用途 | 路径 |
|------|------|
| 原版技能（非英雄技能） | `docs/reference/<version>/npc_abilities.txt` |
| 英雄基础属性、技能槽位、技能 KV | `docs/reference/<version>/heroes/npc_dota_hero_<hero>.txt` |
| 英雄列表 | `docs/reference/<version>/npc_heroes.txt` |

7.41f 起英雄数据全部并入 `heroes/npc_dota_hero_<hero>.txt`，`npc_heroes.txt` 只剩 `#base` 列表，`npc_abilities.txt` 里查不到英雄技能；更早版本英雄属性与槽位在 `npc_heroes.txt`，`heroes/` 下只有技能。
| 原版物品 | `docs/reference/<version>/items.txt` |
| 官方 ability/item ID 占用表 | `docs/reference/<version>/npc_ability_ids.txt` |

技能名的中文↔系统名互查见 `.claude/CLAUDE.md`「查原版技能」。

## 图标

`AbilityTextureName` 引用 Dota2 已有的原版 texture 时直接写名字，无需放 png。自定义图标要放 png 并登记，走 `add-image` skill（漏步骤就是紫块）。
