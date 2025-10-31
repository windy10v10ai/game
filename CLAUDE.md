# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作时的指导。

## 语言偏好

**重要提示:所有响应默认应使用中文(简体中文)**,除非:

- 用户明确要求使用英文回复
- 你正在编写代码、代码注释或提交信息(这些应保持英文)
- 你正在引用技术术语、API 名称或函数名称(这些应保持原始英文形式)

与用户沟通时:

- 使用中文进行解释、总结和一般性交流
- 使用英文编写代码片段、变量名、函数名和技术标识符
- 在讨论代码时可以混合使用中文和英文(解释用中文,代码引用用英文)

## 项目概述

Windy10v10AI 是一个 PVE Dota 2 自定义游戏,具有 10v10 对战、AI 对手和独特的技能抽奖系统。代码库使用 TypeScript 编译为 Lua 作为游戏逻辑(VScripts),使用 React + TypeScript 作为 UI(Panorama)。

## 开发命令

### 安装与设置

```bash
# Install dependencies and link game/content directories to Dota 2 addon folder
npm install

# Note: Code must be on the same hard drive partition as Dota 2
```

### 开发工作流

```bash
# Start Dota 2 Tools and watch mode (most common command)
npm run start

# Build everything (panorama + vscripts)
npm run build

# Watch mode only (without launching Dota 2)
npm run dev

# Build individual components
npm run build:panorama  # Webpack build for UI
npm run build:vscripts  # TSTL compilation to Lua
```

### 测试与质量检查

```bash
# Run Jest tests
npm test

# Lint TypeScript files
npm run lint
npm run lint:fix

# Check code formatting
npm run prettier-check
```

### Dota 2 控制台命令

这些命令在开发期间在 Dota 2 控制台中运行:

```bash
# Launch/relaunch the custom game
dota_launch_custom_game windy10v10ai dota
dota_launch_custom_game windy10v10ai custom

# Reload Lua scripts (hot reload)
script_reload

# Speed up game for testing
host_timescale 2.0

# Show game end panel
dota_custom_ui_debug_panel 7
```

## 代码架构

### 技术栈

- **VScripts (后端)**: TypeScript → Lua,通过 TypeScript-to-Lua (TSTL) 编译
- **Panorama UI (前端)**: React 16.14 + TypeScript → JavaScript,通过 Webpack 构建
- **通信机制**: Custom Net Tables (双向同步) 和 Custom Game Events (客户端→服务器)
- **共享类型**: `src/common/` 中的 TypeScript 接口定义了各层之间的契约

### 目录结构

```
src/
├── vscripts/              # Game logic (TypeScript → Lua)
│   ├── addon_game_mode.ts # Entry point - exports Activate() function
│   ├── ai/                # Bot AI system (30+ files)
│   │   ├── hero/          # Hero-specific AI modifiers (Lion, Viper, Luna, etc.)
│   │   ├── mode/          # FSA modes: Laning, Attack, Retreat, Push
│   │   ├── action/        # Actions: Attack, Move, Cast, Item usage
│   │   └── build-item/    # Item build logic
│   ├── modules/           # Core game systems (registered as GameRules.* singletons)
│   │   ├── lottery/       # Ability lottery system (random ability generation/selection)
│   │   ├── event/         # Event dispatcher (NPC spawn, kills, level up)
│   │   ├── filter/        # Game rule filters (gold/XP modification)
│   │   ├── property/      # Player property/attribute system
│   │   ├── helper/        # Utility helpers (PlayerHelper, UnitHelper, etc.)
│   │   └── ...            # AI, Analytics, GameConfig, Option, Debug
│   ├── modifiers/         # Custom modifiers (PropertyBaseModifier, etc.)
│   ├── api/               # External API client (windy10v10ai.com backend)
│   └── utils/             # TSTL adapters (@registerModifier decorator), dota_ts_adapter
│
├── panorama/              # UI (React + TypeScript → JavaScript)
│   ├── react/
│   │   ├── hud_lottery/   # Ability lottery UI
│   │   │   ├── Lottery.tsx        # Main container with state management
│   │   │   ├── LotteryContainer.tsx
│   │   │   ├── LotteryRow.tsx
│   │   │   ├── LotteryAbilityItem.tsx  # Individual ability cards
│   │   │   └── KeyBind.tsx        # Hotkey binding UI
│   │   └── utils/         # Net table helpers, color definitions
│   ├── tsconfig.json
│   └── webpack.*.js       # Build configurations
│
├── common/                # Shared TypeScript types
│   ├── net_tables.d.ts    # CustomNetTableDeclarations interface
│   ├── events.d.ts        # CustomGameEventDeclarations interface
│   └── dto/               # Data transfer objects (lottery, game state)
│
└── scripts/               # Build automation (Node.js)
    ├── install.js         # Symlinks game/content to Dota 2 addons directory
    ├── launch.js          # Launches Dota 2 Tools if not running
    └── utils.js           # Helper functions (getDotaPath, getAddonName)
```

