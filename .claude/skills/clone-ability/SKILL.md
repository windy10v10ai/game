---
name: clone-ability
description: >-
  Create or fix a custom KV ability that inherits from a vanilla Dota ability
  (BaseClass = original ability name). Supports ability lookup by Chinese name
  or hero-ability format. Merges vanilla KV with override extras. Syncs keys
  on update. Handles innate and regular abilities. Interactive menus for
  ambiguous decisions.
---

# 自定义继承技能（新建 / 修正）

将原版 Dota 技能（先天或普通）克隆为自定义技能名，写入本图 KV 并补全本地化。

> 参考文件路径及技能系统名查找规则见 CLAUDE.md「Dota 2 参考文件速查」章节。

---

## 第一步：解析技能输入

按 CLAUDE.md「技能系统名查找」规则处理（支持系统名 / 中文名 / 英雄名-技能名）。

---

## 第一步 B：存在性检测（自动决定模式与目标文件）

解析出自定义技能名（如 `xxx2`）后，**立即**在两个目标文件中搜索该技能名：

```
Grep pattern: "crystal_maiden_glacial_guard2"  (替换为实际技能名)
files:
  - game/scripts/npc/npc_abilities_custom_lottery.txt
  - game/scripts/npc/npc_abilities_custom.txt
```

根据搜索结果：

| 情况 | 处理 |
|------|------|
| **仅在一个文件中找到** | 自动确定目标文件 = 该文件；操作模式 = **修正**；跳过第二步直接进入第三步 |
| **在两个文件中都找到** | 用 `AskUserQuestion` 询问用户选择哪个文件；操作模式 = **修正** |
| **两个文件中都未找到** | 继续执行第二步前置交互（询问目标文件；操作模式默认**新建**） |

> 发现技能已存在时，告知用户：「已在 `<文件名>` 中找到 `<技能名>`，进入修正模式。」

---

## 第二步：前置交互（仅在技能不存在时执行）

### 2-A 目标文件（用户未指定时询问）

> 「请选择目标文件」

| 选项 | 文件 | 说明 |
|------|------|------|
| 抽奖池技能 | `game/scripts/npc/npc_abilities_custom_lottery.txt` | 随机抽奖系统 |
| 单位 / 英雄专属技能 | `game/scripts/npc/npc_abilities_custom.txt` | 特定单位或自定义英雄 |

### 2-B-extra KV 插入位置（`npc_abilities_custom_lottery.txt`）

该文件内有三个区域，新技能块须插入到对应区域的**末尾**（紧接下一区域的分隔注释之前）：

| 区域 | 位置标志 | 适用技能 |
|------|----------|----------|
| Innate 天赋技能 | `// Innate 天赋 技能`（第 5 行）至 `// 普通升级 技能` 分隔线之前 | 所有从先天技能克隆的自定义技能（流程 A） |
| 普通升级技能 | `// 普通升级 技能` 至 `// lua 技能` 分隔线之前 | 从普通技能克隆的自定义技能（流程 B） |
| lua 技能 | `// lua 技能` 至文件末尾 `}` 之前 | 纯 lua 实现的自定义技能 |

> 用 `grep -n "^//"` 快速定位三个区域的行号。

### 2-B 操作模式

新建模式（技能不存在时默认）；若用户在命令中明确指定「修正」则改为修正模式。

---

## 第三步：BaseClass 类型检查

读取**目标技能块**（新建时读原版名；修正时读现有块）的 `BaseClass`：

| BaseClass 值 | 处理 |
|---|---|
| 原版技能名（如 `dragon_knight_dragon_blood`） | 继续 |
| `ability_datadriven` | **停止**：「该技能为 DataDriven 类型，请人工处理。」 |
| `ability_lua` | **停止**：「该技能为 Lua 类型，请人工处理。」 |

---

## 第四步：读取原版 KV 与 Override 合并

**新建技能**时，KV 基础来源 = 原版 + Override 叠加：

1. 从 `docs/reference/<version>/npc_abilities.txt`（或对应英雄文件）读取原版技能块
2. 在 `game/scripts/npc/npc_abilities_override.txt` 中查找同名技能块：
   - 若存在，将 override 中的**额外设定**（与原版不同的键/值）叠加到原版上
   - Override 中存在而原版没有的键（标注 `// 原版不存在，手动修改`）也需复制
3. 合并结果作为新自定义技能的初始 KV

**修正现有技能**时，跳过此步，直接进入第六步 K 键同步。

> **`dynamic_value` 处理规则**：含 `hero_levelup` 的子块（克隆后 `hero_levelup` 不再生效）需整块移除并将数值扩展为多级。但用于 **tooltip 动态显示**的字段（如 `current_slow_resistance`、`current_aoe`、`attack_speed_tooltip` 等）须保留其 `dynamic_value` 子块，引擎依赖它们计算并显示实时数值。

