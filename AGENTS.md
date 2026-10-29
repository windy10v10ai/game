# AGENTS.md

本仓库的项目规范以 `.claude/` 下的文档为唯一真相源，本文件只做入口与对照表。规范有冲突时以 `CLAUDE.md` 为准；改规范时改 `CLAUDE.md` 或对应 `SKILL.md`，再同步本文件的对照表。

## 1. 动手前必读

任何代码修改、issue 处理、review、测试、构建或发布之前，先读 `.claude/CLAUDE.md`（语言与回复风格、注释规约、Git、文档分工、全局陷阱）。

几条最容易漏的：

- 回复用用户的语言；代码、注释、commit 用英文
- 分支从最新 `develop` 切出，PR base 是 `develop`；commit 是单行英文标题
- 注释只写为什么，不复述代码、数值与改动过程
- TypeScript 文件行尾 LF；prettier 只格式化本次改动的文件
- `game/scripts/vscripts/` 下大部分是 `src/vscripts/` 的编译产物，改源码不改产物

## 2. 改哪个目录先读哪份 CLAUDE.md

Claude Code 会在读写这些目录时自动加载对应文件，其他工具需要手动读。改动某目录下的文件前，读该目录及所有上级目录的 `CLAUDE.md`：

| 改动目录 | 要读 |
|---|---|
| `src/` 下任何文件 | `src/CLAUDE.md` |
| `src/vscripts/` | 再加 `src/vscripts/CLAUDE.md` |
| `src/vscripts/ai/` | 再加 `src/vscripts/ai/CLAUDE.md` |
| `src/vscripts/api/` | 再加 `src/vscripts/api/CLAUDE.md` 与同目录 `README.md` |
| `src/panorama/` | 再加 `src/panorama/CLAUDE.md` |
| `src/panorama/react/hud_main/` | 再加 `src/panorama/react/hud_main/CLAUDE.md` |
| `game/scripts/npc/` | `game/scripts/npc/CLAUDE.md` |
| `game/resource/` | `game/resource/CLAUDE.md` |

多个规则共用的细则在 `.claude/references/`（Git 细则、文档写法、本地化格式、Bot 施法条件字段等），由上面的文件按需指向。

## 3. 任务对应的 skill

skill 文件就是操作手册：任务对上时先完整读对应的 `.claude/skills/<name>/SKILL.md`，按步骤执行；正文里指向的 `references/` 文件在对应分支用到时再读。

Claude Code 直接读 `.claude/skills`；Codex 与 DSH 读仓库下的 `.agents/skills`，克隆后跑一次 `npm run skills:link` 建立链接（Windows 为 junction，其他平台为符号链接，链接不进 git）。新增或改动 skill 后跑 `npm run skills:check`，CI 每次 PR 也会校验 frontmatter。

| 任务 | skill |
|---|---|
| 创建分支、commit、push、开 PR | `create-pr` |
| 生成 Steam 更新日志（Release Note） | `release-note` |
| 把纠正与新约定沉淀进文档 | `doc-update` |
| 整理 issue、调整优先级与「开发计划」项目排布 | `issue-triage` |
| 给 issue 定 spec 交给 agent 自动做，处理 agent 留下的问题 | `issue-spec` |
| 按 issue 的执行说明实现一条 issue 并开 PR | `issue-impl` |
| 在 Dota 2 Tools 实机验证 | `dota-live-test` |
| 查 Dota 2 引擎 API、事件 | `dota-docs-lookup` |
| 从零自制技能 | `custom-ability` |
| 克隆原版技能 | `clone-ability` |
| 英雄觉醒技能 | `awaken-ability` |
| 从零自制物品、合成神器 | `custom-item` |
| 克隆原版物品 | `clone-item` |
| 加图标、UI 图片，排查紫块 | `add-image` |
| 原版特效 / 模型在 Tools 不显示，修覆盖原版路径的编译资源 | `fix-asset-override` |
| bot 技能施法规则 | `bot-ability-usage` |
| bot 战斗物品使用规则 | `bot-item-usage` |
| 电脑 AI 决策与移动异常 | `bot-ai-tuning` |
| 电脑英雄技能加点（Bot.Build） | `bot-skill-build` |

下面这些在 Claude Code 里只由用户手动调用（`/<name>`）。用户明确要求做对应的事时再读：

| 任务 | skill |
|---|---|
| 发布到创意工坊 | `deploy` |
| 用户不在时按优先级在主目录依次派执行者做带 `agent-todo` 的 issue | `issue-autorun` |
| 审查 PR | `review-pr` |
| 加载界面 FAQ | `loading-faq` |
| 蝴蝶效应 / 多重施法黑名单 | `ability-blacklist` |
| 英雄天赋 | `custom-talent` |
| 抽奖池 Tier 调整 | `adjust-lottery-tier` |
| bot 出装候选池 | `bot-item-build` |
| 版本更新后同步技能 override | `update-abilities-override` |
| 版本更新后同步物品 | `update-items-override` |
| 导出离线数据快照 | `update-offline-snapshot` |

## 4. Claude 专用写法怎么换

文档按 Claude Code 写成，其他工具这样对应：

- `AskUserQuestion`：在对话里列出选项向用户提问，等回答再继续
- 「调用 xxx skill」：读 `.claude/skills/xxx/SKILL.md` 并照做
- 派 SubAgent 并指定 `model: "haiku"` / `"sonnet"`：用你自己的子任务机制，没有就直接做，模型名忽略
- `CLAUDE.md` 自动加载：按第 2 节手动读
