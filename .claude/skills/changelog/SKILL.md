---
name: changelog
description: >-
  生成 Steam Workshop 中英文更新日志。支持手动、PR、Issue（含 checklist 进度）。
  版本号：用户指定 > release PR 大版本 > Steam 递增补丁字母。
  用户确认后可写回 open PR（UTF-8 无 BOM）。
disable-model-invocation: true
---

# Changelog

为 Windy10v10AI Steam Workshop 生成中英文更新日志。

## 使用方法

### 手动

```
/changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### 从 GitHub PR

```
/changelog #1234
```

从 PR 读取标题、描述、commits，提取更新内容。

### 从 GitHub Issue

```
/changelog https://github.com/windy10v10ai/game/issues/1952
```

URL 含 `/issues/` → Issue；拉取正文分两条路径：

**A. 标准路径**（正文含 `### 7.41 同步核对` 与 `- [x]` / `- [ ]` 清单）：

1. `gh issue view <N> --repo windy10v10ai/game --json body`
2. 截取 `### 7.41 同步核对` 至首个 `**说明**` 之间的清单行。
3. 统计已完成 `- [x]` 与未完成 `- [ ]`；总数 = 二者之和。
4. 已完成英雄名用于「多英雄并列」，末尾缀 `（Issue #N 英雄核对进度 x/总数）` / `(Issue #N hero checklist: x/total)`。
5. 解析 JSON 时去掉 BOM（`\uFEFF`）。

**B. 回退路径**（无 checklist）：据 Issue 标题与描述写 2–5 条玩家向 bullet，**不**编造 `x/总数`。

## 版本号决策（优先级由上至下，命中即用）

版本号须为具体 `v…` 字符串，**禁止**占位符。格式：主版本 `5.00`/`5.10`，补丁 `5.00a`/`5.00b`。

### 1. 用户指定

参数中出现 `v5.xxa` / `5.xx` 等，直接规范为 `v…` 采用。

### 2. 特殊口令 `版本号+1`

Steam 最新去掉字母后缀 +0.01 得下一主版本（如 `v5.19b` → `v5.20`）。若 open release PR 版本一致则直接采用；不一致则问用户。

### 3. Open release PR 大版本 > Steam

```bash
gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url
```

release PR 存在且大版本**严格高于** Steam（如 Steam `v5.19b`，release PR `v5.20`）→ **采用 release PR 版本**（`v5.20`）。
**Steam 已发布与 release PR 同大版本**（如 Steam `v5.20`，release PR `v5.20`）→ **不采用**，进入步骤 4。多条 release PR 时问用户。

### 4. 默认：Steam 同大版本递增补丁字母

**WebFetch** [Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570) 取第 1 页首条版本，在同一大版本下递增字母（`v5.19b` → `v5.19c`；`v5.20` → `v5.20a`）。无字母则下一档为 `a`。无法解析时问用户。

> `GAME_VERSION`（`GameConfig.ts`）不含 a/b/c 后缀；只有 Workshop 文案可出现 `v5.xxa`。

## 输出格式

中文：

```
[b]游戏性更新 v5.20[/b]

- 更新内容
```

英文：

```
[b]Gameplay update v5.20[/b]

- Update content
```

交付时须为真实条目，不得保留占位。

### 多英雄并列

同一条 bullet 列出所有英雄；中文用 **，** 分隔，英文用 **, ** 分隔。

**英雄范围确定规则：**
- **PR**：通过 `gh pr diff <N>` 提取实际改动的技能前缀（如 `pudge_`、`silencer_` 等），只列**本 PR 实际涉及**的英雄，不得包含其他 PR 的英雄
- **Issue checklist**：只列已勾选 `- [x]` 的英雄

**进度标注（Issue + checklist 时必须）：**
- 中文：`（x/总数）` 紧跟在「技能更新」之后，冒号前
- 英文：`(x/total)` 同位置

句式模板：
```
- 同步 Dota 2 7.41 英雄的技能更新（x/总数）：英雄A，英雄B，英雄C
```
```
- Synced Dota 2 7.41 ability updates (x/total): Hero A, Hero B, Hero C
```

名称以 `addon_schinese.txt` / `addon_english.txt` 为准；找不到则用官方中英文名。

## 撰写原则

1. 简洁明了，每条 1–2 句
2. 重要的写在前面
3. 中文全角标点，英文半角标点
4. 英文直接表述（`Fixed X not working.`），避免冗余句式
5. 物品/技能名从本地化文件查找（中 `addon_schinese.txt`，英 `addon_english.txt`），不猜测

### 玩家向

- **禁止**维护向用语：KV、override、对齐参考、注释、AbilityValues、文件路径
- **避免**技术细节（具体倍率小数等），除非用户要求
- **优先**玩家感知：加强/削弱/修正谁、哪类玩法变了
- 多英雄技能跟进时用「多英雄并列」句式
- 每次中英文各 2–5 条 bullet

### 从 PR 提取信息

- 优先从描述中的更新列表提取；无列表则从 commits 推断 3–5 条
- 注释同步、KV 对照、纯文档变更若无玩法影响不写入
- 多英雄技能同步归纳为一条玩家向 bullet
- 数值改动用定性表述，除非用户指定

## 常用术语对照

| 中文 | 英文 |
|------|------|
| 同步Dota更新 | Sync Dota update |
| 修正 | Fix/Fixed |
| 新增 | Add/Added |
| 调整 | Adjust/Adjusted |
| 技能抽选池 | Ability draft pool |
| 金钱/经验倍率 | Gold/XP multiplier |
| 中立物品 | Neutral items |

## GAME_VERSION 同步

文件：`src/vscripts/modules/GameConfig.ts`，不含 a/b/c 后缀（`v5.20` 而非 `v5.20a`）。

- Workshop 大版本（去掉 a/b/c）与 `GAME_VERSION` 不同时 → **自动修改** `GameConfig.ts`
- 仅 a/b/c 小更、大版本未变 → 不改

## 更新 open PR 的 Release Note

生成文案后，用**选项菜单**让用户选择操作（写入 PR / 仅提交改动 / 全部执行 / 跳过），按所选执行。

```bash
gh pr list --repo windy10v10ai/game --head $(git branch --show-current) --state open --json number,url
```

恰好一条时默认指向；多条时先让用户选号；无 open PR 则只输出文案。

替换方式：保留 `## Release Note` 之上的内容，替换该标题起至文末。

1. `gh pr view <N> --repo windy10v10ai/game --json body -q .body`
2. 拼接：`## Release Note` + 中文围栏块 + 英文围栏块
3. 写入临时文件（**UTF-8 无 BOM**），`gh pr edit <N> --body-file <文件>`

## 执行步骤

1. **判断参数类型**（Issue 与 PR 编号独立）：
   - URL 含 `/issues/` → Issue（有 checklist → 路径 A；无 → 路径 B）
   - URL 含 `/pull/`，或 `#N` / 纯数字 → PR
   - 其他 → 手动
2. **确定版本**：按「版本号决策」1→2→3→4 优先级执行。
3. **生成更新日志**：Issue+checklist 列已完成英雄并附 `x/总数`；PR 列全部英雄；手动按用户列点。
4. **GAME_VERSION 同步**：大版本变化时自动修改 `GameConfig.ts`。
5. **输出**中英文两版，标题含具体版本号。
6. **写入 PR**：用选项菜单让用户选择操作后执行。

### 交付前自检

- 版本号为具体字符串，中英文一致
- Issue checklist `x/total` 统计正确；无 checklist 不编造
- 多英雄列表与实际范围一致
- 无维护向技术用语
