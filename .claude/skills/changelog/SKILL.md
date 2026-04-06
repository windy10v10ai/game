---
name: changelog
description: >-
  生成 Steam Workshop 更新日志（中英文）。支持手动、PR、Issue（含 7.41 checklist 进度 x/总数，无清单则玩家向摘要）；用户确认后可写回 open PR（body-file UTF-8 无 BOM）。须解析具体版本（用户指定优先，否则 WebFetch Steam changelog）；`GAME_VERSION` 对照检查，大版本对齐或需发版时再改。
disable-model-invocation: true
---

# Changelog

为 Windy10v10AI Steam Workshop 生成中英文更新日志。

## 使用方法

### 手动提供更新内容

示例：

```
/changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### 从 GitHub PR 生成

示例：

```
/changelog 5.11 #1234
```

从 PR 读取：标题、描述、commits，提取更新内容。

### 从 GitHub Issue 与核对进度

示例：

```
/changelog https://github.com/windy10v10ai/game/issues/1952
```

当用户给出 **Issue**（`github.com/.../issues/<N>` 或 `issues/<N>`，**不是** `pull/`）时，先拉取正文再分两种路径：

**A. 标准路径**（正文含 **`### 7.41 同步核对`** 与清单行 **`- [x]` / `- [ ]`**）：

1. 拉取正文：`gh issue view <N> --repo windy10v10ai/game --json body`（解析 URL 得 `N`）。
2. 截取 **自 `### 7.41 同步核对` 起至首个 `**说明**`** 之前**的子串（勿计入上文其它列表里的 `-` 行）。
3. 统计：`- [x]` 为 **已完成**，`- [ ]` 为未完成；**总数** = 二者之和（可与文内「CustomHeroList **120** 名」等互校）。
4. 将 **已完成** 英雄的中文名按行内加粗名提取，用于「多英雄并列」；在同一条 bullet **末尾**缀 **`（Issue #N 英雄核对进度 x/总数）`** / **`(Issue #N hero checklist: x/total)`**。
5. 解析 JSON 时去掉 UTF-8 **BOM**（`\uFEFF`）再 `JSON.parse`；PowerShell 重定向 JSON 时尽量 UTF-8 **无 BOM**。

**B. 回退路径**（无 `### 7.41 同步核对` 或该段无 checklist）：**不要**编造 `x/总数`；据 Issue 标题与描述写 **2–5 条**玩家向 bullet，版本号仍走下文「执行步骤」第 2 步。

## 更新 open PR 的 Release Note

