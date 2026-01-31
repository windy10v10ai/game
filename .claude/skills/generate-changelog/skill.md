---
name: generate-changelog
description: 生成 Steam Workshop 更新日志（中英文）。用于发布新版本时快速创建规范的更新日志。支持从 GitHub PR 自动提取信息。
argument-hint: [版本号] [更新内容 或 #PR编号]
---

# 生成更新日志

为 Windy10v10AI Steam Workshop 生成中英文更新日志。

## 使用方法

### 方式1：手动提供更新内容

```
/generate-changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### 方式2：从 GitHub PR 生成

```
/generate-changelog 5.11 #1234
```

或者

```
/generate-changelog 5.11 1234
```

我会自动使用 GitHub MCP 工具读取 PR 信息（标题、描述、文件变更），然后生成更新日志。

如果未提供版本号或内容，我会询问你。

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

## 内容撰写原则

1. **简洁明了**：每条1-2句话
2. **重点突出**：最重要的更新写在前面
3. **使用中文全角标点**：，。；！
4. **使用英文半角标点**：, . ; !
5. **物品/技能名称必须准确**：从本地化文件中查找正确翻译

## 物品/技能名称查找规则

**重要**：更新日志中提到的所有物品和技能名称，必须从本地化文件中查找正确的翻译，不能凭记忆或猜测。

### 查找方法

1. **中文名称**：在 `game/resource/addon_schinese.txt` 中查找
2. **英文名称**：在 `game/resource/addon_english.txt` 中查找

### 查找步骤

假设要查找 `item_forbidden_staff` 的名称：

```bash
# 中文名称
grep "DOTA_Tooltip_Ability_item_forbidden_staff\"" game/resource/addon_schinese.txt
# 输出: "DOTA_Tooltip_Ability_item_forbidden_staff" "禁忌法锤"

# 英文名称
grep "DOTA_Tooltip_Ability_item_forbidden_staff\"" game/resource/addon_english.txt
# 输出: "DOTA_Tooltip_Ability_item_forbidden_staff" "Forbidden Staff"
```

### 命名规范

- **物品**：`DOTA_Tooltip_Ability_item_xxx` 或 `DOTA_Tooltip_ability_item_xxx`
- **技能**：`DOTA_Tooltip_ability_xxx`
- **modifier**：`DOTA_Tooltip_modifier_xxx`

### 示例

| 物品代码 | 中文名称（addon_schinese.txt） | 英文名称（addon_english.txt） |
|----------|-------------------------------|------------------------------|
| item_forbidden_staff | 禁忌法锤 | Forbidden Staff |
| item_gungir_2 | 风暴之锤 | Advanced Gleipnir |

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
| 难度 | Difficulty |
| 勇士积分 | Battle Points |
| 合成配方 | Recipe |
| 中立物品 | Neutral items |
| 出装 | Item build |
| 技能加点 | Ability build |
| 天赋 | Talent |

## 从 GitHub PR 提取信息的技巧

### PR 标题格式识别

常见的 PR 标题格式：
- `v5.10 - 同步Dota 7.40c` → 版本号: 5.10
- `Release 5.10` → 版本号: 5.10
- `Update to v5.10a` → 版本号: 5.10a

### PR 描述解析

优先查找：
- 明确的更新列表（通常使用 `-` 或 `*` 开头）
- "更新内容" / "Changes" / "What's Changed" 等章节
- Commit 信息汇总

如果 PR 描述中没有明确的更新列表：
- 查看文件变更，推断主要修改内容
- 查看 commits 信息，提取关键更新
- 总结为简洁的更新点（3-5条）

### 注意事项

- **简化技术细节**：将技术性的 PR 描述转化为玩家友好的描述
- **合并相似内容**：多个小修正可以合并为一条
- **突出重点**：优先展示影响玩家体验的更新

## 参考示例

**示例1**：
```
[b]游戏性更新 v5.10[/b]

- 同步Dota 7.40c技能更新。
```

**示例2**：
```
[b]游戏性更新 v5.09[/b]

- 为死灵法杖，禁忌法锤和暗影咒灭的debuff添加基础魔法抗性减少效果。
- 修正符文图标，热飞导弹，戴泽编织升级
- 银月在背包中可叠加
- 轮换自定义模式自选技能
```

**从 PR 生成的示例**：

假设 PR #1234 标题为 "v5.11 更新"，描述为：
```
- Fix Monkey King Jingu Mastery damage calculation
- Add Firestorm to lottery pool
- Sync 7.40c balance changes
```

生成的更新日志：
```
[b]游戏性更新 v5.11[/b]

- 修正猴子棒击伤害计算。
- 技能抽选新增火焰风暴。
- 同步Dota 7.40c平衡性调整。
```

## 工作流程

### 如果参数是 PR 编号（#1234 或 1234）

1. **读取 PR 信息**：使用 GitHub MCP 工具获取：
   - PR 标题（可能包含版本号）
   - PR 描述（可能包含更新内容列表）
   - 文件变更（用于推断更新内容）
   - Commits 信息（辅助理解更新内容）

2. **提取关键信息**：
   - 从 PR 标题或描述中提取版本号（如果有）
   - 从 PR 描述中提取更新内容列表
   - 如果描述中没有明确的更新列表，根据文件变更和 commits 总结

3. **生成更新日志**：按照标准格式生成中英文版本

### 如果参数是文本内容

1. **收集信息**：从 $ARGUMENTS 或询问用户获取版本号和更新内容
2. **生成中文版本**：使用中文全角标点
3. **翻译英文版本**：使用英文半角标点，保持简洁
4. **输出**：直接输出可复制的完整更新日志

---

## 执行任务

参数：$ARGUMENTS

### 处理步骤

1. **判断参数类型**：
   - 如果包含 `#` 或纯数字且像 PR 编号（如 #1234, 1234），使用 GitHub MCP 读取 PR
   - 否则视为手动提供的更新内容

2. **生成更新日志**：
   - 如果是 PR：先读取 PR 信息，提取关键更新内容，然后生成
   - 如果是文本：直接使用提供的内容生成

3. **输出格式**：中英文两个版本，用分隔线隔开

如果信息不完整，先询问我。
