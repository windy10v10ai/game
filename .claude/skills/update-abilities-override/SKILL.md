---
name: update-abilities-override
description: >-
  Dota 版本更新时，以 docs/reference 中官方技能 KV 为骨架维护 game/scripts/npc/npc_abilities_override.txt：
  仅写差分；**同值（含多档每档与参考相同）优先于补全等级**：视同原版、删整键；再处理确有差分的多档与 MaxLevel；禁 facet（7.41+）；行尾注释见正文。
---

# Update Abilities Override

在 Dota 2 版本更新后，把**本图相对当前参考的差分**写进 `game/scripts/npc/npc_abilities_override.txt`（扩展等级、有意加强等）。**引擎会从原版合并缺失键**；override **只应出现与参考相比有改动的键**（见「同值不保留」）。

## 何时使用

- 大版本（如 7.40、7.41）后维护 `npc_abilities_override.txt`。
- 按英雄逐个对齐官方参考、扩展 `MaxLevel`、延续固定加强或倍数加强。

## 输入与前置条件

用户应尽量提供：

- 参考版本号 `{version}`（与 `docs/reference/{version}/` 目录一致）。
- 待处理英雄列表（按顺序逐个）。
- GitHub Issue URL（可选，用于进度追踪）。

确认存在：

- `docs/reference/{version}/npc_heroes.txt`（英雄 `Ability1`–`Ability6` 槽位，见下节「未指定技能时」）。
- `docs/reference/{version}/heroes/npc_dota_hero_{hero}.txt`（各技能 KV 官方块，本仓库内多为 `DOTAAbilities` 切片）。
- `docs/reference/{version}/abilities_schinese.txt`（可选，用于表格/说明可读性）。

```bash
grep -n "ability_name" game/scripts/npc/npc_abilities_override.txt
grep -n '"npc_dota_hero_antimage"' docs/reference/{version}/npc_heroes.txt
```

---

## 未指定具体技能时：用 `npc_heroes.txt` 定范围

用户**未列出**要改的技能名时，在 **`docs/reference/{version}/npc_heroes.txt`** 中定位该英雄块，读取槽位，并在 **`npc_abilities_override.txt`** 中**逐个核对**同名技能：仅保留**确有本图差分**的技能块；无差分的技能**不写整块**。

### 必看的四个槽位

以下槽位在常规英雄上对应「三小技能 + 大招」，**一律**纳入本次更新范围（除非用户明确排除）：

| 槽位 | 含义（典型） |
| ---- | ------------ |
| `Ability1` | 一技能 |
| `Ability2` | 二技能 |
| `Ability3` | 三技能 |
| `Ability6` | 大招（非 `Ability4`） |

示例（敌法师）：

```kv
"Ability1"		"antimage_mana_break"
"Ability2"		"antimage_blink"
"Ability3"		"antimage_counterspell"
"Ability6"		"antimage_mana_void"
```

### `Ability4` / `Ability5`：仅在为实技能时处理

- 若为 **`generic_hidden`**：视为**空槽**，**不必**为「占位」单独写 override。
- 若**不是** `generic_hidden`：值为真实技能名时，该技能**同样**须按参考同步进 `npc_abilities_override.txt`（与 `Ability1`–`3`、`Ability6` 相同规则）。

> **自定义英雄**：若 `npc_heroes_custom.txt` 覆盖了某槽位技能名，以 **custom 槽位**为准再解析要维护的 override 技能列表（与 `update-heroes-custom` 槽位合并规则一致）。

---

## 核心原则

**优先级（维护任一技能时按此顺序想，避免和下面各条打架）：**

1. **先**做「同值」判定（含**同值多档**，见下表）：与参考**逐字相同**的单值、或多档中**每一档**与参考**对应档**数值相同（含参考只有 3 档、本图 `MaxLevel` 为 4 却把第 4 档写成与前几档相同的「凑档」，如 `20.0`×4 且参考为 `20.0`×3）——**一律视同与原版无差分，整键删除**，**不得**为对齐本图 `MaxLevel` 而在 override **补写或拉长**该键。
2. **再**处理确有本图数值差分的键：固定加、倍数、延伸**且**新档相对官方有**实质变化**等。
3. **最后**对「仍保留在 override 里的多档键」核对：档数须与本技能有效 `MaxLevel` 一致（见下「多级数值与 MaxLevel」）。**已按第 1 步删除的键，不要求在 override 里补档。**

