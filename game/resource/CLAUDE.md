# game/resource/ 本地化与图标资源

## 本地化文件

| 文件 | 用途 |
|---|---|
| `addon_schinese.txt` | 简体中文 |
| `addon_english.txt` | 英文 |
| `addon_russian.txt` | 俄文 |

原版技能说明参考 `docs/reference/<version>/abilities_schinese.txt` 与 `abilities_english.txt`（`<version>` 取最新数字版本目录），编写自定义文案时对齐官方术语。

## 文案规约

改这三个文件时**必须**遵守：

- 中英文**同时**增删，内容与格式完全一致
- 两个 tab 缩进，键值多 tab 对齐；颜色代码**大写**
- 注释用**中文**且中英一致；HTML 标签与换行（`\n` 分段、`<br><br>` 段内换行）中英一致
- **文案不用分号**（`；`/`;`），句间用逗号或句号
- **中文文案不用顿号**（`、`），并列关系一律用逗号
- `_Description` **不同时既内联又单独成行同一个数值**：一个 `AbilityValues` 数值只能选其一 —— 该数值只在 Description/Note 中以 `%xxx%` 出现一次（不单独定义 `_xxx` 标签行），或者只作为 `_xxx` 单独成行展示（Description 不再重复 `%xxx%`）。多个关联数值（如同一机制下的若干档位/字段）建议各自单独成行；孤立的单个数值两种方式均可，按可读性选择，但不要两处都写
- **不写内部实现细节**：向下取整、保底值、内部换算精度这类只影响代码怎么算的细节不进文案。只有会影响玩家决策的边界才写（如「基础属性最低保留 1 点」）
- **UI 键**（按钮/标签/提示等 Panorama 文本）**必须**同步俄文；技能/物品/游戏逻辑类键在**本次新增或修改该键时一并写俄文**，存量中原本没有俄文的旧键不必特意补齐；已有的俄文一律保留并跟随中英同步更新，不得单方面删除

**模块排列顺序**：Custom Abilities（自定义技能）→ Awaken Abilities（觉醒技能）→ Heroes Override（原版英雄技能）。

> 完整规则、对齐示例见 `localization-format-guide` skill。

## 图标 png

技能图标放 `flash3/images/spellicons/<name>.png`，物品图标放 `flash3/images/items/<name>.png` 且必须同步 content 副本并登记 xml。完整步骤走 `add-image` skill。
