# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作时的指导。

## 语言偏好

**重要提示:所有响应默认应使用中文(简体中文)**,除非:

- 用户明确要求使用英文回复
- 你正在编写代码、代码注释或提交信息(这些应保持英文)
- 你正在引用技术术语、API 名称或函数名称(这些应保持原始英文形式)

与用户沟通时:

- 使用中文进行解释、总结和一般性交流
- 使用英文编写代码片段、变量名、函数名和技术标识符
- 在讨论代码时可以混合使用中文和英文(解释用中文,代码引用用英文)

## 回复风格

读者每天处理大量事务、精力有限。回复必须做到：

- **先说结论，再展开**。重点放第一句，细节往后放
- **短**。短词、短句、短段落，段落之间用标题或列表分层
- **说人话**。不用生僻词和行话，常见技术词（缓存、接口、轮询）可以用
- **少提代码名字**。函数名、变量名先用中文说清它是干什么的，代码名只作为补充。路径和命令除外
- **给出行动**。告诉用户下一步该做什么，不要只罗列现象
- **砍掉不重要的细节**，不写客套和铺垫
- **短不等于省略背景**。下结论前先交代清楚这是什么、发生在什么情况下。宁可多写一段背景，也不要让读者看不懂结论从哪来
- **解释改动按固定顺序展开**：原来是什么 → 改成什么 → 代码要做的事 → 问题在哪 → 用户要做什么。跳过第一步读者就接不上

这条规则约束的是**写给用户看的内容**：对话回复、review 报告、总结与说明文档。

以下各有自己的规约，冲突时以各自规约为准：

- 代码注释（见「注释规约」）、提交信息（英文单行标题）、本地化文案（见 `game/resource/CLAUDE.md`）
- CLAUDE.md / SKILL.md 这类规则文档：首要读者是模型，**准确优先于通俗**，该写全的字段名、API 名、路径要写全，不为了好懂而模糊化

## 项目概述

Windy10v10AI 是一个 PVE Dota 2 自定义游戏,具有 10v10 对战、AI 对手和独特的技能抽奖系统。代码库使用 TypeScript 编译为 Lua 作为游戏逻辑(VScripts),使用 React + TypeScript 作为 UI(Panorama)。

- **VScripts (后端)**: TypeScript → Lua,通过 TypeScript-to-Lua (TSTL) 编译
- **Panorama UI (前端)**: React 16.14 + TypeScript → JavaScript,通过 Webpack 构建
- **通信机制**: Custom Net Tables (双向同步) 和 Custom Game Events (客户端→服务器)
- **共享类型**: `src/common/` 中的 TypeScript 接口定义了各层之间的契约

## 开发命令

### 安装与设置

```bash
# Install dependencies and link game/content directories to Dota 2 addon folder
npm install

# Note: Code must be on the same hard drive partition as Dota 2
```

### 开发工作流

```bash
# Start Dota 2 Tools and watch mode (most common command)
npm run start
```

### 测试与质量检查

```bash
# Run Jest tests
npm test

# Lint TypeScript files
npm run lint
npm run lint:fix

# Build checks (run before committing to catch compile errors)
npm run build:panorama   # Webpack build for Panorama UI
npm run build:vscripts   # TSTL build for VScripts (TypeScript → Lua)
```

## 目录导航

各层的详细规约写在**该层目录下的 `CLAUDE.md`**，读写那些目录下的文件时会自动加载，不必手动去读：

| 目录 | 内容 | 细则 |
|---|---|---|
| `src/` | 跨层契约：共享类型、Net Table / Custom Event 数据流 | `src/CLAUDE.md` |
| `src/vscripts/` | 游戏逻辑、模块单例、AI、API 调用、jest 测试、TSTL 陷阱 | `src/vscripts/CLAUDE.md` |
| `src/panorama/` | React UI、两类 entry、hud_main 页面拆分、less 陷阱 | `src/panorama/CLAUDE.md` |
| `game/scripts/npc/` | 所有 NPC KV（技能/物品/单位/英雄）、`#base` 结构、ID 号段、格式 | `game/scripts/npc/CLAUDE.md` |
| `game/resource/` | 中英俄本地化文案规约、图标 png 位置 | `game/resource/CLAUDE.md` |
| `game/scripts/vscripts/` | TSTL 编译产物（自动生成，不要手改）+ 少量遗留纯 Lua | — |
| `docs/reference/<version>/` | Dota 2 原版 KV 与说明文本快照 | — |

