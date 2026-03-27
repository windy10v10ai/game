# 旧指南补充要点（已提炼）

本文件将 `docs/development/optimize-lua-item.md` 中仍然有用、但在当前 `item-optimization-meta-prompt.md` 参考里**未被完整覆盖**的要点提炼出来，作为 `optimize-item` skill 的补充规则。

## 1) 本项目的“旧式 DataDriven”落点：`npc_items_modifier.txt` / `item_apply_modifiers`

旧方案强调：对**每帧都会算的静态属性**，可以放到：

- `game/scripts/npc/npc_items_modifier.txt` 的 `item_apply_modifiers` → `Modifiers` 中

适用点：

- 你在 Lua 的 `DeclareFunctions()/GetModifier*()` 里只是返回常量，且属性在“可迁移列表”中
- 想把这些每帧 Lua 计算挪到 KV，让引擎原生处理

同时要求：

- Lua 中对应的 `GetModifier*()` 需要删除（不要留注释）
- 如果所有属性都迁移了，`DeclareFunctions()` 可以清空返回 `{}`（或仅保留仍需 Lua 的那部分）

## 2) `RefreshItemDataDrivenModifier` 标准用法（绑定“物品实例”的基础属性）

当基础属性通过 `_stats` DataDriven modifier 应用，并且该 modifier 需要跟随物品实例刷新/移除时，旧指南给出固定模板：

- `OnCreated()` 必须调用 `self:OnRefresh(keys)`
- `OnRefresh()` / `OnDestroy()` 在服务端调用 `RefreshItemDataDrivenModifier(_, ability, self.stats_modifier_name)`
- `self.stats_modifier_name` 约定为 `modifier_item_<item>_stats`

关键约束：

- `OnCreated` 中**只读取 Lua 逻辑真正需要的值**；仅用于 tooltip 显示的值不要读
- 移除旧的 `SetSecondaryCharges` 充能展示逻辑（在这里不需要）

## 3) 三类常见场景的推荐实现（旧指南更明确）

### A. 永久物品基础属性（绑定物品实例）

- 推荐：`RefreshItemDataDrivenModifier` + `_stats` modifier
- 适合：拿着物品时生效的常驻基础属性（力量/护甲/移速等）

### B. 永久 BUFF（不绑定物品实例，例如“消耗后永久获得”）

- 推荐：直接在 `npc_items_modifier.txt` 定义完整 DataDriven modifier（无需 Lua modifier 类）
- 使用：`ApplyItemDataDrivenModifier(_, caster, target, "modifier_xxx", {})`

区别点（旧指南的对比表核心意思）：

- 不绑定物品的永久 BUFF：可以完全 KV 化，性能最好、Lua 代码更少

### C. 临时 Buff / Debuff（有持续时间）

旧指南强调：临时效果更适合**直接定义完整的 DataDriven modifier**（而不是 `_stats` 辅助 modifier）：

- KV：`modifier_item_xxx_debuff` 直接写 `Properties`（静态部分）+（需要时）`ThinkInterval` + `OnIntervalThink` 的 `RunScript`
- Lua：用 `ApplyItemDataDrivenModifier`（或其他方式）给目标加上该 modifier，并传入 `duration`

## 4) 不适合迁移到 DataDriven 的典型情况（旧指南列表更直观）

满足任意一条就不要“静态迁移”：

- 属性不在“允许迁移列表”中（即使是常量）
- 需要动态计算（生命百分比、层数、条件判断等）
- 光环（Aura）/事件驱动（OnTakeDamage 等）/复杂状态管理
- `PROCATTACK_FEEDBACK` 等特殊属性

## 5) 术语约定（帮助做决策）

旧指南最终总结给出一条决策口诀：

- 永久物品属性（绑定物品）→ `RefreshItemDataDrivenModifier` + `_stats`
- 永久 BUFF（不绑定物品）→ `ApplyItemDataDrivenModifier` + 完整 DataDriven modifier
- 临时 debuff/buff → 完整 DataDriven modifier（必要时配合 `RunScript`）
- 复杂逻辑/特殊属性 → 保留 Lua（可由 DataDriven 触发 Lua 回调）

