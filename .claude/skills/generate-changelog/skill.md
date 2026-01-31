---
name: generate-changelog
description: 生成 Steam Workshop 更新日志（中英文），支持从 GitHub PR 自动提取信息
argument-hint: [版本号] [更新内容 或 #PR编号]
---

# 生成更新日志

为 Windy10v10AI Steam Workshop 生成中英文更新日志。

## 使用方法

### 手动提供更新内容

```
/generate-changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### 从 GitHub PR 生成

```
/generate-changelog 5.11 #1234
```

使用 GitHub MCP 工具读取 PR 信息（标题、描述、commits），提取更新内容。

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

## 撰写原则

1. **简洁明了**：每条1-2句话
2. **重点突出**：最重要的更新写在前面
3. **中文用全角标点**：，。；！
4. **英文用半角标点**：, . ; !
5. **物品/技能名称必须准确**：从本地化文件查找

## 物品/技能名称查找

**重要**：所有物品和技能名称必须从本地化文件查找，不能猜测。

- **中文**：`game/resource/addon_schinese.txt`
- **英文**：`game/resource/addon_english.txt`

查找示例：
```bash
grep "DOTA_Tooltip_Ability_item_forbidden_staff\"" game/resource/addon_schinese.txt
# 输出: "DOTA_Tooltip_Ability_item_forbidden_staff" "禁忌法锤"
```

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

- `v5.10 - 同步Dota 7.40c` → 版本号: 5.10
- `Release 5.10` → 版本号: 5.10

### PR 描述解析

优先查找：
- 明确的更新列表（`-` 或 `*` 开头）
- "更新内容" / "Changes" / "What's Changed" 章节

如果描述中没有明确列表：
- 从文件变更和 commits 信息推断
- 总结为 3-5 条简洁的更新点

### 注意事项

- 简化技术细节为玩家友好的描述
- 合并相似内容
- 突出影响玩家体验的更新

## 参考示例

```
[b]游戏性更新 v5.09[/b]

- 为死灵法杖，禁忌法锤和暗影咒灭的debuff添加基础魔法抗性减少效果。
- 修正符文图标，热飞导弹，戴泽编织升级
- 银月在背包中可叠加
- 轮换自定义模式自选技能
```

## GAME_VERSION 同步规则

文件位置：`src/vscripts/modules/GameConfig.ts`

**规则**：GAME_VERSION 不包含 a/b/c 后缀
- 更新日志 `5.11a` → GAME_VERSION `'v5.11'`
- 更新日志 `5.12` → GAME_VERSION `'v5.12'`

检查步骤：
1. 读取 GameConfig.ts 中的 GAME_VERSION
2. 去掉更新日志版本的 a/b/c 后缀比较
3. 如果不一致，修改为正确的版本号

---

## 执行任务

参数：$ARGUMENTS

### 处理步骤

1. **判断参数类型**：
   - 包含 `#` 或纯数字 → 使用 GitHub MCP 读取 PR
   - 否则 → 视为手动提供的更新内容

2. **生成更新日志**：
   - PR：读取 PR 信息，提取关键更新内容
   - 文本：直接使用提供的内容

3. **同步 GAME_VERSION**：
   - 读取 `src/vscripts/modules/GameConfig.ts`
   - 检查版本号是否匹配（去掉 a/b/c 后缀比较）
   - 如果不匹配，修改为正确的版本号

4. **输出**：中英文两个版本，用分隔线隔开

如果信息不完整，先询问我。