> **`affected_by_aoe_increase` 处理规则**：原版子块内含 `affected_by_aoe_increase "1"` 的字段（如 `radius`），**不能**写成单值形式，必须保留为子块并显式写入 `affected_by_aoe_increase "1"`，否则 AOE 增益对该字段无效。

---

## 第五步：识别原版技能类型

在合并后的 KV 中判断：

| 字段 | 判定结果 |
|----------|---------|
| `"Innate" "1"` | **先天技能**，走 A 流程或 C 流程（见下） |
| `"Innate" "0"` 或无 Innate 字段 | **普通技能**，走 B 流程 |
| 无法确定 | 用 `AskUserQuestion` 询问用户 |

### 先天技能：选择 A 流程还是 C 流程

对于先天技能，**优先考虑流程 C**（直接用原版名加入抽奖池）：

| 条件 | 推荐流程 |
|------|----------|
| 原版 `AbilityBehavior` 仅含 `HIDDEN`（去掉后即可正常显示和生效） | **流程 C** — override 去 HIDDEN，原版名直接入池 |
| 需要改数值 / 多级成长 / 行为调整（如去掉 `NOT_LEARNABLE`、补 `UNIT_TARGET` 属性等） | **流程 A** — 克隆为自定义技能名 |

---

## 第六步：KV 处理

### 流程 A — 先天技能（原版 Innate "1"）

1. 以第四步合并结果为基础，使用新 key（如 `xxx2`）写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 改为 `"0"`（**必须**，否则引擎仍按先天处理）。
4. `"AbilityBehavior"` → 去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`；抽奖用被动时改为 `"DOTA_ABILITY_BEHAVIOR_PASSIVE"`；保留主动/开关时按原版行为裁剪，确保无 `NOT_LEARNABLE` 等阻止显示的标志。
   - **若结果含 `UNIT_TARGET`**：必须在同一块内**显式写入** `AbilityUnitTargetTeam`、`AbilityUnitTargetType`、`AbilityCastRange`（不能依赖 BaseClass 继承，否则引擎无法选中目标）。同时显式写入 `SpellImmunityType`、`SpellDispellableType`、`AbilityCastPoint`、`AbilityCooldown`、`AbilityManaCost`。
   - **若原版含 `IsGrantedByShard "1"` 或 `HasShardUpgrade "1"`**：自定义块须覆盖为 `"0"`，避免引擎误判需要碎晶才可用。
5. `"AbilityValues"` → 复制字段与子键，但**排除以下项**（与 `update-abilities-override` P1 绝对禁止项保持一致）：
   - 子块内含 `special_bonus_unique_*` / `special_bonus_facet_*` 的行 → 直接删除该行（天赋引用原版技能名，对自定义技能无效）
   - 删除天赋行后，若子块的 `value` 为 `"0"` 且无其他有效子键 → 删除整个子块
   - 子块内含 `special_bonus_scepter` / `special_bonus_shard` → 同上处理
   - **子块内含 `hero_levelup` → 必须移除**（克隆先天技能后 `hero_levelup` 有时不生效）。移除后按以下规则将该数值扩展为多级：
     1. 将 `MaxLevel` 设为 `"5"`
     2. 计算第 5 级目标值 ≈ `base + 49 × hero_levelup步长`（对应原版 50 级时的数值）
     3. 在 `[base, 目标值]` 之间取等差 5 档，取整使数列好看（优先 0.5 / 整数步长）
     4. 其余字段**按判断**决定是否扩展：只有具备成长意义的数值才扩展为 5 级；固定机制值（角度、倍率系数等）保持单值。扩展原则：以**第 3 级 ≈ 原始单值**为锚点，向上下等差延伸，取整使数列好看
   
   其余每个数值右侧用 `//` 标注原版数值（多档整串对照）。
6. `"AbilityTextureName"` → 必填；参考原版资源或同英雄 persona 路径。
7. 仅机制需要时补其他键（`MaxLevel`、`AbilityUnitDamageType` 等）；不删减仍被 Lua 读取的键。

### 流程 B — 普通技能（原版 Innate "0" 或无）

1. 以第四步合并结果为基础，使用新 key 写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 无需写（普通技能默认即为 0）。
4. `"AbilityBehavior"` → 按需保留原版行为；若用于抽奖且为主动技能，确认无需调整 behavior。
   - **若结果含 `UNIT_TARGET`**：同流程 A 第 4 步，必须显式写入目标队伍/类型/射程等施法属性。
   - **若原版含 `IsGrantedByShard "1"` 或 `HasShardUpgrade "1"`**：同流程 A 第 4 步，自定义块须覆盖为 `"0"`。
5. `"AbilityValues"` → 同流程 A 第 5 步。
6. `"AbilityTextureName"` → 必填。
7. 同流程 A 第 7 步。

### 流程 C — 原版先天技能直接入池（去 HIDDEN override）

适用条件：原版技能含 `DOTA_ABILITY_BEHAVIOR_HIDDEN`，去掉该标志后即可正常显示与生效，无需改数值或行为。