### 关键架构模式

#### 1. 模块系统 (VScripts)

核心系统实现为注册在 `GameRules` 上的单例类:

```typescript
// In modules/index.ts
export function ActivateModules() {
  if (GameRules.AI == null) GameRules.AI = new AI();
  if (GameRules.Lottery == null) GameRules.Lottery = new Lottery();
  // ... other modules
}
```

通过以下方式访问模块:

- `GameRules.Lottery` - 技能抽奖系统
- `GameRules.AI` - Bot AI 管理
- `GameRules.Event` - 事件分发器
- `GameRules.GoldXPFilter` - 金币/经验修改

#### 2. 基于装饰器的注册

使用 `utils/dota_ts_adapter.ts` 中的装饰器来注册 modifiers 和 abilities:

```typescript
@registerModifier()
export class MyCustomModifier extends BaseModifier {
  // Modifier implementation
}

@registerAbility()
export class MyAbility extends BaseAbility {
  // Ability implementation
}
```

#### 3. AI 状态机 (FSA)

Bot AI 使用基于欲望值的有限状态机进行模式切换:

- **模式**: Laning, Attack, Retreat, Push (每个模式位于 `ai/mode/`)
- **阈值**: 0.5 的欲望值触发模式切换
- **思考间隔**: 0.3 秒执行一次游戏逻辑
- **动作**: Attack, Move, Cast, Item usage (位于 `ai/action/`)

#### 4. 数据流

**服务器 → 客户端 (Net Tables)**:

```typescript
// VScripts (server)
CustomNetTables.SetTableValue("lottery_status", playerId.toString(), data);

// Panorama (client)
CustomNetTables.SubscribeNetTableListener("lottery_status", callback);
const data = CustomNetTables.GetTableValue("lottery_status", playerId);
```

**客户端 → 服务器 (Custom Events)**:

```typescript
// Panorama (client)
GameEvents.SendCustomGameEventToServer("lottery_pick_ability", { name, type, level });

// VScripts (server)
CustomGameEventManager.RegisterListener("lottery_pick_ability", (userId, event) => {
  // Handle ability pick
});
```

### 抽奖系统

技能抽奖是核心功能,玩家可以随机选择技能:

1. **生成** (`modules/lottery/`):

   - 在 PRE_GAME 期间,为每个玩家生成 4 个基础 + 2 个额外的随机技能
   - 分为 1-5 档,不同档位有不同的技能池(定义在 `lottery-abilities.ts` 中)
   - 排除重复的英雄技能和刷新前已选择的技能
   - 发布到 Net Tables: `lottery_active_abilities`, `lottery_passive_abilities`, `lottery_status`

2. **UI** (`panorama/react/hud_lottery/`):

   - 订阅 Net Tables 以响应式更新
   - 显示带有档位颜色的技能卡片
   - 通过 `lottery_pick_ability` 自定义事件处理选择
   - 支持折叠/展开和热键绑定

3. **应用**:
   - 服务器接收选择事件,为玩家应用 modifier
   - 更新 `lottery_status` Net Table
   - UI 自动更新以显示已选择状态

### 测试

