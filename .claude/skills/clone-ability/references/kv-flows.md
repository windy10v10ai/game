# KV 处理流程

基础 KV 是 SKILL.md 第 3 步合并出的「原版 + override」。按第 4 步选定的流程处理。

## 流程 A — 先天技能（原版 Innate "1"）

1. 以合并结果为基础，使用新 key（如 `xxx2`）写入目标文件。
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

## 流程 B — 普通技能（原版 Innate "0" 或无）

1. 以合并结果为基础，使用新 key 写入目标文件。
2. `"BaseClass"` → 填原版技能名。
3. `"Innate"` → 无需写（普通技能默认即为 0）。
4. `"AbilityBehavior"` → 按需保留原版行为；若用于抽奖且为主动技能，确认无需调整 behavior。
   - **若结果含 `UNIT_TARGET`**：同流程 A 第 4 步，必须显式写入目标队伍/类型/射程等施法属性。
   - **若原版含 `IsGrantedByShard "1"` 或 `HasShardUpgrade "1"`**：同流程 A 第 4 步，自定义块须覆盖为 `"0"`。
5. `"AbilityValues"` → 同流程 A 第 5 步。
6. `"AbilityTextureName"` → 必填。
7. 同流程 A 第 7 步。

## 流程 C — 原版先天技能直接入池（去 HIDDEN override）

适用条件：原版技能含 `DOTA_ABILITY_BEHAVIOR_HIDDEN`，去掉该标志后即可正常显示与生效，无需改数值或行为。

1. 在 `game/scripts/npc/npc_abilities_override.txt` 中为原版技能名添加（或更新）一个块，写入以下两个键：
   - `AbilityBehavior`：去掉 `DOTA_ABILITY_BEHAVIOR_HIDDEN`，其余 behavior 标志原封不动保留。
   - `IsOnCastBar "1"`：确保技能显示在施法栏上。
2. **不**在 `npc_abilities_custom_lottery.txt` 中新建任何 KV 块。
3. **不**在本地化文件中新增任何条目（原版本地化已覆盖）。
4. 在 `lottery-abilities.ts` 中以**原版技能名**直接加入对应 tier 的 `// 被动技能` 区域（非「自定义技能」区域）。
