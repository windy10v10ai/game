---
name: handle-dota-update
description: 处理 Dota 2 破坏性更新对自定义地图 override 的影响（逐个英雄更新技能数据），并遵循 override 规则与对比展示流程。
disable-model-invocation: true
---

# Handle Dota Update

将 Dota 2 版本更新带来的数据变更，同步到本项目的 override 文件与相关配置中。此技能用于**逐个英雄**地定位、对比、更新，并输出可审阅的改动摘要。

## 使用时机

- Dota 2 发生大版本/破坏性更新（例如 7.40、7.41）后，需要维护 `game/scripts/npc/npc_abilities_override.txt`。
- 需要按英雄逐个核对官方 KV 与本项目 override 的差异，并更新扩展等级/数值/注释。

## 前置检查

- 用户应提供：
  - Dota 2 更新版本号（如：7.40）
  - GitHub Issue URL（用于追踪进度，可选但推荐）
  - 需要处理的英雄（按顺序逐个提供）
- 验证参考数据存在：
  - `docs/reference/{version}/heroes/`
  - `docs/reference/{version}/abilities_schinese.txt`

## Override 维护规则（合并自 dota-override-rules）

### 等级提升规则

| 技能类型 | MaxLevel |
| -------- | -------- |
| 小技能   | 5 级     |
| 大招     | 4 级     |
| 特殊技能 | 单独处理 |

### KV 格式规则

- 只填写 **override 的内容**，不需要全部复制官方 KV
- KV 结构遵循 Dota 2 定义
- 若某字段为 **多级 `value`（空格分隔的多个数值）**：**数值个数必须与有效 `MaxLevel` 一致**（含 `AbilityManaCost`、`AbilityCooldown` 等同类多档字段，除非该字段在官方定义中明确为单值或特殊结构）。

### MaxLevel 缺省时的有效等级（用于核对多级 value 个数）

当 **override 与原版参考**（`docs/reference/{version}/heroes/...` 中该技能）**均未**写明 `MaxLevel` 时，用以下规则推断有效等级，用于检查多级 `value` 个数是否正确：

| 条件                                     | 推断的有效 MaxLevel |
| ---------------------------------------- | ------------------- |
| `AbilityType` 为 `ABILITY_TYPE_ULTIMATE` | **3**               |
| 其他                                     | **4**               |

若 **任一侧**（override 或原版）已显式写出 `MaxLevel`，则以 **显式值**为准（本图另有大招 4 级、小技能 5 级等扩展规则时，仍以实际写入的 `MaxLevel` 与数组长度一致为准）。

### 禁止重复原版（无差异不写）

`npc_abilities_override.txt` 的目标是**只表达本图相对当前版本官方的差分**。同步 Dota 更新时，必须对照 `docs/reference/{version}/heroes/npc_dota_hero_{hero}.txt` 里同名技能的官方 KV：

- **键与数值与官方完全一致**：不要写进 override（例如仅当本图需要与官方不同的耗蓝、伤害曲线时才覆盖 `AbilityManaCost`、`AbilityValues` 等）。
- **`AbilityValues` 内子键**：若某字段（含 `special_bonus_*`、`RequiresShard` 等）与官方**逐字相同**，应从 override 中删除该行/该子块，避免无意义重复。
- **整块与官方相同**：若某技能在 override 里已没有任意一条与官方不同的键，应**删除该技能的整个 override 块**。
- **典型误写**（更新后常出现）：把官方已有的 `HasShardUpgrade`、`魔晶/天赋对应的 special_bonus_*` 再抄进 override——若与新版官方一致，**一律删除**。

### 官方删除 / 重构字段时的清理

- 官方在某版本中**删除**某键、或把效果从 **命石 `special_bonus_facet_*`** 改为 **魔晶 `special_bonus_shard`** 等：override 中旧结构必须同步删掉，**不得**保留已废弃的 facet 分支或仅存在于旧 Tooltip 里的键（例如某字段下的 `value` + 已不存在的 `special_bonus_facet_*` 组合）。
- 清理后再次对比：override 中仅应保留「本图仍需要的差分」与「仍有效的扩展等级数组」等。

### 数值调整规则

#### 基本原则

- 优先采用 **等差数列** 扩展
- 每级数值尽量保持 **整数** 或 **5、10 的倍数**

#### 扩展规则（无加强/削弱）

1. 前 4 级保持与官方相同
2. 计算官方数值的等差规律
3. 按等差规律添加第 5 级

#### 加强/削弱规则（override 与官方有意图差异）

当 override 值与官方值存在差异时，视为有意图加强或削弱；Dota 更新时应保持该加强方式，并同步注释。

