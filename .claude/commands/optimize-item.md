---
description: 优化 Dota 2 自定义物品性能，将 Lua 实现迁移到 DataDriven
---

# 物品性能优化命令

请按照 `docs/development/item-optimization-meta-prompt.md` 中的 **Meta Prompt** 完整指南优化指定的物品。

## 任务

请用户指定要优化的物品名称（如果没有提供）。

物品名称：{item_name}

## 执行步骤

严格按照 meta prompt 文档中的步骤执行：

1. **分析现有实现**
   - 读取 `game/scripts/vscripts/items/item_{item_name}.lua`
   - 读取 `game/scripts/npc/npc_items_custom.txt` 中的物品定义

2. **识别可优化内容**
   - 检查哪些属性在可优化列表中
   - 识别必须保留在 Lua 中的特殊逻辑

3. **生成优化代码**
   - 修改 `npc_items_custom.txt` 中的物品定义
   - 重写 Lua 文件

4. **验证功能完整性**
   - 确保所有功能与优化前一致
   - 检查特效、音效、属性值

## 注意事项

- ✅ 只优化 meta prompt 中列表里的属性
- ❌ 不要优化 ABSORB_SPELL 等必须用 Lua 的功能
- ✅ 保持代码简洁，不保留注释
- ✅ 测试所有功能

## 输出

1. 修改后的 `npc_items_custom.txt` 代码片段
2. 重写后的完整 Lua 文件
3. 优化说明和注意事项
