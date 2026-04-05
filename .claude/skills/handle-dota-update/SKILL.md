---
name: handle-dota-update
description: >-
  Dota 大版本更新工作流入口：技能 KV 见 update-abilities-override；npc_heroes_custom 中 Bot 槽位合并、全等级 Build 加点次数 vs MaxLevel、天赋 Ability10–17 见 update-heroes-custom。本文件仅作路由。
disable-model-invocation: true
---

# Handle Dota Update（路由）

维护 Dota 版本更新相关 KV 时，**不要沿用旧的「只写差分、与官方相同就删键」**单一规则。当前仓库约定为：

1. **`npc_abilities_override.txt`**：以参考为底稿；与参考同值的键删除不抄；增键在技能块上用 `//` 中文说明；行尾注释格式见 `update-abilities-override`。
2. **`npc_heroes_custom.txt`**：Bot `Build` 与槽位合并、`MaxLevel`、天赋档见 `update-heroes-custom`。

## 应打开的 SKILL 路径

| 任务 | 打开并严格执行 |
| ---- | -------------- |
| `game/scripts/npc/npc_abilities_override.txt` | `.claude/skills/update-abilities-override/SKILL.md` |
| `game/scripts/npc/npc_heroes_custom.txt` | `.claude/skills/update-heroes-custom/SKILL.md` |

## 用户输入（两技能共用）

- `docs/reference/{version}/` 存在（含 `heroes/`、`abilities_schinese.txt` 等）。
- 版本号、英雄/单位列表；Issue 链接可选。
- **仅当用户明确要求时再 git commit**。

## 数值情形速查（详见子技能）

| 类型 | 要点 |
| ---- | ---- |
| 仅等级扩展、无加强 | 多档与官方前几档一致，新档按官方等差延伸。 |
| 固定数值加强 | 新官方值上叠相同偏移（或每档相同偏移）。 |
| 翻倍/倍数加强 | 新官方值 × 固定倍率；注释保留倍率。 |

具体注释格式、`MaxLevel`、多档校验、官方重构清理见 **`update-abilities-override`**；Bot 槽位覆盖、全等级加点次数、`Ability10`–`Ability17` 见 **`update-heroes-custom`**。
