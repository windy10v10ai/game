---
name: update-heroes-custom
description: >-
  维护 game/scripts/npc/npc_heroes_custom.txt 的 Bot 配置：合并 Ability 槽位（custom 覆盖官方）、按 override/原版解析技能 MaxLevel，
  校验 Bot.Build 与有效技能集合、天赋槽与等级键约束（天赋固定位、大招间隔 6/12/18/24 满四级大、30 不升大、第五个小技能常放 31；小技能累计上限；仅 17/19/21/22 可留空，23/24/26 须非天赋技能）。
---

# Update Heroes Custom

本技能针对 `game/scripts/npc/npc_heroes_custom.txt`，保证 **`Bot` → `Build`** 与英雄**实际拥有的技能**、**各技能可升等级数**、**`Ability10`–`Ability17` 天赋**及下文**等级键约束**一致。

## 何时使用

- 版本更新或改 `Ability*` / override 后，检查 Bot 是否仍点到存在的技能、加点是否超过 `MaxLevel`。
- 调整 `Bot.Build` 或自定义槽位后做自检；用户要求核对「Bot 加点 / 天赋 / 技能等级 / 等级键」时。

## 输入与前置条件

- 参考版本号 `{version}`：`docs/reference/{version}/npc_heroes.txt`、同目录 `heroes/npc_dota_hero_<hero>.txt`（或 `npc_abilities.txt`）。
- 本图：`game/scripts/npc/npc_heroes_custom.txt`、`game/scripts/npc/npc_abilities_override.txt`（按技能名检索覆盖块）。

```bash
grep -n "npc_dota_hero_tinker" game/scripts/npc/npc_heroes_custom.txt
grep -n "tinker_laser" game/scripts/npc/npc_abilities_override.txt
```

---

## 技能槽位：官方 + 自定义合并（检测必读）

对同一 `npc_dota_hero_*`：

1. 在 **`docs/reference/{version}/npc_heroes.txt`** 读取 `Ability1`…（至 `AbilityTalentStart` 前，及 Build 中会出现的额外槽如 `Ability5`、`Ability6`）。
2. 在 **`npc_heroes_custom.txt`** 读取同名英雄的同名槽位键。
3. **合并**：某槽位 **custom 有定义则以 custom 为准**，否则沿用官方。

得到 **有效技能列表**。`Bot.Build` 里**非天赋**技能名须属于该列表（`generic_hidden`、`""` 等按项目约定）。

---

## 各技能 MaxLevel：override 优先，否则原版

对每个**有效技能名**（非空、非占位）：

1. **`npc_abilities_override.txt`** 有块且含 **`MaxLevel`** → 以 override 为准。
2. 否则 **`heroes/npc_dota_hero_<hero>.txt`** → 再否则 **`npc_abilities.txt`**。
3. 仍无则按 **`update-abilities-override`** 的缺省规则推断（大招 3、其余 4 等），注明「推断」。

> Bot 对该技能的加点次数 **≤** 有效 `MaxLevel`（常规满加则次数 **=** `MaxLevel`，除非刻意少点）。

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

- 键 **`"1"`…`"30"`**（及续写 **`"31"`**…）对应**升到该英雄等级**时的选择；**`""`** 仅用于**不点技能**的占位，**不计入**某技能加点次数。
- **必填键**：凡在 `Build` 中写出的 **`"1"`…`"30"`** 及 **`"31"`**（若存在），除下文 **`17`/`19`/`21`/`22`** 四键**必须**为 **`""`** 外，**其余键须为非空**（天赋或有效技能名等），**不得**用 **`""`** 占其它等级位。
- **`"32"` 及更高**：该级仍须加点则写技能或天赋；**若该级及之后均无加点**，从首个无加点的等级起**省略后续键**（勿写 **`"N" ""`**；本图 `Bot` 脚本对缺失键与「不点」一致）。

### 等级键约束（本图）

除 **有效技能列表** 与 **MaxLevel** 外，`Build` 还须满足：