在**仓库根目录**执行，需已安装并登录 [`gh`](https://cli.github.com/)，远程为 `windy10v10ai/game`。

### 何时写入

- **必须先询问用户**，得到**明确肯定**（如「是」「好」「确认写入」「更新 PR」）后，才执行 `gh pr edit`。**禁止**在未获确认时擅自改 PR 描述。
- 生成中英文 Workshop 文案并输出后：若存在可写入目标，向用户说明 PR 编号与链接，并询问是否将 **`## Release Note`** 段替换为刚生成的内容；用户拒绝或仅要文案则跳过写入。
- 满足写入条件：**当前分支**在远端对应 open PR；**恰好一条**时默认指向该条；**多条**时先请用户指定 PR 编号，再就指定 PR 询问确认。
- 没有 open PR、`gh` 不可用或未登录时，只输出文案并说明无法写入。

### 定位 PR

```bash
# 分支名（示例）
git branch --show-current

# 当前分支对应的 open PR（JSON）
gh pr list --repo windy10v10ai/game --head <当前分支名> --state open --json number,url
```

PowerShell 可把 `<当前分支名>` 换为 ``$(git branch --show-current)``；若 `gh pr list` 返回空数组则停止。

### 替换 `## Release Note` 段

PR 描述建议保留 **Issue**、**Checklist** 等 `## Release Note` **之上**的内容不动，只替换从 **`## Release Note`** 起到**文末**的整块（与 `.github/pull_request_template.md` 一致：一节标题 + 两个 workshop 代码块）。

1. 取当前正文：`gh pr view <PR号> --repo windy10v10ai/game --json body -q .body`
2. 拼接 `新ReleaseNote`：标题行 `## Release Note`，空行，**第一个** fenced 块（内容 = 本次生成的中文版 workshop 全文），空行，**第二个** fenced 块（内容 = 英文版全文）。两段均用 markdown 的 \`\`\` 围栏包裹，版式与 `.github/pull_request_template.md` 中 `## Release Note` 下一致。
3. 若正文含子串 `## Release Note`：  
   `新正文` = 从开头到 **`## Release Note` 行之前**的子串（去掉尾部多余空行） + `\n\n` + `新ReleaseNote`  
4. 若正文**不含** `## Release Note`：  
   `新正文` = 原正文去尾空白 + `\n\n` + `新ReleaseNote`
5. 将 `新正文` 写入临时文件（**UTF-8，无 BOM**），执行：  
   `gh pr edit <PR号> --repo windy10v10ai/game --body-file <临时文件路径>`

编辑成功后向用户回报 PR 链接；**勿**把含 token 的命令输出写入仓库文件。

## 输出格式

### 版本号须自动填入（禁止占位符）

- 交给用户的**最终**中英文 Workshop 代码块里，标题行必须是**执行步骤第 2 步**已确定的**具体** `v…` 字符串。**禁止**写 `{版本号}`、`v{xx}` 等让用户自己替换。
- **用户已写明版本时**：参数里出现 `v5.11a`、`5.11a`、`5.11` 等且意图为**本条 Workshop 标题**的，**直接**规范为 `v5.11a` / `v5.11` 用于标题，**不要**再在 Steam 最新版上递增（与「手动提供更新内容」示例一致）。
- **用户未写版本时**：用 **WebFetch** 打开 [Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570)，取**列表第一条**（第 1 页）条目标题中的已发版本（如 `Gameplay update v5.19b` → `v5.19b`），再按「下一版小更新」在**同一大版本**下**递增补丁字母**得到本次标题（例 `v5.19c`）。`v5.19` 无字母则下一档一般为 `v5.19a`。若页内无条目、无法匹配版本、或递增越界（如后缀已到 `z`），**说明原因并询问用户**；**不得**留占位符。
- 上述逻辑须与「版本号决策优先级」一致：**用户指定**优先于 Steam 推算。

### 中文版本

结构（`v…` 在交付物中须为**具体值**，来自**执行步骤第 2 步**）：

```
[b]游戏性更新 v5.18c[/b]

- {更新内容1}
- {更新内容2}
```

上例中 `{更新内容1}` 等仅为**结构示意**；交付给用户的正文里须为真实条目，**不得**保留 `{更新内容…}` 占位。

### 英文版本

```
[b]Gameplay update v5.18c[/b]

- {更新内容1}
- {更新内容2}
```

`{更新内容…}` 同上，**交付时**须为真实英文 bullet，不得保留占位。

### 多英雄并列（Dota 版本同步类 PR / Release Note）

当一条更新对应 **多名英雄**（例如随官方版本对齐的本图技能调整）时：

- **同一条 bullet** 内用固定句式列出英雄；中文用全角逗号 **，** 分隔，英文用半角 **, ** 分隔；**不要**为每名英雄再拆子列表或换行。
- **范围**：**Issue checklist** 路径只列 **`- [x]`** 已勾选英雄；**PR** 路径列**本 PR 涉及的全部**英雄（与改动一致）。名称以 `addon_schinese.txt` / `addon_english.txt` 或 Issue 行为准。**未纳入本批次的英雄不要写入**。
- **玩家向表述**：用「同步 Dota 2 7.xx 对下列英雄的技能更新：…」这类句式；**禁止**在同条或相邻 Workshop bullet 中写维护向用语（如「KV」「override」「对齐参考」「注释」「AbilityValues」、文件路径、纯内部流程描述）。

示例（形状参考；**真实调用时 `v5.18c` 须换成本次执行步骤第 2 步结果**，勿照抄示例数字）：

```
[b]游戏性更新 v5.18c[/b]

- 同步 Dota 2 7.41 对下列英雄的技能更新：亚巴顿，炼金术士，狙击手，美杜莎
```

```
[b]Gameplay update v5.18c[/b]

- Synced Dota 2 7.41 ability updates for the following heroes: Abaddon, Alchemist, Sniper, Medusa
```

## 版本号格式

- **主要版本**：5.00, 5.10, 6.00（两位小数）
- **Patch 版本**：5.00a, 5.00b（字母后缀）

## 版本号决策优先级

决定 Workshop 标题等对外版本号时，**由上至下**，有命中即用，不再往下看。

1. **用户指定**  
   用户明确写出 `v5.xxa` 或要求采用某版本时，以该指定为准。

2. **对照 open release PR 与 Steam 当前线上版本**  
   - 若 PR 中的**大版本号**与 Steam **相同**：版本主体沿用 Steam 当前大版本号，仅将 **a/b/c… 后缀**在 Steam 上一版基础上顺序进一。  
   - 若 PR 的大版本号相对 Steam **已 +1**：采用 **PR 中的完整版本号**。

以下「特殊口令」「Steam / release PR 细则」「执行步骤」均在不与用户指定冲突的前提下适用；其中 Steam 与 PR 的读法对应上表第 2 条。

## 特殊口令：`版本号+1`

当用户明确输入 `版本号+1` 时，按**主版本递增**处理，而不是补丁字母递增：

- 先读取 Steam 最新版本（如 `v5.18e`）。
- 去掉字母后缀，仅取 `5.18`。
- 版本号做 `+0.01` 得到下一主版本：`5.19`（展示为 `v5.19`）。
- 该模式下**不**输出 `v5.18f`、`v5.19a` 这类补丁后缀，除非用户明确指定需要字母后缀。
- 若存在 open release PR 且标题版本与计算结果一致（如 `v5.19`），可直接采用该版本；若不一致，先询问用户。

## Workshop 版本号：Steam 与 GitHub release PR（默认规则）

生成「下一版」**Workshop 标题**时：**必须先读 Steam 已发记录**，再参考 GitHub；**禁止**在 Steam 仍停留在某一 `v5.xx` 线时，仅因存在 open 的 `v5.(xx+1)` release PR 就写成 `v5.(xx+1)a`（例如 Steam 最新为 **v5.18b** 时，日常 PR 应用 **v5.18c**，而不是 **v5.19a**）。  
注意：本节为**默认规则**，若用户明确输入 `版本号+1`，按上面的「特殊口令」执行。

### 1) Steam 已发布版本（事实基准；次于「用户指定」与「版本号+1」口令）

- 创意工坊更新记录：[Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570)
- 取页面上**最新一条**标题里的版本号，**含补丁字母**（例如 `Gameplay update v5.18b` → 当前对外线为 **5.18**，补丁档为 **b**）。
- 调用本技能时**应主动抓取该页**（如 WebFetch）做解析，**不要**假定版本、也不要把「请用户自己去 Steam 看」当作完成**执行步骤第 2 步**。

### 2) 下一版小更新（最常见）

- 在 **Steam 最新同一大版本**下，补丁字母顺延：**`v5.18b` → `v5.18c`** → `v5.18d`…
- 若 Steam 最新为**无字母**的 `v5.19`，则下一小更一般为 **`v5.19a`**。

### 3) GitHub open 的 release PR（仅作「即将发布的大版本」参考）

- 命令：`gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`
- 标题如 `v5.19` 表示**准备中的下一大版本**；**只要 Steam 最新仍是 `v5.18x`，Workshop 文案就仍跟 5.18 线递增字母**，不要把本次改动标成 `v5.19a`。
- **当** Steam 已出现新大版本、或维护者明确「本条随 release 首包上线」时，再按新大版本起标题（`v5.19` 或 `v5.19a` 等）。
- 多条 open release PR 时：与维护者或 Steam 实况对齐后择一，不确定则**问用户**。

### 4) 大版本切换（较少由单条 PR 决定）

- Steam 上出现新的无后缀大版本（如 `v5.19`）后，后续小更再从 **`v5.19a`** 起。
- **不要**把「仓库里 `GameConfig` / release PR 标题已写 5.19」自动等同于「Steam 已发 5.19」。

> 与 `GAME_VERSION`（`GameConfig.ts`）的关系不变：代码里仍用无 a/b/c 的 `v5.xx`；只有 Workshop 文案里可出现 `v5.xx` / `v5.xxa`。

## 撰写原则

1. **简洁明了**：每条 1-2 句话
2. **重点突出**：最重要的更新写在前面
3. **中文用全角标点**：，。；！
4. **英文用半角标点**：, . ; !
5. **英文表述要直接**：避免使用 “an issue where ...” 等冗余句式，优先用 “Fixed X not being Y.” / “Fixed X not working.” 等简洁写法
6. **物品/技能名称必须准确**：从本地化文件查找，不能猜测

### Workshop 文案：玩家向（必读）

面向 Steam 创意工坊的条目**写给玩家看**，与 PR 描述、内部 checklist 区分开。

- **禁止**写对局内体验无影响的维护项：例如「同步 KV」「对齐 7.41 注释」「仅注释更新」「便于维护」等——**不要**出现在 Workshop 列表里。
- **避免**过度技术化：文件路径、`npc_*.txt`、`AbilityValues`、具体倍率小数（如「1.3 改为 1.2」）等；除非用户明确要求保留数字。
- **优先**写玩家能感知的结果：加强/削弱/修正谁、哪类玩法变了（例：「加强沼蛙系中立击杀奖励与远古中立属性」「普通中立击杀赏金有所降低」）。
- **Dota 大版本技能跟进、且一批多名英雄**：优先用「多英雄并列」节的**单条列举全部英雄**句式，不写技术性过程描述。
- **篇幅**：整次更新中英文各自通常 **2–5 条** bullet 即可；能合并的合并，忌堆砌。

## 物品/技能名称查找

- **中文**：`game/resource/addon_schinese.txt`
- **英文**：`game/resource/addon_english.txt`

命名规范：

- 物品：`DOTA_Tooltip_Ability_item_xxx`
- 技能：`DOTA_Tooltip_ability_xxx`

## 常用术语对照

| 中文 | 英文 |
|------|------|
| 同步Dota更新 | Sync Dota update |
| 修正 | Fix/Fixed |
| 新增 | Add/Added |
| 调整 | Adjust/Adjusted |
| 技能抽选池 | Ability draft pool |
| 平衡性改动 | Balance changes |
| 金钱/经验倍率 | Gold/XP multiplier |
| 勇士积分 | Battle Points |
| 中立物品 | Neutral items |
| 出装 | Item build |

## 从 GitHub PR 提取信息

### PR 标题识别版本号

- `v5.10 - 同步Dota 7.40c` → 版本号：5.10
- `Release 5.10` → 版本号：5.10

### PR 描述解析

优先查找：

- 明确的更新列表（`-` 或 `*` 开头）
- “更新内容” / “Changes” / “What's Changed” 章节

如果描述中没有明确列表：

- 从文件变更和 commits 信息推断
- 总结为 3-5 条简洁的更新点

### 注意事项

- **先过滤再写**：PR/commit 里的注释同步、KV 对照、纯文档/技能文件变更若无玩法影响，**不写入** Workshop 条目（见上文「玩家向」）。
- **多名英雄随官方版本调整技能**：从 PR/Issue/变更范围归纳**完整英雄列表**，输出为一条玩家向 bullet（见「多英雄并列」），**不得**用「同步 override」「对齐参考」等内部说法代替。
- 数值改动用**定性表述**（略为降低、提高、调整）代替具体倍率，除非用户指定要写明数字。
- 合并相似内容；突出影响玩家体验的更新；中英文条目语义对齐，但不必逐字直译。

## GAME_VERSION 同步规则

文件位置：`src/vscripts/modules/GameConfig.ts`

规则：`GAME_VERSION` 不包含 a/b/c 后缀

- 更新日志 `5.11a` → `GAME_VERSION` 应为 `'v5.11'`
- 更新日志 `5.12` → `GAME_VERSION` 应为 `'v5.12'`

检查步骤：

1. 读取 `GameConfig.ts` 中的 `GAME_VERSION`
2. 去掉 Workshop 标题版本的 a/b/c 后缀，与 `GAME_VERSION` 比较
3. **是否改文件**以文末「执行步骤」第 4 条为准：大版本需对齐或用户要随本次发版改仓库时再写入；仅 `a/b/c` 小更时**通常不改**，在输出末提醒核对即可

## 执行步骤（当用户调用本技能时）

1. **判断参数类型**（**Issue #N 与 PR #N 编号空间独立**，勿混）：
   - URL 含 **`/issues/`** 或参数显式 **`issues/<N>`** → **Issue**，走「从 GitHub Issue 与核对进度」：**有** `### 7.41 同步核对` checklist → 标准路径 A；**无**则回退路径 B。
   - URL 含 **`/pull/`**，或 **`#<N>`**、**纯数字**且用户**未**标明为 Issue → 默认 **PR**，`gh pr view <N>`。
   - 否则 → **手动**（首段可含 `5.11` / `v5.11a` 作版本，余下为更新点）。
2. **确定 Workshop 标题版本**（须为具体 `v…`，禁止 `{版本号}`）：
   - **优先**：参数中可识别的 **`v5.xxa` / `5.xxa` / `5.xx`**（本条创意工坊标题）→ **直接**规范为 `v…` 采用，**不再**对 Steam 末版做补丁递增。
   - 否则若用户要求 **`版本号+1`** → 「特殊口令」（Steam 最新 → 主版本 +0.01）。
   - 否则 → **WebFetch** changelog **第 1 页首条**解析已发版 → 同大版本下递增补丁字母；并核对 **「版本号决策优先级」** 与 **`gh pr list --label release`**，避免 Steam 未跟上时误用未发大版本。
   - 无法解析或冲突 → **说明并询问用户**。
3. **生成更新日志**：
   - **Issue + checklist**：多英雄仅 **`- [x]`**；末尾 **`（Issue #N 英雄核对进度 x/总数）`** / **`(Issue #N hero checklist: x/total)`**。
   - **Issue 无 checklist**：2–5 条玩家向 bullet，**不**写虚假 `x/总数`。
   - **PR**：2–5 条；多英雄 Dota 跟进时列**本 PR 涉及全部**英雄。
   - **手动**：按用户列点。
4. **`GAME_VERSION`（`GameConfig.ts`）**：按「GAME_VERSION 同步规则」**对照**；**仅当** Workshop 主推**大版本**相对 `GAME_VERSION` 去后缀后变化、且用户需要改仓库发版时**修改**。仅递增 `a/b/c` 时**通常不改**。只要文案、或用户禁止改代码 → **跳过**并在输出末**一行提醒**核对 `GAME_VERSION`。
5. **输出**：中英文两个版本，用分隔线隔开；两段标题行均嵌入步骤 2 的**具体** `v…`，与「版本号须自动填入」一致。
6. **写入 open PR**：**须用户确认后**再 `gh pr edit --body-file`。**临时文件 UTF-8，无 BOM**（Windows 避免 PR 乱码）。多条 open PR 先让用户选号。


### 交付前自检（完整性）

- 中英文标题行版本一致，且为**已解析的具体**字符串，无 `{版本号}` 等占位符。
- Issue 类：有 checklist 时 `x` / `total` 与勾选统计一致；未勾选英雄未写入「已同步」。**无** checklist 时**不得**写虚假 `x/总数`。
- 多英雄 bullet：与 PR / Issue / 用户给定范围**同批同名**，中英文列表对应。
- 玩家向：无 KV、override、文件路径、维护向套话（见「撰写原则 · Workshop 文案」）。

信息不完整时先询问用户。

