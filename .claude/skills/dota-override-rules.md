---
name: dota-override-rules
description: Dota 2 自定义地图 Override 技能规则。定义技能等级提升、数值调整、KV格式、注释规范等规则。用于处理 Dota 2 更新时的技能数据维护。
---

# Dota 2 Override 规则

本文档定义了 `game/scripts/npc/npc_abilities_override.txt` 中技能数据的维护规则。

---

## 等级提升规则

| 技能类型 | MaxLevel |
|---------|----------|
| 小技能 | 5 级 |
| 大招 | 4 级 |
| 特殊技能 | 单独处理 |

---

## KV 格式规则

- **只填写 override 的内容**，不需要全部复制
- KV 结构遵循 Dota 2 定义
- 如果每级数值不同，需要适配修改后的最大等级

---

## 数值调整规则

### 基本原则

- 通常采用**等差数列**扩展
- 每级数值尽量保持**整数**或 **5、10 的倍数**
- **最大等级数值与官方相同**（重要）

### 扩展规则

扩展到更高等级时：

1. 计算官方数值的等差/等比规律
2. 按规律扩展到第 5 级（小技能）或第 4 级（大招）
3. **最大等级数值保持与官方最大等级相同**

### 保持差异规则

当当前 override 值与旧官方值存在差异时，通常是**有意图的加强或削弱**。

更新时应保持同样的差异：

```
旧官方值: 100 120 140 160
当前 Override: 90 110 130 150  (差异: -10)
新官方值: 110 130 150 170
建议更新: 100 120 140 160  (保持 -10 的差异)
```

**计算方式**：`建议更新 = 新官方值 + (当前Override - 旧官方值)`

### 特殊情况

以下情况保持最大等级数值不变，不扩展：

- 过于短暂的 CD：小技能 5s 以内，大招 60s 以内
- 百分比数值
- radius 的最大范围

### 示例

```
官方 4 级: radius: 150 170 190 210 (等差 20)
扩展到 5 级: 150 165 180 195 210 (等差 15，最大值保持 210)
```

---

## 注释规则

在 value 后添加注释标注官方原数值：

```kv
"value" "150 165 180 195 210" // 150 170 190 210
```

当官方数值更新时，同步更新注释。

---

## 数值数量匹配规则

- 数值个数**必须与 MaxLevel 匹配**
- 如 `MaxLevel=4`，则数值必须有 4 个
- 发现不匹配时需要修正

---

## 文件检索技巧

由于文件较长，必须使用精确检索：

### 在 override 文件中查找

使用 Grep 搜索技能名（英文），`-n` 参数显示行号：

```bash
grep -n "hero_ability_name" game/scripts/npc/npc_abilities_override.txt
```

### 在英雄参考文件中查找

```
docs/reference/{version}/heroes/npc_dota_hero_{hero_name}.txt
```

### 在中文技能名文件中查找

```bash
grep "技能名" docs/reference/{version}/abilities_schinese.txt
```

---

## 注意事项

### ✅ 应该做的

- 每次只读取相关的技能定义，不要读取整个文件
- 使用 Grep 精确定位技能位置
- 保持原有的注释和格式
- 数值计算要符合 override 规则
- 最大等级数值与官方保持相同
- 数值个数必须与 MaxLevel 匹配

### ❌ 不应该做的

- 不要复制 Dota 2 官方的所有属性，只 override 必要的部分
- 不要修改有意加强/削弱的特殊逻辑（除非用户要求）

---

## 技能重做处理

- **属性删除**：官方删除某属性时，删除相关 override block
- **技能移除**：官方移除整个技能时，删除对应 override block
- **与官方值相同**：更新后若与官方值相同，移除该属性（无需 override）

---

## 不需要修改的情况

- 当前 override 已是合理扩展且与新版本兼容
- 机制变更不涉及已 override 的数值
- 未 override 的天赋会自动使用官方新值

---

## 性能优化设计

为防止卡顿，部分技能禁用幻象/召唤物：

```kv
"duration_illusion"  "0"  // 为了防止卡顿，禁用幻象
```

---

## Bot Build 天赋检测

Bot 天赋配置在 `game/scripts/npc/npc_heroes_custom.txt`，需与官方天赋定义匹配。

### 天赋等级对应关系

| 等级 | 官方 Ability |
|-----|-------------|
| 10级 | Ability10, Ability11 |
| 15级 | Ability12, Ability13 |
| 20级 | Ability14, Ability15 |
| 25级 | Ability16, Ability17 |

### Bot Build 加点顺序

- 10/15/20/25 级：每个档位选一个天赋
- 27/28/29/30 级：补全各档位另一侧天赋

### 检测方法

1. 读取 `docs/reference/{version}/npc_heroes.txt` 中英雄的 Ability10-17
2. 读取 `game/scripts/npc/npc_heroes_custom.txt` 中英雄的 Bot Build
3. 验证 10/15/20/25/27/28/29/30 级的天赋是否在对应档位的 Ability 中
