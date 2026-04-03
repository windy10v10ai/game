---
name: generate-changelog
description: 生成 Steam Workshop 更新日志（中英文）。支持手动提供更新点或从 GitHub PR 提取信息，并按项目规范同步 GAME_VERSION。
disable-model-invocation: true
---

# Generate Changelog

为 Windy10v10AI Steam Workshop 生成中英文更新日志。

## 使用方法

### 手动提供更新内容

示例：

```
/generate-changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### 从 GitHub PR 生成

示例：

```
/generate-changelog 5.11 #1234
```

从 PR 读取：标题、描述、commits，提取更新内容。

## 输出格式

### 中文版本

```
[b]游戏性更新 v{版本号}[/b]

- {更新内容1}
- {更新内容2}
```

### 英文版本

```
[b]Gameplay update v{版本号}[/b]

- {更新内容1}
- {更新内容2}
```

## 版本号格式

- **主要版本**：5.00, 5.10, 6.00（两位小数）
- **Patch 版本**：5.00a, 5.00b（字母后缀）

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

### 1) Steam 已发布版本（最高优先级 / 事实基准）

- 创意工坊更新记录：[Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570)
- 取页面上**最新一条**标题里的版本号，**含补丁字母**（例如 `Gameplay update v5.18b` → 当前对外线为 **5.18**，补丁档为 **b**）。

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
- 数值改动用**定性表述**（略为降低、提高、调整）代替具体倍率，除非用户指定要写明数字。
- 合并相似内容；突出影响玩家体验的更新；中英文条目语义对齐，但不必逐字直译。

## GAME_VERSION 同步规则

文件位置：`src/vscripts/modules/GameConfig.ts`

规则：`GAME_VERSION` 不包含 a/b/c 后缀

- 更新日志 `5.11a` → `GAME_VERSION` 应为 `'v5.11'`
- 更新日志 `5.12` → `GAME_VERSION` 应为 `'v5.12'`

检查步骤：

1. 读取 `GameConfig.ts` 中的 `GAME_VERSION`
2. 去掉更新日志版本的 a/b/c 后缀比较
3. 如果不一致，修改为正确的版本号

## 执行步骤（当用户调用本技能时）

1. **判断参数类型**：
   - 包含 `#` 或纯数字 → 从 PR 提取
   - 否则 → 视为手动提供的更新内容
2. **确定版本号**（用户未明确写出 `v5.xx` / `v5.xxa` 时必做）：
   - 若用户参数包含 `版本号+1`：按「特殊口令：版本号+1」处理，输出下一主版本（如 `v5.19`）。
   - **先**查 Steam [changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570) 最新一条（含 `a/b/c`），在同一大版本下递增字母得到下一 Workshop 标题。
   - **再**看 `gh pr list … --label release`：仅当 Steam 已跟上新大版本或用户明确随 release 首发时，才采用 release PR 上的新大版本号；**勿**在 Steam 仍为 `v5.18x` 时用 `v5.19a`。
3. **生成更新日志**：
   - PR：提取玩法相关改动，**去掉**纯维护/注释/KV 同步类条目后，归纳为 **2–5 条**玩家向 bullet（不足则按实际）
   - 文本：直接按用户提供内容生成条目，仍遵守「玩家向」规则
4. **同步 `GAME_VERSION`**（按 `GAME_VERSION 同步规则`）
5. **输出**：中英文两个版本，用分隔线隔开

信息不完整时先询问用户。

