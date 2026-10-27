# 交给 agent 自动做的 issue

`issue-organize`、`issue-spec`（用户在场时拍板）与 `issue-autorun`（用户不在时自动做）之间的约定。`issue-autorun` 只认这里定义的标签、执行说明和它指向的设计文档，不读对话。

## 标签

| 标签 | 谁打 | 含义 |
|---|---|---|
| `agent-todo` | `issue-spec`，用户确认后 | spec 已拍板，等 agent 自动做 |
| `agent-done` | `issue-autorun` | 已开草稿 PR，等用户审；PR 里的「等你处理」列出跳过和按默认做的地方 |
| `agent-block` | `issue-autorun` | 整条 issue 一点都做不了，原因写在 issue 留言里 |

一个 issue 同时只带其中一个。用户处理完 `agent-block` 的留言、补好执行说明后换回 `agent-todo`。

## 执行说明

写在 issue 正文末尾，标题固定为 `## 执行说明`，agent 只按这一段（及它指向的设计文档）干活。每一项都要写到不用再问的程度：

```markdown
## 执行说明

- **目标**：做完后玩家或开发者能观察到的结果，可拆成几条，各条尽量互不依赖
- **做法**：已拍板的实现方案，含选型（如「用 KV Properties，不新增 Lua modifier」）
- **改动范围**：允许改的文件或目录，逐条列出
- **不做**：明确排除的相关改动
- **验收**：必须通过的命令（默认 `npm test`、`npm run lint`、`npm run build:vscripts`；改 Panorama 加 `npm run build:panorama`），以及要补的 jest 用例
- **实机验证**：需要 / 不需要；需要时写清验证什么（按 `dota-live-test` 的哪种方式、看哪几行日志）
- **Release Note**：不写 / 要写（附一句中文要点）
```

目标拆成几条互不依赖的小项，agent 卡在其中一条时才能跳过它继续做别的。

执行者是 DSH 里的 DeepSeek（见 `issue-autorun`），按「照做不走样」的标准写：

- **做法**给出要照抄的已有实现：提交号或同类条目名（如「照 `sniper_keen_scope2` 的写法克隆」）
- 档位、数值、等级这类平衡性取舍在执行说明里定死，不留给 agent 类比；定不下来的写明「agent 暂定，记为待你决定」
- **实机验证**逐项写到可判定：装到哪类英雄、做什么操作、哪个数值应该怎么变，而不是「能生效」

### 复杂 issue：指向设计文档

上面几项写不进一屏、要讲数据流或跨多层改动时，写设计文档，issue 里只留指针：

```markdown
## 执行说明

- **设计文档**：`docs/superpowers/specs/<YYYY-MM-DD>-<主题>-design.md`
```

设计文档按 `.claude/references/doc-writing.md`「设计 spec」写，并且包含上面执行说明的全部七项。`docs/superpowers/` 已 gitignore，只存在于主目录：`issue-autorun` 只能在这台电脑上跑，worktree 里的子代理要用主目录的绝对路径去读。

## 适合交给 agent 的 issue

适合：本地化、KV 数值、文档、有 jest 兜底的 bot 规则与模块逻辑、方案已定的小功能；靠实机才能判断对错的，执行说明里写清实机验证步骤也可以交。

不交：要排查或评估的（卡顿、设计评估）、改动范围列不出来的。