| 加强方式          | 旧官方值        | 旧值                | 新官方值        | 新值                | 注释                 |
| ----------------- | --------------- | ------------------- | --------------- | ------------------- | -------------------- |
| 固定差异          | 100 120 140 160 | 110 130 150 170 180 | 110 130 150 170 | 120 140 160 180 190 | `// 110 130 150 170` |
| 倍数加强          | 20 25 30 35     | 40 50 60 70 80      | 25 30 35 40     | 50 60 70 80 90      | `// 25 30 35 40 x2`  |
| 调整等差          | 250 350 450     | 250 400 550 700     | 300 400 500     | 300 450 600 750     | `// 300 400 500`     |
| 固定值→随等级增加 | 5               | 10 15 20 25 30      | 6               | 12 18 24 30 36      | `// 6`               |

#### 特殊情况（保持最大等级数值不变）

- 过于短暂的 CD：小技能最大等级 CD ≤ 10s，大招最大等级 CD ≤ 60s
- 百分比数值（仅当最大值 > 50% 时）：如 slow_attack_speed_pct、slow_movement_speed、状态抗性、魔法抗性、最大生命值等
- radius 等固定范围属性

### 注释规则（必须同步）

在 value 后添加注释标注官方原数值；官方数值更新时，**始终同步更新注释为新官方值**，无需询问用户。

```kv
"value" "150 165 180 195 210" // 150 170 190 210
```

### 应该做 / 不应该做

- ✅ 应该做：
  - 使用精确检索定位技能位置，不要读取整个 override 文件
  - **多级 `value` 个数**必须与有效 `MaxLevel` 匹配；无 `MaxLevel` 时按上文「MaxLevel 缺省」规则推断后再核对；不匹配时必须修正
  - 有意加强/削弱时，保持加强方式
  - **属性删除**：官方删除某属性时，删除相关 override block
  - **技能移除**：官方移除整个技能时，删除对应 override block
  - **与官方值相同**：更新后若与官方值相同，移除该属性或整段技能块（见上文「禁止重复原版」）
  - **同步官方重构**：命石/魔晶/天赋键名或结构变化时，删除 override 中过时键，避免双写或与官方重复
- ❌ 不应该做：
  - 不要复制官方所有属性，只 override 必要的部分
  - 不要把「与新版官方完全一致」的键抄进 override「方便对照」——对照应使用 `docs/reference/`，而不是重复进 override 文件

### 文件检索技巧

- 在 override 文件中查找（显示行号）：

```bash
grep -n "hero_ability_name" game/scripts/npc/npc_abilities_override.txt
```

- 英雄参考文件位置：
  - `docs/reference/{version}/heroes/npc_dota_hero_{hero_name}.txt`
- 中文技能名/属性描述：
  - `docs/reference/{version}/abilities_schinese.txt`

## 逐个英雄处理流程（合并自 handle-dota-update）

### 1) 定位英雄与技能

- 在 `game/scripts/npc/npc_abilities_override.txt` 中用技能名/英雄名精确定位，只读取相关片段。

### 2) 读取对比上下文

- 读取 override 文件中该英雄/技能的 KV 片段
- 读取对应 `docs/reference/{version}/heroes/...` 官方 KV 片段
- 必要时读取 `abilities_schinese.txt` 获取中文描述（用于表格可读性）

### 3) 输出对比与建议（给用户审阅）

用表格对比（示例列）：

| 属性 | 旧官方值 | 当前 Override | 新官方值 | 建议更新 |
| ---- | -------- | ------------- | -------- | -------- |

### 4) 交互规则

- 先展示修改汇总表格
- 仅对不确定项提问；若有多方案，给 1/2/3 编号供用户选择
- 注释同步属于确定项：无需询问用户，直接同步为新官方值

### 5) 应用修改

- 修改 override 文件，保持原有缩进和格式
- 修改后再次核对：**多级 `value` 个数**与有效 MaxLevel 匹配（无 `MaxLevel` 时按缺省规则推断）、**与新版官方重复的键已删除**、**官方已删除的 facet/旧键已从 override 移除**、注释已同步

### 6) 提交与汇报

- **只有在用户明确要求提交时才进行 git commit**（否则仅保留工作区改动）
- 每个英雄完成后输出：

```
✅ 已更新: {hero_name}
  - {ability_1}: {主要改动说明}
  - {ability_2}: {主要改动说明}
```

- 全部完成后输出汇总：

```
Dota 2 {version} 更新处理完成
共更新 {count} 个英雄：
- {hero_1}
- {hero_2}
...
```
