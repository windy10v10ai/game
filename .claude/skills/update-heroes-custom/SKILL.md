---
name: update-heroes-custom
description: >-
  校验 game/scripts/npc/npc_heroes_custom.txt 的 Bot.Build：
  天赋名须逐字存在于合并后 Ability10-17 且档位正确（27=10-other / 28=15-other / 29=20-other / 30=25-other）；
  技能名须在合并后 Ability 槽位内；加点次数 ≤ MaxLevel；大招间隔 ≥ 6（典型 6/12/18/24）；
  仅 17/19/21/22 留空。
---

# Update Heroes Custom

校验 `npc_heroes_custom.txt` 的 **`Bot.Build`**，确保天赋名存在且档位正确、技能名在有效槽位内、加点不超 `MaxLevel`、等级键结构合规。

## 何时使用

- 版本更新或改 Ability 槽位 / override 后校验 Bot 加点。
- 用户要求核对 Bot 加点 / 天赋 / 技能等级。

## 数据来源

| 数据 | 优先级：高 → 低 |
|------|----------------|
| Ability 槽位 | `npc_heroes_custom.txt` 同名键 → `docs/reference/{version}/npc_heroes.txt` |
| Ability10–17 天赋 | 同上 |
| MaxLevel | `npc_abilities_override.txt` → `heroes/npc_dota_hero_<hero>.txt` → 推断（大招 3、其余 4） |

---

## 有效技能列表

合并官方与 custom 后，**所有非 `generic_hidden` 的 Ability 槽位**（含 Ability7+ 如 `ogre_magi_multicast`）。

- `npc_abilities_override.txt` 有块 **不代表** 可用——须确认英雄的 Ability 槽位含此技能。
- `Innate "1"` 的先天技能不可升级，不应出现在 Build 中。

---

## 有效天赋集合

| 等级档 | Ability 槽位 | Build 首选 | Build 补选 |
|--------|-------------|-----------|-----------|
| 10 级 | Ability10 / Ability11 | `"10"` | `"27"` |
| 15 级 | Ability12 / Ability13 | `"15"` | `"28"` |
| 20 级 | Ability14 / Ability15 | `"20"` | `"29"` |
| 25 级 | Ability16 / Ability17 | `"25"` | `"30"` |

天赋名必须与合并后的 Ability10–17 **逐字匹配**。旧版本废弃名无效。

---

## Build 规则

### 天赋

- **`10` / `15` / `20` / `25`**：从**对应档**的两天赋中选一。
- **`27` / `28` / `29` / `30`**：分别填 **10 / 15 / 20 / 25 档中未选的另一个**。

> **最常见错误**：① 天赋名已改版失效（逐字不匹配）；② 把 A 档天赋填到 B 档键上；③ 28/29 互换（15-other 与 20-other 弄反）。

### 大招

- 加点间隔 **≥ 6**，`30` 不升大。
- 典型 MaxLevel 4：**6 / 12 / 18 / 24**。第四级放 `24`，`31` 留给第五个小技能点。

### 小技能

对每个小技能 S，到英雄等级 L 的累计出现次数 **C(L) ≤ ⌊(L+1)/2⌋**（`""` 和天赋不计入）。允许相邻级连点。总次数 **≤ MaxLevel**。

### 留空

- **`17` / `19` / `21` / `22`**：必须 `""`。
- **其余键**（含 `23` / `24` / `26`）：不得 `""`，须填有效技能或天赋。`23` / `24` / `26` 须为非天赋技能。
- **`32`+**：有加点则写，否则省略。

### 示例

三个 MaxLevel 5 小技能 + MaxLevel 4 大招：

```kv
"Build"
{
	"1"		"q"
	"2"		"w"
	"3"		"q"
	"4"		"w"
	"5"		"w"
	"6"		"ult"
	"7"		"q"
	"8"		"e"
	"9"		"q"
	"10"		"talent_10_pick"
	"11"		"w"
	"12"		"ult"
	"13"		"e"
	"14"		"q"
	"15"		"talent_15_pick"
	"16"		"w"
	"17"		""
	"18"		"ult"
	"19"		""
	"20"		"talent_20_pick"
	"21"		""
	"22"		""
	"23"		"e"
	"24"		"ult"
	"25"		"talent_25_pick"
	"26"		"e"
	"27"		"talent_10_other"
	"28"		"talent_15_other"
	"29"		"talent_20_other"
	"30"		"talent_25_other"
	"31"		"e"
}
```

q 5 点 `1→3→7→9→14`，w 5 点 `2→4→5→11→16`（相邻连点合法），e 5 点 `8→13→23→26→31`，ult 4 点 `6→12→18→24`（间隔 6）。

---

## 检测流程

1. **合并槽位** → 有效技能列表 + 有效天赋（八槽）。
2. **查 MaxLevel**。
3. **天赋存在**：`10/15/20/25/27/28/29/30` 的值逐字存在于合并后 Ability10–17。
4. **天赋档位**：首选在对应档内；补选为同档未选的另一个；27=10-other、28=15-other、29=20-other、30=25-other。
5. **技能存在**：非天赋非空项 ∈ 有效技能列表。
6. **次数**：总次数 ≤ MaxLevel；C(L) ≤ ⌊(L+1)/2⌋。
7. **留空**：17/19/21/22 为空，其余非空。
8. **大招**：间隔 ≥ 6、30 不升大、四级大典型 6/12/18/24。

---

## 分工

| 文件 | 职责 |
|------|------|
| `npc_abilities_override.txt` | MaxLevel、数值 |
| `npc_heroes_custom.txt` | 槽位覆盖、Bot.Build、Ability10–17 |

## 汇报

- 可列：有效天赋集合、Build 天赋选择、发现的问题。
- **仅当用户明确要求时再 git commit**。
