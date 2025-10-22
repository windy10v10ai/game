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

### 查找 Dota 2 官方技能名称

当添加项目语言文件中不存在的 Dota 2 技能时,从参考文件中查找官方翻译:

1. **在参考文件中搜索**,位于 `docs/reference/7.39/`:

   - 英文: `abilities_english.txt`
   - 中文: `abilities_schinese.txt`

2. **搜索模式**: 使用技能内部名称(例如 `medusa_split_shot`)查找条目:

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

**注意**: 参考文件来自 Dota 2 版本 7.39,包含所有标准技能的 Valve 官方翻译。

### 在代码中使用

在 XML/Panorama 中引用本地化键:

```xml
<Label text="#my_new_key" />
```

或在 JavaScript/TypeScript 中:

```javascript
$.Localize("#my_new_key");
```

### 文件格式

- 格式: Valve KeyValues (具有特定结构的 `.txt` 文件)
- 编码: UTF-8 with BOM
- **缩进**: 在键和值之间使用 tab,根据键的长度对齐:
  - 短键名(例如 `"max_level"`): 使用 tab 在一致的列对齐值
  - 长键名(例如 `"DOTA_Tooltip_ability_attribute_bonus"`): 使用 tab 保持可读性
  - 示例:
    ```
    "short_key"                    "短文本"
    "DOTA_Tooltip_very_long_key"                                "长键名的文本"
    ```
- 结构:
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

- 功能分支: `feature/{issue-number}-{branch-name}`
- 示例: `feature/123-add-new-hero-ai`

### Pull Request

- 从功能分支创建 PR 到 `develop` 分支(不是 `main`)
- CI 在 PR 上运行: linting → tests → build (参见 `.github/workflows/test.yml`)
- 存在所有者 PR 的自动批准工作流

### 提交

- 遵循现有的提交风格(参见 `git log` 示例)
- PR 会被 squash 合并,因此单个提交消息不如 PR 描述重要
