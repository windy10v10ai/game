# 交给 agent 自动做的 issue

`issue-spec`（用户在场时拍板）与 `issue-autorun`（用户不在时自动做）之间的约定。`issue-autorun` 只认这里定义的标签和执行说明，不读对话。

## 标签

| 标签 | 谁打 | 含义 |
|---|---|---|
| `agent-todo` | `issue-spec`，用户确认后 | 执行说明已拍板，等 agent 自动做 |
| `agent-done` | `issue-autorun` | 已开草稿 PR，等用户审；PR 里的「等你处理」列出跳过和按默认做的地方 |
| `agent-block` | `issue-autorun` | 整条 issue 一点都做不了，原因写在 issue 留言里 |

一个 issue 同时只带其中一个。用户处理完 `agent-block` 的留言、补好执行说明后换回 `agent-todo`。

## 执行说明

写在 issue 正文末尾，标题固定为 `## 执行说明`，agent 只按这一段干活。每一项都要写到不用再问的程度：

```markdown
## 执行说明

- **目标**：做完后玩家或开发者能观察到的结果，可拆成几条，各条尽量互不依赖
- **做法**：已拍板的实现方案，含选型（如「用 KV Properties，不新增 Lua modifier」）
- **改动范围**：允许改的文件或目录，逐条列出
- **不做**：明确排除的相关改动
- **验收**：必须通过的命令（默认 `npm test`、`npm run lint`、`npm run build:vscripts`；改 Panorama 加 `npm run build:panorama`），以及要补的 jest 用例
- **实机验证**：需要 / 不需要；需要时写清验证什么，agent 只写进 PR Checklist
- **Release Note**：不写 / 要写（附一句中文要点）
```

目标拆成几条互不依赖的小项，agent 卡在其中一条时才能跳过它继续做别的。

## 适合交给 agent 的 issue

适合：本地化、KV 数值、文档、有 jest 兜底的 bot 规则与模块逻辑、方案已定的小功能。

不交：要排查或评估的（卡顿、设计评估）、改动范围列不出来的、只能靠实机才能判断对错且没有 jest 可写的。
