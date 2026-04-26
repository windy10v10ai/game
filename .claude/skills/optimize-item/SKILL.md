---
name: optimize-item
description: 优化 Dota 2 自定义物品性能，将 Lua 实现迁移到 DataDriven（遵循 item-optimization Meta Prompt 指南）。
disable-model-invocation: true
---

# Optimize Item

按照本技能内置的 Meta Prompt 参考资料，优化指定物品的性能：将可静态化的属性从 Lua 迁移到 DataDriven，保留必要的动态逻辑在 Lua。

## 参考资料（必须遵循）

- `references/item-optimization-meta-prompt.md`
- `references/optimize-lua-item-legacy-notes.md`

## 使用时机

- 物品 Lua 实现包含大量静态属性，导致频繁读取/计算、产生卡顿风险
- 想把物品从 `item_lua` 迁移到 `item_datadriven`，减少 Lua 代码量

## 输入

- 物品名称：`{item_name}`
  - 如果用户没有提供，先询问用户要优化哪个物品

## 执行步骤

严格按照 `references/item-optimization-meta-prompt.md` 的步骤执行：

1. **分析现有实现**
   - 读取 `game/scripts/vscripts/items/item_{item_name}.lua`
   - 读取 `game/scripts/npc/npc_items_custom.txt` 中该物品定义
2. **识别可优化内容**
   - 仅优化 Meta Prompt 文档列出的可迁移属性
   - 识别必须保留在 Lua 中的特殊逻辑（例如 `ABSORB_SPELL` 等）
3. **生成优化代码**
   - 修改 `npc_items_custom.txt` 中的物品定义（迁移到 DataDriven 属性/Modifier）
   - 重写 Lua 文件（尽量精简，仅保留必要逻辑）
4. **验证功能完整性**
   - 确保功能与优化前一致
   - 核对特效、音效、属性值与边界情况

## 注意事项

- ✅ 只优化 Meta Prompt 列表中的属性
- ❌ 不要把必须用 Lua 的功能迁移到 DataDriven
- ✅ 保持代码简洁，不保留无意义注释

## 输出

1. 修改后的 `npc_items_custom.txt` 关键片段
2. 重写后的 Lua 文件（完整）
3. 优化说明与注意事项

