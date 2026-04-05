---
name: update-heroes-custom
description: >-
  维护 game/scripts/npc/npc_heroes_custom.txt 的 Bot 配置：合并 Ability 槽位（custom 覆盖官方）、按 override/原版解析技能 MaxLevel，
  校验 Bot.Build 中非天赋加点次数与有效技能集合（含 10–30 级天赋规则）。
---

# Update Heroes Custom

本技能针对 `game/scripts/npc/npc_heroes_custom.txt`，保证 **`Bot` → `Build`** 与英雄**实际拥有的技能**及**各技能可升等级数**一致，并与 **`Ability10`–`Ability17` 天赋槽**规则一致。

## 何时使用

- 版本更新或改 `Ability*` / override 后，检查 Bot 是否仍点到存在的技能、加点次数是否超过 `MaxLevel`。
- 调整 `Bot.Build` 或自定义槽位技能后做自检。
- 用户要求核对「Bot 加点 / 天赋 / 技能等级」时。

## 输入与前置条件

- 参考版本号 `{version}`：`docs/reference/{version}/npc_heroes.txt`、同目录下 `heroes/npc_dota_hero_<hero>.txt`（或需时用 `npc_abilities.txt` 补查技能块）。
- 本图：`game/scripts/npc/npc_heroes_custom.txt`、`game/scripts/npc/npc_abilities_override.txt`（按技能名检索是否存在覆盖块）。

```bash
grep -n "npc_dota_hero_tinker" game/scripts/npc/npc_heroes_custom.txt
grep -n "tinker_laser" game/scripts/npc/npc_abilities_override.txt
```

---

## 技能槽位：官方 + 自定义合并（检测必读）

对同一 `npc_dota_hero_*`：

1. 在 **`docs/reference/{version}/npc_heroes.txt`** 中读取该英雄的 `Ability1`、`Ability2`…（直到 `AbilityTalentStart` 之前，以及工程里实际会出现在 Build 中的槽位，如 `Ability5`、`Ability6` 等）。
2. 在 **`npc_heroes_custom.txt`** 中读取同名英雄的同名槽位键。
3. **合并规则（按槽位）**：某一槽位若在 **custom 中有定义**，则 **以 custom 为准**；未定义则 **沿用 npc_heroes 官方值**。

据此得到 **有效技能列表**（每个槽位对应一个当前版本真实技能名，含魔晶/额外槽等）。`Bot.Build` 里出现的**非天赋**技能名必须属于该列表（`generic_hidden`、空技能名等按项目约定处理）。

---

## 各技能 MaxLevel：override 优先，否则原版

对每个**有效技能名**（上节合并结果中的非空、非占位名）：

1. 在 **`game/scripts/npc/npc_abilities_override.txt`** 中查找该技能名块；若存在且写有 **`MaxLevel`**，以 **override 为准**作为本图有效最大等级。
2. 若 **override 无此技能或无 MaxLevel**：在 **`docs/reference/{version}/heroes/npc_dota_hero_<hero>.txt`** 中查找同名技能块，读其 **`MaxLevel`**；若该英雄文件未包含此技能，再到 **`docs/reference/{version}/npc_abilities.txt`** 中按技能名检索。
3. 若仍无显式 `MaxLevel`，按 **`update-abilities-override`** _skill_ 中的「缺省 MaxLevel」规则推断（大招 3、其余 4 等），仅用于 Bot **次数上限**估算，并在备注中说明「推断」。

> **注意**：本图可能对技能做了 5 级/4 级扩展；Bot 对该技能的加点次数**不得超过**上述有效 `MaxLevel`（通常满加则次数 **等于** `MaxLevel`，除非 Build 故意不满级）。

---

## `Bot` → `Build` 结构（等级键 = 英雄等级）

```kv
"Bot"
{
	"Build"
	{
		"1"		"earthshaker_fissure"
		"2"		"earthshaker_aftershock"
		// …
		"10"		"special_bonus_xxx"
		// …
	}
}
```

- 键 **`"1"`…`"30"`**（及更高，若存在）一般表示**升到该英雄等级时**要点的技能（以引擎与既有配置为准）。
- **`""`** 可表示该级不点技能，不计入「某技能加点次数」。

---

## 非天赋技能：`Bot.Build` 校验要点

在排除 **天赋**（`special_bonus_*` 或合并后的 `Ability10`–`Ability17` 中的名字）之后，对其余非空 `Build` 值逐项检查：

1. **是否存在**：该技能名必须出现在 **合并后的有效技能列表**（槽位覆盖规则）中。
2. **加点次数**：在整条 `Build` 中统计该技能名出现次数（仅统计非空值），须 **≤ 有效 `MaxLevel`**；若配置为常规满级加点，应与 `MaxLevel` **一致**（除非刻意少点，需在审查时接受说明）。

同时关注 **1–9 级、11–14 级、16–26 级、31+ 级** 等**所有**非空键，不仅 10/15/20/25/27–30；任意等级键里出现的技能都要满足上述两条。

---

## 天赋槽位与 `Ability10`–`Ability17`

| 英雄等级档 | 槽位键 |
| ---------- | ------ |
| 10 级档 | `Ability10`、`Ability11` |
| 15 级档 | `Ability12`、`Ability13` |
| 20 级档 | `Ability14`、`Ability15` |
| 25 级档 | `Ability16`、`Ability17` |

### 天赋覆盖规则

- **官方**：`npc_heroes.txt` 中该英雄的 `Ability10`–`Ability17`。
- **自定义**：`npc_heroes_custom.txt` 中若写了同名键，则 **覆盖** 官方该槽；未写则仍用官方。
- **有效天赋集合**：八个槽各自「custom 优先，否则官方」，用于校验 `Build["10"]` / `["15"]` / … 中的天赋名。

### `Build` 天赋键规则（与此前一致）

- **`"10"` / `"15"` / `"20"` / `"25"`**：各选该档 **两个 `Ability` 之一**。
- **`"27"` / `"28"` / `"29"` / `"30"`**：分别补 **10 / 15 / 20 / 25** 档中**未被前者选中**的另一侧天赋，且与同档首次选择 **不得同名**。

---

## 推荐检测流程（单英雄）

1. 读 **`npc_heroes.txt`** 与 **`npc_heroes_custom.txt`**，**按槽合并** `Ability1`…（及参与加点的额外槽），得到 **有效技能列表**。
2. 对每个有效技能名，解析 **MaxLevel**（**override → 英雄参考 `heroes/…` → `npc_abilities.txt` → 缺省推断**）。
3. 读 **`npc_heroes_custom.txt`** 的 `Bot.Build`。
4. **非天赋**：校验每个出现技能 ∈ 有效列表，且 **次数 ≤ MaxLevel**（及满级策略）。
5. **天赋**：合并 `Ability10`–`Ability17`，校验 `10/15/20/25/27/28/29/30` 键规则。
6. 官方改版后若槽位或技能名变更，先更新合并结果与 override，再改 `Bot.Build`。

---

## 与 `update-abilities-override` 的分工

| 文件 | 职责 |
| ---- | ---- |
| `npc_abilities_override.txt` | 技能 `MaxLevel`、数值、键结构；**Bot 次数上限优先读这里** |
| `npc_heroes_custom.txt`（本技能） | **槽位覆盖**、`Bot.Build`、`Ability10`–`Ability17` |

---

## 汇报与提交

- 每英雄可列：槽位合并结果摘要、各技能有效 `MaxLevel` 来源（override / 原版）、`Build` 计数是否超标、天赋键是否通过。
- **仅当用户明确要求时再 git commit**。
