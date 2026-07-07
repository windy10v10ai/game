---
name: ability-blacklist
description: >-
  把某个技能/物品加入"随机重触发"黑名单（蝴蝶效应、多重施法 Multicast），
  避免会导致机制冲突、崩溃或体验问题的技能被随机再次触发。
  当用户说"XX 加入蝴蝶黑名单"「多重施法别选中 XX」「这个技能不该被蝴蝶/多重触发」等时触发。
---

# Ability Blacklist

两处黑名单，目标不明确时用 `AskUserQuestion` 让用户选一个或两个都加：

| 黑名单 | 文件 | 表名 | 写法 |
|---|---|---|---|
| 蝴蝶效应 | `game/scripts/vscripts/abilities/ability_blacklist_butterfly.lua` | `EXCLUDED_ABILITIES_ALLBUTTER`（技能）/ `EXCLUDED_ITEMS`（物品） | `["ability_name"] = true,` |
| 多重施法 | `game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua` | `no_support_abilitys`（技能）/ `no_support_items`（物品） | `ability_name = 1,` |

## 系统名确认

技能显示名（tooltip）可能与系统名不同（如显示名 "Sproink" 实际系统名是 `enchantress_bunny_hop`）。按 CLAUDE.md「技能系统名查找」流程，在 `docs/reference/<version>/abilities_english.txt` 核实 `DOTA_Tooltip_ability_<系统名>` 对应关系，不要直接照抄显示名当系统名。

## 添加位置

按机制归类插入对应注释分组（位移/隐身/召唤/持续施法/两段式等）；找不到匹配分组就加在文件末尾对应表内。注释写英雄名 + 技能中文名。