模块级的设计与决策放该模块目录下的 `README.md`（如 `src/vscripts/api/README.md` 讲客户端 HTTP 代发、`src/vscripts/ai/build-item/README.md` 讲出装）。

**唯一的全局陷阱**：TypeScript 文件行尾符用 LF (Unix) 而不是 CRLF (Windows)。

## 查原版技能

用户给出**技能系统名**（如 `dragon_knight_dragon_blood`）时直接使用。`<version>` 取 `docs/reference/` 下最新数字版本目录。

给出**中文名**（如「龙血」）或**英雄名-技能名**（如「幻影刺客-幻影之矛」）时，在 `abilities_schinese.txt` 中搜中文名，从匹配行的 key 提取系统名（`DOTA_Tooltip_ability_{系统名}`）。多个候选用 `AskUserQuestion` 让用户确认。

给出**英雄名**时，在 `npc_heroes.txt` 中用中/英文关键词搜英雄 ID，再从 `heroes/npc_dota_hero_<hero>.txt` 读技能槽位。

编写自定义技能/物品说明时参考官方文本以保持术语一致：

```bash
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_schinese.txt
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_english.txt
```

## Implementation Style

代码改动保持最小化，优先用最简单的机制实现，遵循 DRY（不重复自己）、KISS（保持简单）、YAGNI（不做用不上的设计）：

- 复用一个字符串事件，而不是新增自定义事件
- 避免过度还原、过度分析
- 布尔方法名用常见且直接的动词，避免抽象词和重复所属类或文件已经表达的语境，例如 `CanCast` 优于 `IsEligible` 或 `CanUseGenericFallback`
- 多处需要相同逻辑（尤其是要求口径一致的计算）时提取共享函数，不要各自维护一份；调用方各自实现一遍容易在后续修改时只改一处、悄悄产生口径分歧

## 注释规约

代码注释只写**为什么这样做**，不写**这行代码做了什么**。读者能从代码本身读懂的，就不要再用注释复述一遍。**一条注释如果只是对代码/细节的单纯复述，宁可不写这条注释**——数值、字段名、行为这些会随代码演进，注释复述的副本不会跟着自动更新，两者一旦不一致，读者反而无法判断谁是真相源。

不写：
- KV 字段、behavior、cast range 等可以直接查 KV 文件得到的事实
- "移植自 xxx.lua 的 yyy 函数"之类来源说明（git 历史会保留）
- 单行字段含义的复述（`// 覆盖默认 level >= 3` 跟在 `ability: { level: { gte: 2 } }` 后面就是冗余）
- 段落式罗列"对英雄做什么 / 对小兵做什么"，代码已经表达得很清楚
- **技能/物品的具体效果与数值描述**（会随版本变动，属于本地化文案的职责）。配置表/代码注释只标英雄名或技能系统名（如 `// 齐天大圣 觉醒`），不要复述"+100% 攻击力、施法距离 +700"这类效果——它们一变就和注释脱节
- **禁止**把讨论中出现的任何具体场景 / 边界 case / 取舍过程 / 例子（具体语言、单词、数值、变量名等）原样搬进注释。哪怕讨论时反复提到这些细节，注释里也只留一句概括性的设计意图，一个具体例子都不写——写了就是过度注释，必须删
- **"A 曾经是 X，现在/这里改成 Y"这种对比句式本身就是信号**，不管内容是否属实都要删——即使把话术改得更"技术化"（去掉"这次""沿用"等词），只要结构上是在拿过去和现在做对比，就还是在叙述变更过程而不是陈述设计事实，必须整句删掉，不是重新措辞
- **"为什么某项被排除/没有实现"这类逐项列举默认不写**，属于 PR 描述的职责，不是改写得更精炼就行