- **框架**: Jest 配合 ts-jest preset
- **测试文件**: 与源代码同位置的 `*.test.ts` 文件(例如 `gold-xp-filter.test.ts`)
- **模拟**: 在测试中通过 `global.GameRules = { ... }` 模拟 Dota 全局变量
- **运行**: `npm test` 执行所有测试并生成覆盖率报告

### 构建系统

- **VScripts**: TSTL 编译器(使用 `tsconfig.json` 配置 `luaTarget: "JIT"`)

  - 输出: `game/scripts/vscripts/`
  - 插件: `@moddota/dota-lua-types/transformer` 提供类型支持
  - 启用 source maps 用于调试

- **Panorama**: Webpack 配合自定义插件
  - 输出: `content/panorama/scripts/custom_game/`
  - 加载器: ts-loader, babel-loader, less-loader
  - `PanoramaTargetPlugin` 用于转换为 Valve 格式
  - 启用 tree-shaking 和文件系统缓存

### 符号链接设置

`npm install` 的 postinstall 脚本 (`src/scripts/install.js`) 创建 junction 符号链接:

- `game/` ↔ `{dota_path}/game/dota_addons/windy10v10ai/`
- `content/` ↔ `{dota_path}/content/dota_addons/windy10v10ai/`

这使项目可以自动与 Dota 2 的 addon 目录同步。

## 开发指南

### 修改 VScripts (游戏逻辑) 时:

1. `src/vscripts/` 中的所有 TypeScript 文件会编译为 Lua
2. 使用 `@registerModifier()` 和 `@registerAbility()` 装饰器进行自动注册
3. 从 `utils/dota_ts_adapter.ts` 扩展 `BaseModifier`、`BaseAbility` 或 `BaseItem`
4. 通过 `GameRules.*` 单例访问模块(例如 `GameRules.Lottery.refresh()`)
5. 开发期间在 VConsole 中使用 `script_reload` 进行热重载
6. 在 `*.test.ts` 文件中使用 Jest 编写测试(根据需要模拟 Dota 全局变量)

### 修改 Panorama UI 时:

1. React 组件位于 `src/panorama/react/`
2. 使用 `panorama/react/utils/net-table.ts` 中的 Net Table 辅助函数
3. 订阅 Net Tables 以响应式更新数据
4. 通过 `GameEvents.SendCustomGameEventToServer()` 发送事件
5. 路径别名 `@utils/*` 映射到 `panorama/react/utils/*`
6. Panorama UI 使用 React 16.14 配合函数式组件和 hooks

### 添加新的共享类型时:

1. 添加到 `src/common/` 用于 VScripts 和 Panorama 之间共享的类型
2. 更新 `net_tables.d.ts` 以添加新的 Net Table 键
3. 更新 `events.d.ts` 以添加新的自定义事件
4. 在 `common/dto/` 中为复杂数据结构创建 DTO

### 修改 AI 时:

1. 英雄特定 AI: 在 `src/vscripts/ai/hero/` 中添加/修改 modifiers
2. 所有英雄 AI 扩展 `BotBaseAIModifier` 并实现 `OnIntervalThink()` (0.3秒间隔)
3. 模式: 在 `ai/mode/` 中实现 `GetDesire()` (返回 0-1 的浮点数)
4. 动作: 在 `ai/action/` 中添加可重用的行为(attack, move, cast)
5. 物品构建: 在 `ai/build-item/` 中定义

### 常见陷阱:

- **符号链接在错误的分区**: 代码必须与 Dota 2 在同一硬盘分区
- **缺少 Lua 重载**: VScript 更改后在 VConsole 中使用 `script_reload`
- **Net Table 类型不匹配**: 布尔值以 0/1 传输,使用辅助转换
- **Webpack 缓存**: 如果构建输出看起来过时,删除 `node_modules/.cache`
- **行尾符**: TypeScript 文件使用 LF (Unix) 而不是 CRLF (Windows)

## 开发文档索引

`docs/development/` 目录包含详细的开发指南和最佳实践文档。在处理相关任务时,请参考这些文档:

### API 使用文档 (`docs/development/api-usage.md`)

**适用场景**: 实现 API 调用、与后端集成、添加分析事件