| 原则 | 说明 |
| ---- | ---- |
| **差分-only** | override **不是**「把参考里的技能再抄一遍」。凡在参考中**已存在且与参考逐字相同**的键（含子键），**一律不得**出现在 override 中；由原版 KV 提供即可。 |
| **同值不保留（须严格执行）** | 含但不限于：`AbilityBehavior`、`AbilityUnitTargetTeam` / `Type`、`SpellImmunityType`、`SpellDispellableType`、`AbilityType`、`FightRecapLevel`、`AbilitySound`、`IsShardUpgrade`、`IsGrantedByShard`、`HasScepterUpgrade`、`Innate`、`AbilityCastAnimation`、**与参考相同的** `AbilityCastPoint` / `AbilityCastRange`、`AbilityChannelTime`、`CalculateSpellDamageTooltip`、`DamageTypeTooltip`、`affected_by_aoe_increase` 等——只要**值与参考完全一致**就**删除**，不要为了「看起来完整」而抄写。 |
| **本图仍须写明的情形** | 仅当：**至少一档数值**与参考不同、`MaxLevel` 扩展且伴随**实质数值变化**、或**子树中某一枝**与参考不同时，才写对应键；**仅**比参考多一档但**各档数字与参考对应档仍相同**的，不算「须写明」，见「同值多档」。可只写变化的子键，**不要**顺带贴上同值的兄弟键。 |
| **官方已删** | 参考中已删除的键，override 内不得再保留。 |
| **`special_bonus_facet_*` 已废（7.41+）** | override **禁止**再写。参考里若某 `AbilityValues` 子键**仅有**已废 facet、**没有**顶层 `value`**，视为官方当前无此数值通道——**不得**在 override **新造** `value` 续命；**删除** override 中该键整条。若官方把同一效果挪到别的键或天赋，再按新结构写差分。 |
| **同值多档** | 多档 `value`（或同级结构）若**每一档与参考对应档的数值相同**，**视同单值与原版一致**：整键**不写入** override、已写入的**删除**，交给原版合并。**优先于**「本图 `MaxLevel` 更高所以要补全档数」——**禁止**为凑档而把 `125`×4 抄成 `125`×5，或把 `AbilityDuration` 参考 `20.0`×3 抄成 `20.0`×4（各档仍 20）。**仅当至少有一档与参考对应档不同**（本图加强或规则化延伸出**新数**）时，才在 override 写该键，并写满与有效 `MaxLevel` 一致的档数。 |
| **键集合** | 原则上**不增加**参考里同名技能**没有的键**。若本图确需增键，在**该技能块上方**用 `//` **中文说明原因**即可。 |
| **多级数值与 MaxLevel** | **仅适用于**经「同值多档」判定后**仍须保留**在 override 中的多档字段：其档数须与本技能有效 `MaxLevel` 一致。若整键已因同值删除，**不要求**在 override 为该键补档。未出现在 override 的字段仍由原版提供。无 `MaxLevel` 时按下文「缺省 MaxLevel」推断。 |

---

## 行尾注释

与块首 `// 中文技能名` 等搭配使用；**仅在本图数值与参考不一致**（或需说明倍率/差值/设计意图）时，在**保留的键行**上写行尾注释。

| 用途 | 示例 |
| ---- | ---- |
| 单值相对原版 | `"AbilityCooldown" "12" // 18` |
| 多档相对原版 | `"90 80 70 60" // 150 130 110` |
| 倍数 | `// 150 130 110 x2` |
| 固定加层 / 差值说明 | `"value" "300 500 700 900" // 200 400 600 800 +100`、`"+30" // 10 +20差值` |
| 纯说明（无数字） | `// 白送天赋`、`// 与镖同步`、`// 百分比伤害，限制上限` |

**惯例**：

- **与参考同值**：不要在 override 里留「仅备忘」行；**删除该键这一行**（不要用 `"30" // 30` 等形式占坑）。若删完后该技能块已与参考无任何本图差异，按项目习惯可整段去掉该技能 override。
- **有改动、需对照或说明倍率/差值**的键行保留，并写行尾注释，便于下次版本同步时重算。
- **`//` 后对照数**：只写 **当前参考里该键的官方数值**（单值或多档空格分隔）；参考里若**没有**顶层 `value`、仅在已废弃的 `special_bonus_facet_*` 下有过数，**只写那个数字作对照**，**不要**在注释里写「命石」「facet」或旧子键名。本图专有说明（如「五档」）可简短接在分号后。
- **参考换新版本后**：仍保留的键上，行尾**对照数**须更新为**当前参考**里该键的官方值；本图 `value` 按备注中的**同一修改方式**（倍数、差值等）在**新参考官方数**上重算。

---

## 本图等级规则

**先按参考里的 `AbilityType` 区分：**

- **大招**：`AbilityType` 为 `ABILITY_TYPE_ULTIMATE`。
- **小招**：**非** `ABILITY_TYPE_ULTIMATE` 的其它技能（常规技能）。

**本图目标 `MaxLevel`：**

