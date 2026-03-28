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

## Workshop 版本号：Steam 与 GitHub release PR

生成或核对「下一版」更新日志标题中的版本号时，**同时**看两处：

### 1) Steam 已发布版本（事实基准）

- 创意工坊更新记录：[Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570)
- 取页面上**最新一条**更新的版本号（例如 `Gameplay update v5.17` → 已对外发布的大版本为 **5.17**）。

### 2) GitHub 待合并的 release PR（大版本锚点）

- PR 列表：[windy10v10ai/game Pull requests](https://github.com/windy10v10ai/game/pulls)
- 在 **Open** 的 PR 中，筛选带有 **`release`** 标签的 PR；**以大版本为准的版本号取自该 PR 的标题**（例如标题 `v5.17` → 大版本 **5.17**）。
- 建议用 CLI 一次性列出（需已安装并登录 `gh`）：

```bash
gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url
```

- **多条 open 的 release PR**：以与当前发布流程一致的那条为准（通常只有一条；若不止一条，结合标题中的版本号与 Steam 已发版本人工判断，或询问维护者）。

### 3) 下一版文案用 `v5.xx` 还是 `v5.xxa/b/c`？

- **存在**带 `release` 标签且仍为 **Open** 的 PR，且其标题中的大版本与当前发布线一致时：**保持该大版本不变**，在 Workshop 上追加的补丁说明依次使用 **a、b、c**…（例如已发 Steam 为 `v5.17`，则下一条可写 **`v5.17a`**，再下一条 **`v5.17b`**）。
- **不存在**上述 open 的 release PR 时：视为上一大版本已合完，**大版本号递增**（例如 `v5.17` → **`v5.18`**），新说明用新大版本，一般不再带 `a`（除非你们后续又约定在同一大版本下继续打补丁）。

> 与 `GAME_VERSION`（`GameConfig.ts`）的关系不变：代码里仍用无 a/b/c 的 `v5.xx`；只有 Workshop 文案里可出现 `v5.xx` / `v5.xxa`。

## 撰写原则

1. **简洁明了**：每条 1-2 句话
2. **重点突出**：最重要的更新写在前面
3. **中文用全角标点**：，。；！
4. **英文用半角标点**：, . ; !
5. **英文表述要直接**：避免使用 “an issue where ...” 等冗余句式，优先用 “Fixed X not being Y.” / “Fixed X not working.” 等简洁写法
6. **物品/技能名称必须准确**：从本地化文件查找，不能猜测

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

- 简化技术细节为玩家友好的描述
- 合并相似内容
- 突出影响玩家体验的更新

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
   - 查阅 Steam 创意工坊 [changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570) 最新已发布版本。
   - 运行 `gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url`，从 **标题** 读取待发布大版本。
   - 按上文「Workshop 版本号：Steam 与 GitHub release PR」决定本次标题用新大版本还是同一大版本下的 `a/b/c`。
3. **生成更新日志**：
   - PR：提取并归纳为 3-5 条（不足则按实际）
   - 文本：直接按用户提供内容生成条目
4. **同步 `GAME_VERSION`**（按 `GAME_VERSION 同步规则`）
5. **输出**：中英文两个版本，用分隔线隔开

信息不完整时先询问用户。