**主要内容**:

- API 架构概览和目录结构
- ApiClient 核心组件使用方法
- 认证机制 (API Key 方式)
- 两种 API 调用模式:
  - 模式 1: 静态方法调用 (一次性数据发送)
  - 模式 2: 事件监听 + 数据收集 + 延迟发送 (批量数据发送)
- 现有 API 端点列表和参数结构

**关键示例**: 游戏结束时发送技能选择数据、收集并发送玩家语言信息

### DataDriven 实现指南 (`docs/development/data-driven-implementation-guide.md`)

**适用场景**: 将传统 Lua modifier 迁移到 DataDriven 实现、优化 modifier 性能

**主要内容**:

- DataDriven vs Lua Modifier 对比和混合架构原则
- 完整的迁移步骤 (以 item_magic_sword 为例)
- DataDriven 配置结构详解 (AbilityValues, OnSpellStart, Modifiers 等)
- Lua 函数实现最佳实践
- 关键经验:
  - 事件选择 (OnAttackLanded vs OnTakeDamage)
  - 参数传递和 Modifier 管理
  - 伤害计算优化和特效管理
- 常见问题排查

**核心原则**: DataDriven 处理简单属性和事件,Lua 处理复杂逻辑

### 优化物品 Modifiers (`docs/development/optimize-item-modifiers.md`)

**适用场景**: 减少游戏卡顿、优化物品性能、处理大量物品属性

**主要内容**:

- 核心思路: 将静态属性从 Lua 迁移到 DataDriven
- 详细示例: 阿迪王 (item_adi_king) 的优化过程
- 可优化的属性类型完整列表:
  - 基础属性 (力量、敏捷、智力)
  - 攻击相关 (攻击力、攻击速度、攻击距离)
  - 防御相关 (护甲、魔抗、闪避)
  - 移动相关 (移动速度、转身速率)
  - 生命/魔法相关 (生命值、魔法值、恢复)
  - 法术相关 (法术增强)
- 标准优化步骤:
  1. 识别需要优化的属性
  2. 在 npc_items_modifier.txt 中添加 DataDriven modifier
  3. 修改 Lua 代码 (清空 DeclareFunctions、添加 OnRefresh 逻辑)
  4. 清理不必要的属性读取
- 适合/不适合优化的场景判断标准
- 优化原则: 静态用 DataDriven,动态用 Lua

**重要提示**: 只优化列表中的属性,保持代码简洁,不保留已删除函数的注释

## 本地化

语言文件位于 `game/resource/`,使用 Valve 的 KeyValues 格式:

### 语言文件维护策略

- **中文 (`addon_schinese.txt`)**: 必须维护 - 添加所有新键
- **英文 (`addon_english.txt`)**: 必须维护 - 添加所有新键
- **俄文 (`addon_russian.txt`)**: 仅维护现有键 - 不要添加新键

### 添加新的本地化键

当添加需要翻译的新 UI 元素或文本时:

1. **添加到中文文件** (`addon_schinese.txt`):

   ```
   "my_new_key"    "我的新文本"
   ```

2. **添加到英文文件** (`addon_english.txt`):

   ```
   "my_new_key"    "My New Text"
   ```

3. **不要添加到俄文文件** (`addon_russian.txt`) - 仅在键已存在时更新

### 中文标点符号规范

**重要**: 中文本地化文本必须使用全角标点符号，不要使用半角标点符号。

**常用全角标点对照表**：

- ✅ 逗号：`，` (全角) ❌ `,` (半角)
- ✅ 句号：`。` (全角) ❌ `.` (半角)
- ✅ 冒号：`：` (全角) ❌ `:` (半角)
- ✅ 分号：`；` (全角) ❌ `;` (半角)
- ✅ 问号：`？` (全角) ❌ `?` (半角)
- ✅ 感叹号：`！` (全角) ❌ `!` (半角)

**示例**：

```
// ❌ 错误 - 使用了半角标点
"item_description"    "主动: 一念成佛。持续 4 秒,造成伤害。"

// ✅ 正确 - 使用全角标点
"item_description"    "主动：一念成佛。持续 4 秒，造成伤害。"
```

