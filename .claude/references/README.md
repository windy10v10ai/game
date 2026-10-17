# 共享参考

根 `.claude/CLAUDE.md`、各层 `CLAUDE.md` 与多个 skill 共用的细则。本目录没有 `SKILL.md`，不占每轮 context，只在被指到时才读。

| 文件                       | 内容                                              | 被谁指向                                                 |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| `git-workflow.md`          | 切分支前检查、小改动搭车、合并清理、worktree      | 根 CLAUDE.md「Git」                                      |
| `doc-writing.md`           | 模块 README、设计 spec、issue 的写法              | 根 CLAUDE.md「文档分工」、`doc-update`                   |
| `localization-format.md`   | 本地化对齐、标签、术语着色、modifier 说明         | `game/resource/CLAUDE.md`、`awaken-ability`              |
| `bot-cast-conditions.md`   | AbilitySpec / ItemSpec 的条件字段                 | `bot-ability-usage`、`bot-item-usage`                    |
| `vanilla-modifiers.md`     | 可复用的原版 modifier 清单与表外查名方法          | `custom-item`、`custom-ability`、`awaken-ability`        |
| `datadriven-properties.md` | 哪些 `MODIFIER_PROPERTY_*` 能写进 KV `Properties` | `custom-item`；玩家属性 `src/vscripts/modules/property/` |

放进来的标准：两处以上会读、又不必每轮常驻。单个 skill 专用的放该 skill 的 `references/`；不在场就会写错代码的硬约束放对应层的 `CLAUDE.md`。新增文件时在上表登记，并在每个引用处写明何时去读。