| 类型 | `MaxLevel` |
| ---- | ---------- |
| 小招 | 5 |
| 大招 | 4 |
| 特殊技能 | 单独与策划/注释约定 |

### 缺省 MaxLevel（仅当参考块与 override 均未写 `MaxLevel` 时，用于核对参考里多级 value 档位数）

| 条件 | 推断有效等级 |
| ---- | ------------- |
| 大招（`ABILITY_TYPE_ULTIMATE`） | 3 |
| 小招（其它 `AbilityType`） | 4 |

若任一侧已写明 `MaxLevel`，以**显式值**为准；本图扩展仍以「小招 5 / 大招 4」为默认目标，除非另有约定。

---

## 数值情形速查（本图相对官方）

处理某英雄前，先判定每个相关技能属于哪一类，**整技能保持一致策略**。

### 1. 仅等级扩展（无加强）

- **先做「同值多档」判定**：若延伸后各档仍与参考已有档**同数值**（例如官方三档全 `20`、本图第四档仍 `20`），属于**无实质差分**，**删整键**，不按本节补档（见核心原则优先级第 1 步）。
- 仅当新档相对参考末档按**等差或其它规律得到新数**（与参考任一档不同）时：前若干档与官方相同；新档按官方等差（或明显规律）延伸。
- 注释可写**新档对应的参考档**（空格分档数字），风格与邻行一致即可，例如扩展后整行后附 `// 80 110 140 170` 表示参考前四档。

### 2. 固定数值加强 / 差值

- 官方更新后保持**固定差**或备注中的 **+N 差值**（参见 `// 10 +20差值` 类写法）。
- 行尾用 `// +100`、`// 10 +20差值` 等与现有文件一致即可。

### 3. 翻倍或其它倍数

- 新官方值 × 固定倍率；行尾 **`// x2`** 或 **`// (x1.5)`**。

### 4. 其它

- 等差重算、单值改多档等：在块首或行尾用**中文**说明意图，沿用文件中 `// …` 说明型注释风格。

### 5. 最大档保持不变的特例

- 过短 CD（小招末级 ≤10s、大招末级 ≤60s）、高百分比、`radius` 等：末档可与参考末档持平，不按等差再抬——见邻区技能写法。

---

## 官方重构时的清理

- 官方删除的键与 KV 结构变化：override 中**删除**对应废弃内容；全文件 `grep special_bonus_facet_` 清理（规则见上表）。
- 同步后检查：无同值抄写、无 `special_bonus_facet_*`；**仍保留在 override 内**的多档键长度与 `MaxLevel` 一致；行尾对照为**当前参考官方数**、注释无命石/facet 名。

---

## 推荐执行顺序（逐英雄）

1. **定技能列表**：若用户未给具体技能名 → 从 `npc_heroes.txt`（及必要时 `npc_heroes_custom.txt` 槽位覆盖）读取 `Ability1`–`3`、`Ability6`，并按上节规则决定是否包含 `Ability4`–`5`。
2. **定位**：在 override 与 `heroes/npc_dota_hero_*.txt` 中定位上述技能名。
3. **逐键对照参考**：对每个技能，只把**与参考不同**的键写入（或保留）override；**删除**与参考逐字相同的键（含 `AbilityBehavior` 等）。**同一轮内先删「同值 / 同值多档」整键**，再考虑为**确有差分**的键补全与 `MaxLevel` 对齐的档数。
4. **分类**：无加强 / 固定差 / 倍数等。
5. **改值 + 注释**：沿用**同文件、同英雄区段**已有注释风格。
6. **校验**：无「同值抄写」；**仅针对保留的多档键**核对与 `MaxLevel` 一致；过时键已删；增键是否在块首有说明。
7. **汇报**：仅当用户明确要求时再 `git commit`。

---

## 不应做的事

- **把参考里与原版一致的键抄进 override**（含 `AbilityBehavior`、免疫/目标类型、`AbilityCastAnimation` 等），无论是否为了「结构好看」——与上表「差分-only / 同值不保留」相反的做法一律避免（**以核心原则表为准**）。
- **行尾注释写命石、facet 名称或已删子键名**（对照只写官方数，见「行尾注释」惯例）。
- 引入与全文件、同英雄区段**割裂**的注释风格（应沿用邻行既有写法）。
- **无说明**地增加参考中不存在的键。
- 参考已更新后，仍不按行尾备注重算 `value`，或行尾对照数未与**当前参考**对齐。
- 一次读入整个 `npc_abilities_override.txt`；用 `grep`/片段读取。

---

## 相关：Cursor 规则

IDE 编辑本文件时可能附带 `.cursor/rules/npc_abilities_override_rules.mdc`；**流程与注释惯例以本 SKILL 为准**。