1. 在 `game/scripts/npc/npc_abilities_override.txt` 中为原版技能名添加（或更新）一个块，仅覆盖 `AbilityBehavior`，去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`，其余 behavior 标志原封不动保留。
2. **不**在 `npc_abilities_custom_lottery.txt` 中新建任何 KV 块。
3. **不**在本地化文件中新增任何条目（原版本地化已覆盖）。
4. 在 `lottery-abilities.ts` 中以**原版技能名**直接加入对应 tier 的 `// 被动技能` 区域（非「自定义技能」区域）。

---

## 第七步：修正模式 — K 键同步原版

仅在**修正现有技能**时执行此步。规则与 `update-abilities-override` 的 P1 相同：

1. 从 `docs/reference/<version>/npc_abilities.txt` 读取原版当前版本的完整键集合
2. **删除**现有自定义块中已与原版**同值**的键（原版合并时会自动继承，无需重复写）
3. **删除**原版已不存在的键（除非行尾明确注释 `// 原版不存在，手动修改`）
4. **补充**自定义块中缺失但技能正常运行所需的键（包括：多档数值键、`AbilityUnitTargetTeam`/`AbilityUnitTargetType`/`AbilityCastRange` 等施法属性、`SpellImmunityType`、`SpellDispellableType` 等）
5. 结合 override 叠加逻辑：若原版键值已被 override 修改，同步使用 override 的值

---

## 第八步：本地化

1. 用 Grep 工具搜索原版技能名的所有 Tooltip 键：
   ```
   pattern: DOTA_Tooltip_ability_<原版名>
   file: docs/reference/<version>/abilities_english.txt
   file: docs/reference/<version>/abilities_schinese.txt
   ```
2. 将键名中的原版技能名替换为自定义技能名，值保持与原版一致。
3. 至少包含：`DOTA_Tooltip_ability_<name>`、`_Description`，以及说明中 `%变量名%` 对应的 `_<suffix>` 行。
4. 同步写入 `game/resource/addon_english.txt` 与 `addon_schinese.txt`，遵循 localization-format-guide 的缩进与 tab 规则。每组技能条目前加 `// 英雄名 技能名` 注释，条目后留一个空行；两个文件的注释内容**完全相同**（均使用中文注释）。
5. 不沿用原版 Facet 文案键时可跳过 `Facet_` 条目。

---

## 可选：抽奖与 Bot 注册

若技能进抽奖池，在 `src/vscripts/modules/lottery/lottery-abilities.ts`（及需要时 `lottery-abilities-bot.ts`）中加入新技能名，档位与注释风格与现有条目一致。

---

## 参考范例

`npc_abilities_custom_lottery.txt` 中 `dragon_knight_dragon_blood2`（先天→普通，流程 A）；本地化在 `addon_english.txt` / `addon_schinese.txt` 中检索同名。

---

## 自检清单

- [ ] 技能系统名已正确解析（中文/英雄名-技能名格式已转换）
- [ ] BaseClass 为原版技能名（非 `ability_lua` / `ability_datadriven`）
- [ ] 新建时已叠加 override 额外设定
- [ ] 流程 A：`"Innate" "0"` 且 `AbilityBehavior` 无 `HIDDEN`
- [ ] 流程 B：Innate 字段按需处理，Behavior 与原版一致
- [ ] `AbilityValues` 已排除 `special_bonus_unique_*` / `special_bonus_facet_*` / `special_bonus_scepter` / `special_bonus_shard` 天赋引用行；删除天赋行后 value 为 "0" 的子块已整块删除
- [ ] 流程 A：若原版含 `hero_levelup`，已移除并扩展为 5 级多档（第 5 级 ≈ 原版 lv50 值，等差取整；其他适合成长的字段以第 3 级 ≈ 原始值为锚点向上下等差延伸，固定机制值保持单值）
- [ ] `AbilityValues` 所有覆盖项带 `//` 原版对照
- [ ] `AbilityTextureName` 已填写
- [ ] 若 `AbilityBehavior` 含 `UNIT_TARGET`：已显式写入 `AbilityUnitTargetTeam`、`AbilityUnitTargetType`、`AbilityCastRange`、`SpellImmunityType`、`SpellDispellableType`、`AbilityCastPoint`、`AbilityCooldown`、`AbilityManaCost`
- [ ] 若原版含 `IsGrantedByShard "1"` 或 `HasShardUpgrade "1"`：自定义块已覆盖为 `"0"`
- [ ] 修正模式：已按原版同步 K 键（删同值、删已废键、补新键）
- [ ] `addon_english.txt` 与 `addon_schinese.txt` 键集合一致，占位符与原版一致
- [ ] 若进抽奖池，已改 lottery TS 列表
- [ ] 流程 C：仅在 override 中去掉 `HIDDEN`，其余 behavior 保留；原版名直接写入 lottery TS `// 被动技能` 区域；无需新建 KV 块或本地化条目
