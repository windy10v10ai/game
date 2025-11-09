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

Bot AI 使用基于欲望值的有限状态机: 模式 (Laning/Attack/Retreat/Push) 位于 `ai/mode/`,动作 (Attack/Move/Cast) 位于 `ai/action/`,每 0.3 秒思考一次。

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

### 读取 Dota 2 官方说明:

编写物品/技能说明时，应参考 Dota 2 官方文本以保持术语一致性。

**参考文件位置**:

- 中文: `docs/reference/7.39/abilities_schinese.txt`
- 英文: `docs/reference/7.39/abilities_english.txt`

**使用方法**:

```bash
# 搜索狂战斧的中文说明
grep -A 5 "DOTA_Tooltip_ability_item_bfury_Description" docs/reference/7.39/abilities_schinese.txt

# 搜索狂战斧的英文说明
grep -A 5 "DOTA_Tooltip_ability_item_bfury_Description" docs/reference/7.39/abilities_english.txt
```

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

### 优化 Lua 物品 (`docs/development/optimize-lua-item.md`)

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

### 本地化文件格式指南 (`docs/development/localization-format-guide.md`)

**适用场景**: 维护本地化文件、添加新翻译、同步中英文版本格式

**主要内容**:

- **中文 (`addon_schinese.txt`)**: 必须维护 - 添加所有新键
- **英文 (`addon_english.txt`)**: 必须维护 - 添加所有新键
- **俄文 (`addon_russian.txt`)**: 仅维护现有键 - 不要添加新键
- 格式要求: 缩进和对齐、注释格式、HTML 标签同步
- 语言文件维护策略: 中文、英文、俄文的维护要求
- 添加新的本地化键: 完整的工作流程
- 中文标点符号规范: 全角标点使用规则
- 查找 Dota 2 官方技能名称: 使用参考文件的方法
- 本地化通用规则: 标准变量翻译列表和使用方法
- 中英文版本同步要求: 格式一致性和内容完整性
- Modifier 说明补全: 必须包含的条目和格式

**关键要点**: 使用两个 tab 缩进、注释使用中文、HTML 标签格式需同步、所有 modifier 必须完整

### 物品性能优化 Meta Prompt (`docs/development/item-optimization-meta-prompt.md`)

**适用场景**: 优化物品性能,将 Lua 物品迁移到 DataDriven 实现

**使用方式**:

- **命令方式**: 使用 `/optimize-item` 命令快速调用
- **手动引用**: 在对话中引用该文档

**主要内容**:

- 完整的 meta prompt 指南,用于指导 AI 优化物品
- 核心优化原则:
  - BaseClass 从 `item_lua` 迁移到 `item_datadriven`
  - 静态属性迁移到 DataDriven Properties
  - 最小化 Lua 代码,仅保留特殊逻辑
- 可使用 DataDriven 实现的属性完整列表
- 必须保留在 Lua 中的功能列表 (ABSORB_SPELL 等)
- 详细的优化实施步骤:
  1. 分析现有 Lua 实现
  2. 修改 npc_items_custom.txt (完整 KV 模板)
  3. 重写 Lua 文件 (完整 Lua 模板)
- 代码模式对比 (优化前后结构差异)
- 参考示例: item_beast_armor (基于 PR #1695)
- 完整的代码模板 (可直接使用)

**优化效果**: 减少 Lua 代码量 60-80%,显著降低 CPU 占用,减少卡顿

**使用示例**:

```
/optimize-item item_xxx
```

或

```
请按照 docs/development/item-optimization-meta-prompt.md 中的 Meta Prompt 优化 item_xxx
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
