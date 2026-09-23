---
name: update-items-override
description: Dota 版本更新后按官方补丁日志同步物品：原版物品差分、克隆上位物品数值、材料改价后的配方费联动。
disable-model-invocation: true
---

# Update Items Override

按官方补丁日志同步物品改动。一件原版物品的改动会波及三处，每批都要逐处过完：

| 波及处 | 文件 | 规则 |
|---|---|---|
| 原版物品本身 | `npc_items_override.txt`、`npc_items_override_neutral*.txt` | 与技能相同的差分规则 |
| 克隆上位物品（`BaseClass` = 该原版物品） | `npc_items_clone.txt` 等 | 按行尾注释规则用新原版值重算 |
| 用到改价材料的配方 | 全部 `npc_items_*.txt` 的 `item_recipe_*` | 配方费抵消价差，上位物品总价不变 |

差分、注释、`延伸` 标记等规则一律沿用 `update-abilities-override` 的 P1–P3，本文件只写物品特有的部分。参考文件为 `docs/reference/<version>/items.txt` 与 `neutral_items.txt`（`<version>` 取法见 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」）。用 `grep` / 片段读取定位，不整份读入物品文件。

## 每批流程

1. **核对**：交给 `model: "sonnet"` 的后台 subagent 对比上一版与新版 `items.txt`，返回：
   - 每条日志对应的物品系统名、KV 键、新旧值
   - **全部** `ItemCost` 变化（物品与 `item_recipe_*`，含因材料涨价而被动变价的原版上位物品），列出价差
   - 日志没提到的其它数值差异

   主会话自己读本图物品文件，subagent 不判定改法。

2. **原版物品**：本图没写该键 → 自动生效；写了 → 按 P1–P3 给新值。

3. **克隆物品**：对每件改动物品，`grep` 出 `"BaseClass"\s+"<item>"` 的全部上位物品：
   - 行尾注释带原版值与规则（`// 175`、`// 15 x2`）→ 用新原版值按同一倍率重算，注释基数同步为新值
   - 注释无法推出倍率，或值与旧原版值相同且无注释 → 用 `AskUserQuestion` 逐项问
   - 自制物品（`npc_items_custom.txt` 等）整块没有原版值注释 → 视为独立设计，不改，在核对表里列出即可

   克隆块不继承原版 `AbilityValues`，原版改了而克隆块写死的键不会自动跟随，必须逐键过完。

4. **配方价格联动**：
   - 材料的**有效价格** = override 写了 `ItemCost` 就用 override 值，否则用参考值。override 钉死了价格的材料，有效价差为 0，不联动
   - 对每件有效价差 Δ ≠ 0 的材料，`grep` 全部 `npc_items_*.txt` 中 `ItemRequirements` 含该物品的本图配方，把配方的 `ItemCost` 减 Δ，上位物品自身的 `ItemCost` 不动
   - 同一配方含多件改价材料时，Δ 累加
   - 新配方费 ≤ 0 → 用 `AskUserQuestion` 逐项问（上位物品加价 / 配方费置 0 并接受总价变化）
   - 原版上位物品的配方与总价由官方维护，不属于本图配方，不在此步处理

5. **出核对表**：每条日志一行，另起一段列出配方联动（配方名、材料、Δ、旧配方费 → 新配方费、上位物品总价）。用户确认后再改。

6. **改完自检并 commit**：
   - `git diff` 只动了核对表里的行
   - 每个被改的配方：材料有效价格之和 + 配方费 = 上位物品 `ItemCost`。改动前就不相等的（标价写错），出核对表时用 `AskUserQuestion` 逐件问（标价改成实际总价 / 本批不动），不自行反算配方费
   - 每批单独 commit

## 本图配方的写法

上位物品的 `ItemCost` 单独写死总价，与材料价格、配方费之间没有自动关联。材料改价而配方费不动时，逐件合成的实际花费就与标价对不上，所以配方费随材料价差联动，保持上位物品总价不变。
