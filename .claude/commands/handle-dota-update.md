---
description: 处理 Dota 2 破坏性更新对自定义地图的影响
---

# Dota 2 破坏性更新处理

处理 Dota 2 版本更新对自定义地图 override 技能的影响，逐个英雄更新技能数据。

## 前置知识

请先阅读 `.claude/skills/dota-override-rules.md` 了解 Override 规则。

---

## 执行步骤

### 1. 准备工作

请用户提供以下信息：

- Dota 2 更新版本号（如：7.40）
- GitHub Issue URL（用于追踪进度）
- 需要处理的英雄（用户逐个提供）

验证参考数据存在：

- `docs/reference/{version}/heroes/` 目录
- `docs/reference/{version}/abilities_schinese.txt`

### 2. 逐个处理英雄

对每个英雄，执行以下步骤：

#### 2.1 查找英雄在 override 文件中的位置

```bash
grep -n "hero_name" game/scripts/npc/npc_abilities_override.txt
```

#### 2.2 读取相关上下文

- 从 override 文件中读取该英雄的技能定义（使用行号范围）
- 从 `docs/reference/{version}/heroes/npc_dota_hero_{hero_name}.txt` 读取官方最新数据

**重要**：override 文件很长，必须通过技能名精确定位，只读取相关部分。

#### 2.3 分析并展示给用户

使用表格展示对比：

| 属性   | 旧官方值        | 新官方值        | 当前 Override       | 差异 | 建议更新            |
| ------ | --------------- | --------------- | ------------------- | ---- | ------------------- |
| radius | 150 170 190 210 | 160 180 200 220 | 150 165 180 195 210 | -5   | 160 175 190 205 220 |

**注意**：当 Override 与旧官方值有差异时，保持同样的差异应用到新官方值。

#### 2.4 等待用户确认

询问用户是否同意建议的更新方案。如用户有不同意见，按用户要求调整。

#### 2.5 更新 override 文件

使用 Edit 工具更新，保持原有的缩进和格式。

#### 2.6 提交更改

直接 commit 本次更新：

```bash
git add game/scripts/npc/npc_abilities_override.txt
git commit -m "update {hero_name} abilities for {version}"
```

#### 2.7 向用户报告完成

```
✅ 已更新: {hero_name}
  - {ability_1}: {改动说明}
  - {ability_2}: {改动说明}
```

#### 2.8 继续下一个英雄

等待用户提供下一个需要处理的英雄名称。

### 3. 完成后

所有英雄更新完成后，输出总结。

---

## 输出格式

### 每个英雄处理完成后

```
✅ 已更新: {hero_name}
  - {ability_1}: {主要改动说明}
  - {ability_2}: {主要改动说明}
```

### 全部完成后

```
Dota 2 {version} 更新处理完成
共更新 {count} 个英雄：
- {hero_1}
- {hero_2}
...
```
