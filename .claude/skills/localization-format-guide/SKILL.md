---
name: localization-format-guide
description: 本地化文件（addon_schinese/addon_english）格式与同步规范。用于新增/维护本地化键、对齐、注释、HTML 标签与变量占位符一致性检查。
disable-model-invocation: true
---

# Localization Format Guide

本技能用于维护 `game/resource/` 下的本地化 KeyValues 文件，确保**中英文内容与格式完全一致**，并遵循项目对缩进、注释、HTML 标签、颜色代码与变量占位符的规范。

## 使用时机

- 新增/修改 UI、物品、技能、modifier 的本地化键
- 同步中英文本地化文件内容与格式
- 修复对齐、缩进、标签、占位符不一致导致的显示问题

## 参考资料（必须遵循）

- `references/localization-format-guide.md`

## 核心约束（摘要）

- **两个 tab 缩进**，键和值使用多个 tab 对齐
- **注释使用中文**，且**中英文注释完全一致**
- **HTML 标签与换行规则**（`\n` 分段、`<br><br>` 段内换行）中英文必须一致
- **颜色代码必须大写**
- 新增/删除条目必须同时改中文与英文；俄文只维护现有键，不新增

## 执行步骤（建议）

1. 明确要新增/修改的 key 列表与对应文本
2. 同时在 `addon_schinese.txt` 与 `addon_english.txt` 增删相同 key
3. 对齐检查：
   - 缩进、tab 对齐、空行位置一致
   - HTML 标签位置一致（包括 `\n` 与 `<br>`）
   - 占位符（如 `%duration%`、`%dMODIFIER_PROPERTY_XXX%`）一致
4. 若涉及 modifier：补齐 `Name` 与 `Description` 必需条目
5. 中文标点使用全角；数字/英文/HTML/占位符保持原样

