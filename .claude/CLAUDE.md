# CLAUDE.md

Windy10v10AI：PVE Dota 2 自定义游戏，10v10 对战、AI 对手、技能抽奖。游戏逻辑 VScripts 用 TypeScript 经 TSTL 编译为 Lua，UI 用 Panorama（React 16.14 + TypeScript，Webpack 构建），两层经 Custom Net Tables 与 Custom Game Events 通信。

## 语言与回复风格

用户用什么语言提问就用什么语言回复。代码、代码注释、提交信息、技术标识符用英文。

写给用户看的内容（对话回复、review 报告、总结与说明文档）：

- **先说结论，再展开**，重点放第一句
- **短**：短词、短句、短段落，用标题或列表分层；砍掉不重要的细节和客套铺垫
- **说人话**：常见技术词（缓存、接口、轮询）可以用，生僻词和行话换成白话
- **少提代码名字**：先用中文说清它干什么，代码名只作补充；路径和命令照写
- **给出行动**：告诉用户下一步该做什么
- **先交代背景**：下结论前说清这是什么、发生在什么情况下
- **解释改动按固定顺序**：原来是什么 → 改成什么 → 代码要做的事 → 问题在哪 → 用户要做什么

代码注释、提交信息、本地化文案各按自己的规约。CLAUDE.md / SKILL.md 这类规则文档首要读者是模型，准确优先于通俗，字段名、API 名、路径写全。

## 常用命令

| 命令 | 用途 |
|---|---|
| `npm run start` | 启动 Dota 2 Tools 与 watch 编译 |
| `npm test` / `npm run lint` | jest / eslint（含图片与本地化检查） |
| `npm run prettier-check` | 格式检查（不含 Markdown），CI 会跑；第三方文件在 `.prettierignore` |
| `npm run build:vscripts` / `build:panorama` | 提交前查编译错误 |

## 目录导航

读写某目录下的文件时，该目录及上级目录的 `CLAUDE.md` 会自动加载：

| 目录 | 内容 |
|---|---|
| `src/` | 跨层契约：共享类型、Net Table / Custom Event |
| `src/vscripts/` | 游戏逻辑、模块单例、jest 测试、TSTL 陷阱 |
| `src/vscripts/ai/` | Bot AI 结构与陷阱 |
| `src/vscripts/api/` | 后端 API 调用与重试 |
| `src/panorama/` | React UI、两类 entry、Panorama 陷阱 |
| `src/panorama/react/hud_main/` | 中心化界面的页面拆分约定 |
| `game/scripts/npc/` | NPC KV：`#base` 结构、ID 号段、格式、查原版技能 |
| `game/resource/` | 中英俄本地化规约、图标 png |
| `game/scripts/vscripts/` | TSTL 编译产物（自动生成，改 `src/vscripts/`）+ 少量遗留纯 Lua |
| `docs/reference/<version>/` | Dota 2 原版 KV 与说明文本快照 |
| `.claude/references/` | 根规则与多个 skill 共用的细则 |

**全局陷阱**：

- TypeScript 文件行尾用 LF
- prettier 只格式化本次改动的文件：仓库里有一批文件从没按 `.prettierrc` 格式化过，通配符 `prettier --write` 会混进几百行无关 diff。误跑后的还原方法见 `.claude/references/git-workflow.md`
- 检索代码默认跳过 `docs/reference/tenvten-*`（项目自身的历史快照，会混进过时匹配），用户要看或做版本对比时才查

**相关仓库**：官网（`web/`）与后端 API（`api/`）在本机 `../firebase`，用户已授权直接修改，动手前先读该仓库自己的 CLAUDE.md / AGENTS.md。

## Implementation Style

改动保持最小，用最简单的机制实现（DRY、KISS、YAGNI）：

- 复用一个字符串事件，而不是新增自定义事件
- 按需求还原到够用为止，不过度分析
- 布尔方法名用常见直接的动词，不重复所属类或文件已表达的语境：`CanCast` 优于 `IsEligible`、`CanUseGenericFallback`
- 多处需要同一逻辑（尤其要求口径一致的计算）时提取共享函数，避免只改一处产生口径分歧

## 注释规约

注释只写**为什么这样做**。能从代码读出来的不写：数值、字段名、行为会随代码演进，注释里的副本不会跟着更新，一旦不一致读者分不清谁是真相源。

写：

- 选择某个数值/方案的**原因**（「1 级伤害太低、蓝耗占比高，2 级起才用」）
- 与默认/约定不一致的**特殊处理**（「AoE 半径远大于 cast range，需要 castMode 投影到边缘」）
- 一两句点出技能中文名或设计目的。配置表只标英雄名或技能系统名（如 `// 齐天大圣 觉醒`），效果与数值归本地化文案
- 公开方法先用一句话说**功能**，不点名文件/函数/API 端点；不明显的边界情况写在对应代码行上方

