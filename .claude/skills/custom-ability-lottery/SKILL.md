---
name: custom-ability-lottery
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

## 第二步：前置交互

### 2-A 目标文件（用户未指定时询问）

> 「请选择目标文件」

| 选项 | 文件 | 说明 |
|------|------|------|
| 抽奖池技能 | `game/scripts/npc/npc_abilities_custom_lottery.txt` | 随机抽奖系统 |
| 单位 / 英雄专属技能 | `game/scripts/npc/npc_abilities_custom.txt` | 特定单位或自定义英雄 |

### 2-B 操作模式（用户未明确时询问）

> 「请选择操作」

| 选项 | 说明 |
|------|------|
| 新建技能 | 从原版技能克隆，写入目标文件 |
| 修正现有技能 | 比对原版，修正已有自定义块的错误或缺失 |

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

---

## 第五步：识别原版技能类型

在合并后的 KV 中判断：

| 字段 | 判定结果 |
|----------|---------|
| `"Innate" "1"` | **先天技能**，走 A 流程 |
| `"Innate" "0"` 或无 Innate 字段 | **普通技能**，走 B 流程 |
| 无法确定 | 用 `AskUserQuestion` 询问用户 |

---

## 第六步：KV 处理

### 流程 A — 先天技能（原版 Innate "1"）

1. 以第四步合并结果为基础，使用新 key（如 `xxx2`）写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 改为 `"0"`（**必须**，否则引擎仍按先天处理）。
4. `"AbilityBehavior"` → 去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`；抽奖用被动时改为 `"DOTA_ABILITY_BEHAVIOR_PASSIVE"`；保留主动/开关时按原版行为裁剪，确保无 `NOT_LEARNABLE` 等阻止显示的标志。
5. `"AbilityValues"` → 复制全部字段与子键；每个数值右侧用 `//` 标注原版数值（多档整串对照）。
6. `"AbilityTextureName"` → 必填；参考原版资源或同英雄 persona 路径。
7. 仅机制需要时补其他键（`MaxLevel`、`AbilityUnitDamageType` 等）；不删减仍被 Lua 读取的键。

### 流程 B — 普通技能（原版 Innate "0" 或无）

1. 以第四步合并结果为基础，使用新 key 写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 无需写（普通技能默认即为 0）。
4. `"AbilityBehavior"` → 按需保留原版行为；若用于抽奖且为主动技能，确认无需调整 behavior。
5. `"AbilityValues"` → 同流程 A 第 5 步。
6. `"AbilityTextureName"` → 必填。
7. 同流程 A 第 7 步。

---

## 第七步：修正模式 — K 键同步原版

仅在**修正现有技能**时执行此步。规则与 `update-abilities-override` 的 P1 相同：

1. 从 `docs/reference/<version>/npc_abilities.txt` 读取原版当前版本的完整键集合
2. **删除**现有自定义块中已与原版**同值**的键（原版合并时会自动继承，无需重复写）
3. **删除**原版已不存在的键（除非行尾明确注释 `// 原版不存在，手动修改`）
4. **补充**原版新增但自定义块缺失的多档键（按 P2 差分/扩展规则填写）
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
4. 同步写入 `game/resource/addon_english.txt` 与 `addon_schinese.txt`，遵循 localization-format-guide 的缩进与 tab 规则。
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
- [ ] `AbilityValues` 所有覆盖项带 `//` 原版对照
- [ ] `AbilityTextureName` 已填写
- [ ] 修正模式：已按原版同步 K 键（删同值、删已废键、补新键）
- [ ] `addon_english.txt` 与 `addon_schinese.txt` 键集合一致，占位符与原版一致
- [ ] 若进抽奖池，已改 lottery TS 列表