写完注释后自查一遍是否出现这些词：**旧 / 原版 / Lua / 沿用 / 这里 / 本次 / 此次 / 额外 / 改为**——出现即说明在叙述过程，删掉重写或整句删除。

写：
- 选择某个数值/方案的**原因**（"1 级伤害太低、蓝耗占比高，2 级起才用"）
- 与默认/约定不一致的**特殊处理**（"AoE 半径远大于 cast range，需要 castMode 投影到边缘"）
- 一两句话点出技能中文名 / 设计目的
- 公开方法（模块对外接口）的注释先用一句话说明**功能**，不点名具体文件/函数/API 端点等技术名词；边界情况和技术细节写成相应代码行上方的行内注释，不要堆进顶部方法说明——且只写不明显的边界情况，代码本身能读出来的分支不再注释

整个文件一个 `/** 一两行 */` JSDoc 即可，不需要分段、不需要 bullet 列表。

## Plan 规范

Plan 阶段重点讲清楚**设计思路和数据流**，不要写代码细节：

- **先设计，后细节**：Plan 应包含：背景/目标、设计决策（为什么这样做）、数据流（谁读谁写、字段名、经过哪些层）、修改文件列表（一行描述）、验证方式。
- **不写代码**：Plan 中不应出现具体函数签名、完整代码块、参数列表。这些留给实现阶段。
- **文件列表简洁**：每个文件一行，说明"改什么"即可，不说"怎么改"。

### 设计文档位置

设计文档统一放 `docs/superpowers/specs/<YYYY-MM-DD>-<主题>-<用途>.md`，**只在本地留档，不进版本控制**（`docs/superpowers/` 整个目录已被 gitignore）：

- `<用途>` 区分同主题的多篇，方案设计用 `design`，实现记录用具体范围（如 `game-read`）
- 不要新建 `docs/design/`，该目录已废弃删除

上面那份是方案过程稿，会话结束就没人再看。**留得住的设计思路与决策要另外写进版本控制**：模块级的放该模块目录下的 `README.md`（如 `src/vscripts/api/README.md`、`src/vscripts/ai/build-item/README.md`），只影响一两处实现的写成代码注释。

issue 只记大致步骤与进度，不承载设计细节——issue 关掉就没人看了，文档跟着代码走。issue 正文开头指向那份文档即可。

模块 `README.md` 是**框架性文档**：写系统现在长什么样、为什么这样搭、放弃了什么，长期维护。

- **不按阶段、批次组织**。逐段问「这段会不会因为某个阶段做完就失效？」——会失效的（阶段划分、进度、本阶段改了哪些文件、排查过程与证据、实测数字）进 issue、PR 或本地 spec，不进 README
- **已实现的做法不复述，一切以代码为准**。调用链、常量名与取值、某个函数做了什么、字段怎么拼，都从代码读，抄进文档只会先过期（口径同「注释规约」）。README 只留代码里读不出来的东西：约束、决定和它的理由
- **每个决定一句理由**。没选的方案值得提时，在理由里带半句「没选 X，因为 Y」；方案比较表、试算过程留在 PR
- **只在决策变更时更新，不因阶段完成而增删**。一次改动新增或推翻了长期决定，就在同一个 PR 里改 README，不要等用户催；只是按既有决定多接了一处，README 不动

判断一句话放 README 还是 `CLAUDE.md`：违反它是「这次改动做错了」，进对应目录的 `CLAUDE.md`；是「系统的结构变了」，进 README。

## Git 工作流

### 分支

- issue 驱动的改动命名 `feature/<issue-id>-<short-kebab-summary>`（3–6 个英文小写单词，如 `feature/2411-web-link-refresh`）；非 issue 驱动用 `fix/` `chore/` `docs/` 前缀，命名规则同上
- 一律从最新 `develop` 切出。**不要在 `develop` 上直接修改或 commit 任何文件**，包括 skill 产出的设计文档——一旦确定要写文件，先切好分支
- 本地没有进行中的改动时，直接在当前 checkout 上切分支，不建 worktree；已有未提交改动或另一个分支正在进行时，用 `git worktree add` 隔离
- 多个会话共用本地仓库时，主检出在哪个分支不由自己决定：动手前先看 `git branch --show-current`，不是自己要的分支就不要 `git checkout` 过去，改用 `git worktree add` 到 scratchpad