整个文件一个 `/** 一两行 */` JSDoc。

注释陈述现在的设计事实，一句概括性意图即可。下面几类是在叙述过程，整句删掉而不是改写：

- 讨论中的具体场景、边界 case、取舍过程、例子（具体语言、单词、数值、变量名）
- 过去与现在的对比（「A 曾经是 X，现在改成 Y」），换了措辞也一样
- 来源说明（「移植自 xxx.lua」）、单行字段含义复述、KV 能查到的事实
- 「为什么某项被排除/没实现」的逐项列举（属于 PR 描述）

写完自查是否出现 **旧 / 原版 / Lua / 沿用 / 这里 / 本次 / 此次 / 额外 / 改为**，出现就重写或删除。

## Git

- 手上有未合并的 PR 时，文档、skill、注释这类小改动直接并进该 PR，不另切分支，判定见 `.claude/references/git-workflow.md`「小改动搭车」
- 其余改动的分支从最新 `develop` 切出，确定要写文件（包括 skill 产出的设计文档）前先切好。issue 驱动命名 `feature/<issue-id>-<3–6 个英文小写单词>`（如 `feature/2411-web-link-refresh`），其他用 `fix/` `chore/` `docs/` 前缀
- 切分支前的检查、worktree、小改动搭车、合并与清理 → `.claude/references/git-workflow.md`
- issue 标题与 PR 正文用中文，PR 标题与 commit 用英文。commit 是 ≤72 字符的单行标题，正文只写 `Co-Authored-By`
- PR base 固定 `develop`。PR 完成 issue 全部范围才写 `Fixes #<id>`，否则只写 `#<id>`
- 只 stage 本次请求相关的文件，commit 前看 `git status`；当前分支不符合预期（如处于 `develop`/`main`）先请用户确认
- 合并只在用户给出指令时执行
- 开 PR 走 `create-pr` skill：纯内部改动（重构、构建、CI、文档、测试）自行跳过 Release Note，其余算出目标版本后问用户写不写，要写时调用 `release-note` 生成

## 文档分工

用户纠正做法、发现文档与代码矛盾、或补充了新约定时，调用 `doc-update` skill 沉淀，作为完成改动的一部分。去处按作用范围就近选：

| 内容 | 去处 |
|---|---|
| 只在某一层成立的规则 | 该层的 `CLAUDE.md` |
| 某个模块的结构与用户拍板的决定 | 该模块的 `README.md` |
| 某类任务的流程与决策 | 对应 `SKILL.md`；只有部分分支用到的放该 skill 的 `references/` |
| 根规则或多个 skill 共用的细则 | `.claude/references/` |
| 真正跨全项目、每次都要用的规则 | 本文件 |
| 设计过程稿 | 本地 `docs/superpowers/specs/`（已 gitignore） |
| 进度、验证结论 | issue / PR |

README 还是 `CLAUDE.md`：违反它是「这次改动做错了」进 `CLAUDE.md`，是「系统的结构变了」进 README。写 README、spec、issue 的细则见 `.claude/references/doc-writing.md`。

新增、删除或改名 skill 与 `CLAUDE.md` 时，同步根 `AGENTS.md` 的对照表（Codex 不会自动加载子目录 `CLAUDE.md`，也不认 Claude 的 skill 机制）。

## 节约用量

下表的活派 SubAgent（Agent 工具，用 `model` 参数指定），主对话只收结论。SubAgent 不继承上下文，提示里写全命令、判定标准和要带回的数字。

| 活 | `model` |
|---|---|
| 输出长或要等的命令：完整 `npm test`、对局、日志统计 | `"haiku"` |
| 方案已定、跨 3 个以上文件的照方案改动 | `"sonnet"` |
| 读日志判断现象，或 haiku 反复卡住 | `"sonnet"` |

留在主对话：设计取舍、单文件小改、需要用户确认的步骤、几行输出就结束的命令（派 SubAgent 的冷启动成本更高）。

## Skill 交互

执行 skill 遇到不明确的决策点（目标文件多个候选、新建还是修正、原版技能信息有多个候选），用 `AskUserQuestion` 以选项菜单询问，每道问题单独一次调用，选项附简短说明。

用户明确要求「不要停、自主做到最后」时，skill 自带的确认停顿点一律跳过，已有设计文档当作已拍板。不阻塞主线的待判断问题记下来写进 draft PR 的 Checklist；方案自相矛盾、无法安全判断时才停下。
