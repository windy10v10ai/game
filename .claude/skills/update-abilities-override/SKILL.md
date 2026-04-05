---
name: update-abilities-override
description: >-
  Dota 版本更新时，以 docs/reference 中官方技能 KV 为骨架维护 game/scripts/npc/npc_abilities_override.txt：
  键与参考对齐、与参考同值的键不保留、扩展 MaxLevel 与加强规律；未指定技能时从 npc_heroes.txt 定槽位范围；行尾注释格式见正文。
---

# Update Abilities Override

在 Dota 2 版本更新后，把**当前版本官方技能 KV**同步进 `game/scripts/npc/npc_abilities_override.txt`，并叠加本图规则（扩展等级、有意加强等）。以参考为底稿；**与参考相同的键不写进 override**（见「同值不保留」与下节行尾注释）。

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

用户**未列出**要改的技能名时，在 **`docs/reference/{version}/npc_heroes.txt`** 中定位该英雄块，读取槽位，并在 **`npc_abilities_override.txt`** 中确保**同名技能**均有对应 override 块（与参考拉齐骨架并维护本图数值）。

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

| 原则 | 说明 |
| ---- | ---- |
| **参考骨架** | 每个技能的键层级与参考中同名技能一致；官方已删的键从 override 移除。 |
| **同值不保留** | 某键**数值与参考一致**且无单独说明需求时，**不要**在 override 写该键（含勿用行尾备忘）；**删除该行**。 |
| **键集合** | 原则上**不增加**参考里同名技能**没有的键**。若本图确需增键，在**该技能块上方**用 `//` **中文说明原因**即可。 |
| **多级数值与 MaxLevel** | `value`、`AbilityCooldown`、`AbilityManaCost` 等分档个数须与**有效 MaxLevel**一致；无 `MaxLevel` 时按下文「缺省 MaxLevel」推断。 |

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

- 前若干档与官方相同；新档按官方等差（或明显规律）延伸。
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

- 官方删除的键、命石/魔晶结构变化：override 中**删除**对应废弃内容。
- 同步后检查：键与参考对齐、多档长度、行尾对照数与**当前参考**一致。

---

## 推荐执行顺序（逐英雄）

1. **定技能列表**：若用户未给具体技能名 → 从 `npc_heroes.txt`（及必要时 `npc_heroes_custom.txt` 槽位覆盖）读取 `Ability1`–`3`、`Ability6`，并按上节规则决定是否包含 `Ability4`–`5`。
2. **定位**：在 override 与 `heroes/npc_dota_hero_*.txt` 中定位上述技能名。
3. **拉骨架**：以参考内各技能块为准，对齐同名块键结构。
4. **分类**：无加强 / 固定差 / 倍数等。
5. **改值 + 注释**：沿用**同文件、同英雄区段**已有注释风格。
6. **校验**：多档个数、过时键、增键是否在块首有说明。
7. **汇报**：仅当用户明确要求时再 `git commit`。

---

## 不应做的事

- 引入与全文件、同英雄区段**割裂**的注释风格（应沿用邻行既有写法）。
- **无说明**地增加参考中不存在的键。
- 参考已更新后，仍不按行尾备注重算 `value`，或行尾对照数未与**当前参考**对齐。
- 一次读入整个 `npc_abilities_override.txt`；用 `grep`/片段读取。

---

## 相关：Cursor 规则

IDE 编辑本文件时可能附带 `.cursor/rules/npc_abilities_override_rules.mdc`；**流程与注释惯例以本 SKILL 为准**。