**注意**：

- 数字和英文字母保持半角
- 百分号 `%`、括号 `()` 等特殊符号根据上下文判断（通常保持半角）
- HTML 标签和变量占位符（如 `%active_duration%`）保持原样

### 查找 Dota 2 官方技能名称

当添加项目语言文件中不存在的 Dota 2 技能时，从参考文件中查找官方翻译：

1. **在参考文件中搜索**，位于 `docs/reference/7.39/`：

   - 英文：`abilities_english.txt`
   - 中文：`abilities_schinese.txt`

2. **搜索模式**：使用技能内部名称(例如 `medusa_split_shot`)查找条目：

   ```
   English: "DOTA_Tooltip_ability_medusa_split_shot"    "Split Shot"
   Chinese: "DOTA_Tooltip_ability_medusa_split_shot"    "分裂箭"
   ```

3. **示例工作流**:

   ```bash
   # Search for the ability name in reference files
   grep "luna_moon_glaive" docs/reference/7.39/abilities_english.txt
   grep "luna_moon_glaive" docs/reference/7.39/abilities_schinese.txt

   # Results will show:
   # English: "DOTA_Tooltip_ability_luna_moon_glaive"    "Moon Glaives"
   # Chinese: "DOTA_Tooltip_ability_luna_moon_glaive"    "月刃"
   ```

**注意**：参考文件来自 Dota 2 版本 7.39，包含所有标准技能的 Valve 官方翻译。

### 本地化通用规则

**重要**：在对数值进行描述时，如果有标准通用翻译，应该使用它替代直接文本。

**规则示例**：

❌ **错误** - 直接使用文本：

```
"DOTA_T_ability_item_time_gem_manacost_reduction"    "%+魔法消耗降低"
```

✅ **正确** - 使用标准通用翻译：

```
"DOTA_Tooltip_ability_item_time_gem_manacost_reduction"    "%+$manacost_reduction"
```

**标准通用变量翻译列表**：

以下列表中的变量可以在工具提示中使用，系统会自动用对应的中文文本替换 `$variable_name`：

| 中文文本                                              | 变量名                           |
| ----------------------------------------------------- | -------------------------------- |
| 生命值                                                | `$health`                        |
| 魔法值                                                | `$mana`                          |
| 护甲                                                  | `$armor`                         |
| 攻击力                                                | `$damage`                        |
| 力量                                                  | `$str`                           |
| 智力                                                  | `$int`                           |
| 敏捷                                                  | `$agi`                           |
| 全属性                                                | `$all`                           |
| 主属性                                                | `$primary_attribute`             |
| 攻击速度                                              | `$attack`                        |
| 基础攻击速度                                          | `$attack_pct`                    |
| 生命恢复                                              | `$hp_regen`                      |
| 吸血                                                  | `$lifesteal`                     |
| 魔法恢复                                              | `$mana_regen`                    |
| 魔法恢复光环                                          | `$mana_regen_aura`               |
| 技能伤害                                              | `$spell_amp`                     |
| 负面状态持续时间                                      | `$debuff_amp`                    |
| 移动速度                                              | `$move_speed`                    |
| 闪避                                                  | `$evasion`                       |
| 魔法抗性                                              | `$spell_resist`                  |
| 技能吸血                                              | `$spell_lifesteal`               |
| 对英雄的攻击                                          | `$spell_lifesteal_hero_attacks`  |
| 对英雄的技能                                          | `$spell_lifesteal_hero_spells`   |
| 对非英雄的攻击                                        | `$spell_lifesteal_creep_attacks` |
| 对非英雄的技能                                        | `$spell_lifesteal_creep_spells`  |
| 对英雄的攻击                                          | `$lifesteal_hero_attacks`        |
| 对英雄的技能                                          | `$lifesteal_hero_spells`         |
| 对非英雄的攻击                                        | `$lifesteal_creep_attacks`       |
| 对非英雄的技能                                        | `$lifesteal_creep_spells`        |
| 所选属性                                              | `$selected_attribute`            |
| 攻击距离<font color='#7d7d7d'>（仅对远程有效）</font> | `$attack_range`                  |
| 攻击距离<font color='#7d7d7d'>（仅对近战有效）</font> | `$attack_range_melee`            |
| 攻击距离<font color='#7d7d7d'>（近战/远程）</font>    | `$attack_range_all`              |
| 施法距离                                              | `$cast_range`                    |
| 状态抗性                                              | `$status_resist`                 |
| 弹道速度                                              | `$projectile_speed`              |
| 魔法消耗降低                                          | `$manacost_reduction`            |
| 冷却时间减少                                          | `$cooldown_reduction`            |
| 额外最大魔法值                                        | `$max_mana_percentage`           |
| 减速抗性                                              | `$slow_resistance`               |
| 作用范围加成                                          | `$aoe_bonus`                     |
| 移动速度加成                                          | `$exclusive_movespeed`           |
| 对外治疗增强                                          | `$healing_amp`                   |