| 类别 | 规则 |
| ---- | ---- |
| **天赋** | 键 **`10`、`15`、`20`、`25`、`27`、`28`、`29`、`30`** 仅能填合并后 **`Ability10`–`Ability17`** 中的天赋。`10`/`15`/`20`/`25` 各选该档**两天赋之一**；`27`–`30` 分别补**同档未选**的另一侧，且与同档首次**不得同名**。 |
| **大招** | 同一大招加点键升序 **U_i** 满足 **U_{i+1} − U_i ≥ 6**；**`30`** 不升大。前四档典型 **`6`、`12`、`18`、`24`**。常规 **`MaxLevel` 为 4** 的大招应在此四处升满；**勿**把第四级压在 **`31`**，否则 **`23`/`24`/`26`** 须排小技能时，易出现小技能第五级无处落键、被迫与第四级大抢位。第五个小技能点宜写在 **`31`**。 |
| **小技能** | **累计上限（按英雄等级）**，见下；**不是**「同一技能两次加点键之差 ≥ 2」。 |
| **留空** | 仅 **`17`、`19`、`21`、`22`** 须 **`""`**；**其它已写出的等级键不得为空**。 |
| **23 / 24 / 26** | 须排**非天赋**技能（小技能或符合间隔的大招等），与上表及 **`MaxLevel`**、小技能累计上限同时成立。 |

**小技能累计上限**：对每个**小技能** **S**、每个英雄等级 **L ≥ 1**，令 **C(L)** 为 **S** 在 **`Build`** 键 **`"1"`…`"L"`** 中的出现次数（仅统计值为 **S** 的项；**`""`**、天赋键不计入）。须满足 **C(L) ≤ ⌊(L+1)/2⌋**（等价：**1** 级止至多 **1** 次，**3** 级止至多 **2** 次，**5** 级止至多 **3** 次，**7** 级止至多 **4** 次，**9** 级止至多 **5** 次……）。另须 **整条 `Build` 中 S 的总次数 ≤** 该技能有效 **`MaxLevel`**（二者同时满足）。

**允许**在**相邻两级**连点同一小技能（如 **`4`→`5`** 均为 **`example_w`**），只要在每个 **L** 上 **C(L)** 不超过上式；至 **5** 级时 **`w`** 共 **3** 次未超过「**5** 级止至多 **3** 次」即合法：

```kv
	"1"		"example_q"
	"2"		"example_w"
	"3"		"example_q"
	"4"		"example_w"
	"5"		"example_w"
```

除 **`17`/`19`/`21`/`22`** 外，**任意**等级键（含 **`2`、`4`、`8`、`23`、`24`、`26`** 等）**不得**为 **`""`**，须为合法天赋或非天赋技能；**不得**在天赋固定位填非天赋，**不得**在 **`17`–`22`** 填技能。

无大招英雄在 **`6`/`12`/`18`/`24`** 等原大招位改点小技能或其它合法技能，仍须满足除四键外的**非空**与累计上限。  
校验 **C(L)** 时：**`""`** 与天赋键不计入小技能次数；除 **`17`/`19`/`21`/`22`** 外不应出现 **`""`**。对每个 **S** 从 **L = 1** 扫到待验最大等级（如 **`30`** 或配置中实际出现的最大键）。有大招时按加点键序列验 **≥ 6** 间隔。

#### `Build` 等级键布局示例（`1`–`30` + 续写）

占位：`example_q` / `example_w` / `example_e`（示意 **`MaxLevel` 5**）、`example_ultimate`；**`special_bonus_*` 须换成该英雄真实天赋**，并满足上表天赋规则。

```kv
"Build"
{
	"1"		"example_q"
	"2"		"example_w"
	"3"		"example_q"
	"4"		"example_w"
	"5"		"example_w"
	"6"		"example_ultimate"
	"7"		"example_q"
	"8"		"example_e"
	"9"		"example_q"
	"10"		"special_bonus_hero_10_pick"
	"11"		"example_w"
	"12"		"example_ultimate"
	"13"		"example_e"
	"14"		"example_q"
	"15"		"special_bonus_hero_15_pick"
	"16"		"example_w"
	"17"		""
	"18"		"example_ultimate"
	"19"		""
	"20"		"special_bonus_hero_20_pick"
	"21"		""
	"22"		""
	"23"		"example_e"
	"24"		"example_ultimate"
	"25"		"special_bonus_hero_25_pick"
	"26"		"example_e"
	"27"		"special_bonus_hero_10_other"
	"28"		"special_bonus_hero_15_other"
	"29"		"special_bonus_hero_20_other"
	"30"		"special_bonus_hero_25_other"
}
```

