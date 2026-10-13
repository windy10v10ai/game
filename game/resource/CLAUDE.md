# game/resource/ 本地化与图标资源

`addon_schinese.txt`（简中）、`addon_english.txt`（英）、`addon_russian.txt`（俄）。改完不用重启 Dota Tools，运行中的游戏直接显示新文案。

写自定义文案前 grep 原版说明文本对齐官方术语（路径见 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」），英雄名、物品名、效果名以本项目本地化文件为准。

## 文案规约

- **三语同步**：每个键在三个文件里同时增删改，key 顺序、所在模块、分组空行、注释、HTML 标签与换行、占位符完全一致
- **所有键都要三语**，不分 UI 与技能/物品。缺俄文的存量逐步补：改到某个技能/物品/UI 模块时，把该条目的全部键（含 modifier、同系列条目）的俄文一并补上；已有俄文跟随中英同步更新
- **玩家 BUFF（新手保护、普通会员、高级会员）要翻译**，与定制称号分组区分。**定制称号**免译文：俄文可复制中文，已有英文保留；key、分组、注释、空行、标签、占位符仍三语一致
- 两个 tab 缩进，键值多 tab 对齐；注释用中文，三语文件里同一句
- 句间用逗号或句号（不用分号）；中文并列用逗号（不用顿号）；中文用全角标点
- 译文意思准确即可，不必逐字对应
- 只写影响玩家决策的边界（如「基础属性最低保留 1 点」），向下取整、保底值、换算精度这类实现细节留在代码里
- 字面 `%` 写成 `%%`（如 `%active_reflection_pct%%%`），modifier 描述也一样
- 一个 `AbilityValues` 数值在 `_Description` 里内联 `%xxx%` 和单独成行 `_xxx` 二选一
- 模块排列：Custom Abilities（自定义技能）→ Awaken Abilities（觉醒技能）→ Heroes Override（原版英雄技能）

对齐示例、标签换行、术语着色表、措辞、modifier 说明与动态数值 → `.claude/references/localization-format.md`。写技能/物品描述或 modifier 说明时先读。

## 图标 png

技能图标放 `flash3/images/spellicons/<name>.png`；物品图标放 `flash3/images/items/<name>.png`，还要同步 content 副本并登记 xml。完整步骤走 `add-image` skill。
