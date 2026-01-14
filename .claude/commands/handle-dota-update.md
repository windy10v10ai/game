---
description: 处理 Dota 2 破坏性更新对自定义地图的影响
---

# Dota 2 破坏性更新处理命令

处理 Dota 2 版本更新对自定义地图 override 技能的影响，逐个英雄更新技能数据。

## 任务概述

当 Dota 2 发生破坏性更新时，需要更新 `game/scripts/npc/npc_abilities_override.txt` 中的英雄技能数据。

## Override 规则

1. **等级提升规则**
   - 小技能：MaxLevel 提升到 5 级
   - 大招：MaxLevel 提升到 4 级
   - 特殊技能：单独处理

2. **KV 格式规则**
   - 只填写 override 的内容，不需要全部复制
   - KV 结构遵循 Dota 2 定义
   - 如果每级数值不同，需要适配修改后的最大等级

3. **数值调整规则**
   - 通常采用等比数列增加
   - 过于短暂的 CD 保持最大等级数值不变：
     - 小技能：5s 以内
     - 大招：60s 以内
   - 百分比数值保持最大等级数值不变
   - 每级数值尽量保持整数或 5、10 的倍数

4. **注释规则**
   - 特定技能如有额外加强/削弱，在 value 后添加注释标注原数值和改动

## 执行步骤

### 1. 准备工作

请用户提供以下信息（如果未提供）：
- Dota 2 更新日志 URL（如：https://www.dota2.com/patches/7.40）
- 版本号（如：7.40）
- 要更新的英雄列表（或从更新日志中提取）

### 2. 验证准备条件

检查以下条件是否满足：

a) **更新日志**
   - 使用 WebFetch 获取 Dota 2 更新日志
   - 提取受影响的英雄列表

b) **参考数据**
   - 验证 `docs/reference/{version}/heroes/` 目录是否存在
   - 验证 `docs/reference/{version}/abilities_schinese.txt` 是否存在

c) **GitHub Issue**
   - 询问用户是否需要创建 GitHub Issue 来追踪进度
   - 如需创建，使用 `gh` 命令创建 Issue，标题格式：`处理 Dota 2 {version} 更新`
   - Issue 内容应包含受影响英雄的 checklist

### 3. 创建工作分支

```bash
git checkout -b feature/{issue-number}-dota-{version}-update
```

### 4. 逐个处理英雄

对每个需要更新的英雄，执行以下步骤：

#### 4.1 查找英雄在 override 文件中的位置

使用 Grep 搜索英雄名称或技能名称：

```bash
# 搜索英雄技能（使用英文技能名）
grep -n "hero_name_ability_name" game/scripts/npc/npc_abilities_override.txt
```

#### 4.2 读取相关上下文

- 从 override 文件中读取该英雄的技能定义（使用行号范围）
- 从 `docs/reference/{version}/heroes/{hero_name}.txt` 读取官方最新数据
- 如果英雄文件不存在，从 `docs/reference/{version}/abilities_schinese.txt` 搜索技能名

**重要**：override 文件有 14307 行，必须通过技能名精确定位，只读取相关部分

#### 4.3 分析更新内容

对比更新日志中的改动和当前 override 配置：
- 识别哪些属性值被修改
- 判断是否需要调整 override 的数值
- 检查是否有新增/删除的属性

#### 4.4 计算新数值

根据官方新数值和 override 规则计算：
- 如果是等比数列，计算新的第 5 级（或第 4 级）数值
- 如果是短 CD 或百分比，保持最大等级数值
- 确保数值为整数或 5、10 的倍数

#### 4.5 更新 override 文件

使用 Edit 工具更新该英雄的技能定义：
- 保持原有的注释格式
- 如有额外改动，添加或更新注释
- 确保缩进和格式与原文件一致

#### 4.6 提交更改

```bash
git add game/scripts/npc/npc_abilities_override.txt
git commit -m "Update {hero_name} abilities for Dota 2 {version}

- Update {ability_1} values
- Update {ability_2} values
...

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### 4.7 更新 Issue

如果创建了 GitHub Issue，使用 `gh` 命令更新 checklist：
- 标记该英雄为已完成

### 5. 完成后

所有英雄更新完成后：
- 总结更新的英雄数量和主要改动
- 询问用户是否需要创建 Pull Request

## 文件检索技巧

由于文件较长，必须使用精确检索：

1. **在 override 文件中查找**
   ```
   使用 Grep 搜索技能名（英文），output_mode: "content", -B 和 -A 参数获取上下文
   ```

2. **在英雄文件中查找**
   ```
   读取 docs/reference/{version}/heroes/{hero_name}.txt
   使用 Grep 搜索具体技能名
   ```

3. **在中文技能名文件中查找**
   ```
   使用 Grep 搜索 docs/reference/{version}/abilities_schinese.txt
   通过中文注释匹配技能
   ```

## 示例工作流

```
用户: /handle-dota-update

AI: 请提供以下信息：
1. Dota 2 更新版本号（如 7.40）
2. 更新日志 URL（或我可以自动获取）
3. 要更新的英雄列表（或从日志中提取）

用户: 7.40, 需要更新所有受影响的英雄

AI:
1. [WebFetch] 获取 7.40 更新日志
2. [分析] 提取受影响英雄列表: Brewmaster, Lion, Phantom Lancer...
3. [询问] 是否需要创建 GitHub Issue 追踪进度？

用户: 是的

AI:
4. [gh issue create] 创建 Issue #1234
5. [git checkout] 创建分支 feature/1234-dota-7.40-update
6. [处理] Brewmaster
   - [Grep] 查找 brewmaster_thunder_clap 位置
   - [Read] 读取 lines 82-97
   - [Read] 读取 docs/reference/7.40/heroes/npc_dota_hero_brewmaster.txt
   - [分析] 对比数值变化
   - [Edit] 更新 override 文件
   - [Commit] 提交更改
   - [gh issue] 标记 Brewmaster 完成
7. [处理] Lion...
   ...
```

## 注意事项

- ✅ 每次只读取相关的技能定义，不要读取整个 14307 行文件
- ✅ 使用 Grep 精确定位技能位置
- ✅ 保持原有的注释和格式
- ✅ 每个英雄单独 commit
- ✅ 数值计算要符合 override 规则
- ❌ 不要复制 Dota 2 官方的所有属性，只 override 必要的部分
- ❌ 不要修改特殊技能的特殊处理逻辑

## 输出格式

每个英雄处理完成后输出：

```
✅ 已更新: {hero_name}
  - {ability_1}: {主要改动说明}
  - {ability_2}: {主要改动说明}
  - Commit: {commit_hash}
```

全部完成后输出总结：

```
🎉 Dota 2 {version} 更新处理完成

共更新 {count} 个英雄：
- {hero_1}
- {hero_2}
...

是否需要创建 Pull Request 到 develop 分支？
```