### 提交与 PR

- PR 的 base branch 固定为 `develop`；标题默认英文；纯内部改动（重构、构建、CI、文档、测试）自行判定跳过 Release Note，不提问也不查版本号，其余情况问用户走「小版本补丁 / 大版本 / 不写 Release Note」，需要写时必须调用 `release-note` skill 生成，不要手写
- 只有 PR 完成 issue 的全部范围时，才在 Issue 段写 `Fixes #<issue-id>`，让 PR 合并后自动关闭该 issue；issue 分为多个 PR 时，各 PR 仅写 `#<issue-id>` 关联，最后完成全部范围的 PR 才使用 `Fixes`
- Commit 格式：简短单行标题（≤72 字符）+ 正文只写 `Co-Authored-By`
- `docs/superpowers/` 整个目录已被 `.gitignore` 排除，brainstorming skill 产出的 spec 文档仅本地留档，不进版本控制，无需尝试 `git add`

只 stage 与本次请求明确相关的文件，commit 前先看 `git status`，不带入其他会话或用户自己的改动，无需逐个列给用户确认。但提交前若当前分支不符合预期（如本应在 feature 分支却处于 `develop`/`main`），先提示用户确认目标分支再提交。

### 小改动搭车

手上有未合并的 PR 时，文档措辞、注释、规约补充这类小改动直接并进去，不为每条单开 PR，并在 PR 正文补一句说明。以下任一条成立就另开分支：

- 与当前 PR 的主题冲突
- 当前 PR 已合并
- 一两句话说不清

没有开着的 PR 时先攒着等下一个 PR；只有改动有时效性（挡着别人、线上有问题）才单开。

### 合并与清理

用户给出合并指令时直接执行，没有指令不主动合并：

| PR | 命令 |
|---|---|
| `feature` / `fix` / `chore` / `docs` → `develop` | `gh pr merge <编号> --squash` |
| `develop` → `main`（release PR） | `gh pr merge <编号> --merge` |

CI 还没跑完时加 `--auto`，不要用 `--admin` 绕过分支保护。

合并后立刻清理本地分支，远端分支由仓库设置自动删除。squash 合并后 git 认不出分支已合并，必须用 `-D`：

```bash
git checkout develop
git pull
git branch -D <branch-name>
```

分支在 worktree 里时，先 `git worktree remove <path> --force`，删完分支再 `git worktree prune`。

> 完整流程（分支创建、commit、push、PR 模板填写）见 `create-pr` skill。

## 文档自维护规范

当用户纠正 Claude 的做法、发现文档与实际代码矛盾、或用户补充了新约定时，触发 `doc-update` skill 将有价值的内容沉淀到文档中。

沉淀位置按作用范围选，**就近优先**：

| 内容 | 去处 |
|---|---|
| 只在某一层成立的规则 | 该层的 `CLAUDE.md`（`src/vscripts/`、`src/panorama/`、`game/scripts/npc/`、`game/resource/`） |
| 某个模块的设计与决策 | 该模块的 `README.md` |
| 某类任务的流程与决策 | 对应 `SKILL.md` |
| 真正跨全项目的规则 | 本文件 |

本文件只保留项目级通用规则。文档更新应作为完成一次改动的一部分（自维护），不要等用户催促。

## Skill 交互规范

执行 skill 时，**遇到不明确的决策点必须用 `AskUserQuestion` 工具以选项菜单形式询问用户**，不得自行假设。适用场景包括但不限于：

- 目标文件有多个候选（如抽奖池 vs 单位专属）
- 操作模式不明确（新建 vs 修正）
- 原版技能信息无法确定（多个候选、版本差异等）

每道问题单独一次 `AskUserQuestion` 调用，`options` 列出具体候选项并附简短说明。
