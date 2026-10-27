# issue 交接给无人值守 agent

`issue-triage`（用户在场时拍板）与 `issue-execute`（无人值守时执行）之间的交接约定。执行端只认这里定义的标签和执行说明，不读对话、不猜意图。

## 标签

| 标签 | 谁打 | 含义 |
|---|---|---|
| `agent-ready` | `issue-triage`，用户确认后 | 执行说明已拍板，可以领 |
| `agent-done` | `issue-execute` | 已开草稿 PR，等用户审 |
| `agent-blocked` | `issue-execute` | 执行不下去，原因写在 issue 留言里，等用户补说明 |

一个 issue 同时只带其中一个。用户补完说明后把 `agent-blocked` 换回 `agent-ready`。

## 执行说明

写在 issue 正文末尾，标题固定为 `## 执行说明`，执行端只按这一段干活。每一项都要写到不用再问的程度：

```markdown
## 执行说明

- **目标**：做完后玩家或开发者能观察到的结果，一两句
- **做法**：已拍板的实现方案，含选型（如「用 KV Properties，不新增 Lua modifier」）
- **改动范围**：允许改的文件或目录，逐条列出；PR 里出现范围外的文件即视为失败
- **不做**：明确排除的相关改动
- **验收**：必须通过的命令（默认 `npm test`、`npm run lint`、`npm run build:vscripts`；改 Panorama 加 `npm run build:panorama`），以及要补的 jest 用例
- **实机验证**：需要 / 不需要；需要时写清验证什么，执行端只写进 PR Checklist
- **Release Note**：不写 / 要写（附一句中文要点）
```

## 适合交接的 issue

适合：本地化、KV 数值、文档、有 jest 兜底的 bot 规则与模块逻辑、方案已定的小功能。

不交接：要排查或评估的（卡顿、设计评估）、改动范围列不出来的、只能靠实机才能判断对错且没有 jest 可写的。
