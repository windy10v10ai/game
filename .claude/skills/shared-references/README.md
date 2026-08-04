# 跨 skill 共享参考

放两个以上 skill 都要查的参考资料。**本目录没有 `SKILL.md`，不会被当成 skill 加载**，因此不占每轮 context——只在被 skill 用相对路径指到时才读。

| 文件 | 内容 | 被谁引用 |
| ---- | ---- | ---- |
| `vanilla-modifiers.md` | 可复用的原版 modifier 清单（通用状态 / 原版物品 / 原版技能三组），含表外查名方法 | `custom-item`、`custom-ability`、`awaken-ability` |

## 什么该放进来

只放**两个以上 skill 都会查**的内容。单个 skill 专用的查表放该 skill 自己的 `references/`。

判据是「不在场会怎样」：

- 不在场就会写出错误代码的硬约束 → `.claude/CLAUDE.md`（每轮必进）
- 做某类任务时的决策与流程 → 对应 skill 的 `SKILL.md`
- 只有部分分支才读的查表 → skill 自己的 `references/`
- 多个 skill 都读的查表 → 本目录

新增文件时在上表登记，并在引用它的每个 skill 里加相对路径指路（`../shared-references/<file>.md`）。