**使用方法**：

在工具提示中使用变量名而不是直接文本：

```
"DOTA_Tooltip_ability_item_time_gem_manacost_reduction"    "%+$manacost_reduction"
"DOTA_Tooltip_ability_item_example_damage"                "+$damage"
"DOTA_Tooltip_ability_item_example_attributes"            "+$str / $agi / $int 属性"
```

系统会自动将 `$variable_name` 替换为对应的本地化文本。

### 在代码中使用

在 XML/Panorama 中引用本地化键：

```xml
<Label text="#my_new_key" />
```

或在 JavaScript/TypeScript 中:

```javascript
$.Localize("#my_new_key");
```

### 文件格式

- 格式：Valve KeyValues (具有特定结构的 `.txt` 文件)
- 编码：UTF-8 with BOM
- **缩进**：在键和值之间使用 tab，根据键的长度对齐：
  - 短键名(例如 `"max_level"`)：使用 tab 在一致的列对齐值
  - 长键名(例如 `"DOTA_Tooltip_ability_attribute_bonus"`)：使用 tab 保持可读性
  - 示例：
    ```
    "short_key"                    "短文本"
    "DOTA_Tooltip_very_long_key"                                "长键名的文本"
    ```
- 结构：
  ```
  "lang"
  {
      "Language"  "schinese"  // or "english", "russian"
      "Tokens"
      {
          "key_name"    "translated text"
      }
  }
  ```

## Git 工作流

### 分支命名

- 功能分支：`feature/{issue-number}-{branch-name}`
- 示例：`feature/123-add-new-hero-ai`

### Pull Request

- 从功能分支创建 PR 到 `develop` 分支(不是 `main`)
- CI 在 PR 上运行：linting → tests → build (参见 `.github/workflows/test.yml`)
- 存在所有者 PR 的自动批准工作流

### 提交

- 遵循现有的提交风格(参见 `git log` 示例)
- PR 会被 squash 合并，因此单个提交消息不如 PR 描述重要

### 更新日志格式

发布新版本时，需要提供中英文更新日志，格式如下：

**中文更新日志**：

```
[b]游戏性更新 v4.00[/b]

修正一些bug和平衡性改动。
```

**英文更新日志**：

```
[b]Gameplay update v4.00[/b]

Fixed some bugs and balance.
```

**格式要点**：

- 使用 BBCode 标签 `[b]...[/b]` 加粗标题
- 标题格式：`游戏性更新 v版本号` (中文) / `Gameplay update v版本号` (英文)
- 版本号格式：
  - 主要版本：`v4.00`, `v5.00` (两位小数)
  - Patch 更新：`v4.00a`, `v4.00b`, `v4.00c` (使用字母后缀)
- 标题与内容之间空一行
- 内容简明扼要，描述主要更新内容
- 中文使用全角标点符号，英文使用半角标点符号

**更新类型**：

- 游戏性更新 / Gameplay update - 平衡性改动、功能调整、bug 修复
- 内容更新 / Content update - 新英雄、新物品、新功能
- 重大更新 / Major update - 大型功能更新或重构

**相关文件**：

- 自动化 PR 创建：`.github/workflows/create_release_pr.yml`