示意摘要：`q` **`1→3→7→9→14`**（**`14`** 为第 **5** 点 **`q`**，**C(14)=5 ≤ ⌊15/2⌋`**），`w` **`2→4→5→11→16`**（**`4`→`5`** 可连升 **`w`**），`e` **`8→13→23→26`**，第 **5** 点 **`e`** 在 **`31`**；第四级大在 **`24`**，与 **`6`/`12`/`18`** 各隔 **6** 级。**`31` 及以后**仍须满足 **累计上限**、**`MaxLevel`** 与**大招间隔**：

```kv
	"31"		"example_e"
	"32"		"example_ultimate"
```

**`32`** 起：仍有合法加点则继续写键；**自某级起整段无加点**则**不写**该级及更高键（勿再写 **`"N" ""`**）。

---

## 非天赋技能：`Bot.Build` 校验要点

排除 **天赋**（`special_bonus_*` 或合并后 `Ability10`–`Ability17` 中的名字）后，对其余非空项检查：

1. **存在性**：技能名 ∈ **合并后的有效技能列表**。
2. **次数**：出现次数 **≤** 有效 `MaxLevel`（常规满加应与 `MaxLevel` 一致，除非刻意少点）。
3. **等级键**：符合上文 **「等级键约束（本图）」**。

校验 **除 `17`/`19`/`21`/`22` 外** **`"1"`–`"30"`**（及已写的 **`"31"`**…）**每一项均非空**；并对其中的非天赋项检查存在性、次数与等级键约束（不仅 10/15/20/25/27–30）。

---

## 天赋槽位与 `Ability10`–`Ability17`（数据来源）

| 英雄等级档 | 槽位键 |
| ---------- | ------ |
| 10 级档 | `Ability10`、`Ability11` |
| 15 级档 | `Ability12`、`Ability13` |
| 20 级档 | `Ability14`、`Ability15` |
| 25 级档 | `Ability16`、`Ability17` |

- **官方**：`npc_heroes.txt` 中该英雄的 `Ability10`–`Ability17`。
- **自定义**：`npc_heroes_custom.txt` 同名键 **覆盖** 官方。
- **有效天赋集合**：八槽「custom 优先，否则官方」，用于校验 `Build["10"]`…`["30"]` 中的天赋名及 **「等级键约束」** 中的天赋规则。

---

## 推荐检测流程（单英雄）

1. 合并 **`npc_heroes.txt`** + **`npc_heroes_custom.txt`** 槽位 → **有效技能列表**。
2. 各技能 **MaxLevel**：**override → `heroes/…` → `npc_abilities.txt` → 推断**。
3. 读 **`Bot.Build`**。
4. **非空**：除 **`17`/`19`/`21`/`22`** 外，已写等级键无 **`""`**。
5. **非天赋**：∈ 列表、次数、`MaxLevel`、**等级键约束**。
6. **天赋**：`10`/`15`/`20`/`25`/`27`–`30` 内容与 **Ability10–17 / 补位规则** 一致。
7. 改版后先更新槽位与 override，再改 `Build`。
8. 有大招且 **`MaxLevel` 为 4** 时，核对第四级是否在 **`24`**（或满足间隔的更早键），**`31`** 是否留给第五个小技能等收尾加点；与 **`npc_dota_hero_axe`、`npc_dota_hero_earthshaker`** 等已对齐工程惯例的配置对照。

---

## 与 `update-abilities-override` 的分工

| 文件 | 职责 |
| ---- | ---- |
| `npc_abilities_override.txt` | `MaxLevel`、数值、键结构 |
| `npc_heroes_custom.txt` | 槽位覆盖、`Bot.Build`、`Ability10`–`Ability17` |

---

## 汇报与提交

- 可列：槽位摘要、`MaxLevel` 来源、加点次数、**等级键**、天赋是否通过。
- **仅当用户明确要求时再 git commit**。
