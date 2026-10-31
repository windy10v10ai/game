# 更新模式：同步原版

以最新 `docs/reference/<version>/items.txt` 为基准。

## KV

1. 读原版物品块的完整字段
2. 删掉原版已不存在的字段
3. 补上原版新增的字段（加强规则同 SKILL.md 第 4 步）
4. 保留克隆专属字段（`ItemAliases`、`AbilitySharedCooldown`、`AbilityTextureName`、`ID` 等）
5. 可成长属性按「原版当前值 × 当前倍率」重算（倍率 = 克隆总价 ÷ 原版价格，无法确定时问用户），固定机制值与原版一致
6. 顶层字段（`AbilityBehavior`、`AbilityCooldown`、`AbilityManaCost`、`FightRecapLevel`、`SpellDispellableType` 等）与原版一致

## 本地化

克隆说明与原版当前版本对齐：

- **Description**：以原版当前 Description 为模板换键名，内容一致（不保留原版已删的占位符）
- **Note\***：原版新增的补上，已删的移除
- **属性行**（`_bonus_xxx`）：与原版当前 `AbilityValues` 键名一致，增删同步
- **名称与 Lore**：保留克隆版自己的
