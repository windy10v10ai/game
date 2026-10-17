---
name: ability-blacklist
description: 把技能/物品加入蝴蝶效应或多重施法的随机触发黑名单。
disable-model-invocation: true
---

# Ability Blacklist

两处黑名单，目标不明确时用 `AskUserQuestion` 让用户选一个或两个都加：

| 黑名单   | 文件                                                              | 表名                                                             | 写法                       |
| -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- |
| 蝴蝶效应 | `game/scripts/vscripts/abilities/ability_blacklist_butterfly.lua` | `EXCLUDED_ABILITIES_ALLBUTTER`（技能）/ `EXCLUDED_ITEMS`（物品） | `["ability_name"] = true,` |
| 多重施法 | `game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua`     | `no_support_abilitys`（技能）/ `no_support_items`（物品）        | `ability_name = 1,`        |

## 系统名确认

用户给的可能是显示名，按 `game/scripts/npc/CLAUDE.md`「查原版技能」核实系统名。

## 添加位置

按机制归类插入对应注释分组（位移/隐身/召唤/持续施法/两段式等）；找不到匹配分组就加在文件末尾对应表内。注释写英雄名 + 技能中文名。
