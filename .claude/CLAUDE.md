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
```

### 测试与质量检查

```bash
# Run Jest tests
npm test

# Lint TypeScript files
npm run lint
npm run lint:fix
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

#### 模块系统 (VScripts)

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

#### 数据流

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

- **Net Table 类型不匹配**: 布尔值以 0/1 传输,使用辅助转换
- **Webpack 缓存**: 如果构建输出看起来过时,删除 `node_modules/.cache`
- **行尾符**: TypeScript 文件使用 LF (Unix) 而不是 CRLF (Windows)

### Dota 2 参考文件速查

`<version>` 取 `docs/reference/` 下最新数字版本目录。

| 用途 | 路径 |
|------|------|
| 原版技能（合并本） | `docs/reference/<version>/npc_abilities.txt` |
| 原版技能（按英雄） | `docs/reference/<version>/heroes/npc_dota_hero_<hero>.txt` |
| 英雄列表及技能槽位 | `docs/reference/<version>/npc_heroes.txt` |
| 原版英文说明 | `docs/reference/<version>/abilities_english.txt` |
| 原版中文说明 | `docs/reference/<version>/abilities_schinese.txt` |
| Override KV | `game/scripts/npc/npc_abilities_override.txt` |
| 抽奖技能 KV | `game/scripts/npc/npc_abilities_custom_lottery.txt` |
| 单位/英雄专属技能 KV | `game/scripts/npc/npc_abilities_custom.txt` |
| addon 英文本地化 | `game/resource/addon_english.txt` |
| addon 简体中文本地化 | `game/resource/addon_schinese.txt` |

#### 技能系统名查找

用户给出**技能系统名**（如 `dragon_knight_dragon_blood`）时直接使用。

用户给出**中文名**（如「龙血」「幻影之矛」）或**英雄名-技能名**（如「幻影刺客-幻影之矛」）时：
1. 在 `abilities_schinese.txt` 中搜索中文技能名（匹配 `_Description` 行的上一行或 Tooltip 名称行）
2. 提取匹配行的 key 中的技能系统名（`DOTA_Tooltip_ability_{系统名}` → `{系统名}`）
3. 如有多个候选，用 `AskUserQuestion` 展示候选项让用户确认

用户给出**英雄名**时，在 `npc_heroes.txt` 中用中/英文关键词搜索英雄 ID，再从对应英雄文件读取技能槽位。

#### 读取 Dota 2 官方说明

编写物品/技能说明时，应参考 Dota 2 官方文本以保持术语一致性。

```bash
# 搜索技能中文说明（先用中文名定位系统名）
grep "龙血" docs/reference/<version>/abilities_schinese.txt
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_schinese.txt

# 搜索英文说明
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_english.txt
```

### 查阅 Dota 2 VScript / 引擎 Lua API（函数签名、参数）

**适用场景**: 编写或修改 `game/scripts/vscripts/` 下的纯 Lua、或任意调用 `GameRules` / 单位 / 技能等引擎绑定 API 的代码；出现「参数个数/类型不符」等运行时错误时，应优先对照在线 API，而不是只猜 TypeScript 类型。

**主文档（检索入口）**: [ModDota API · vscripts](https://moddota.com/api/#/vscripts)

## Git 工作流

### 分支命名

- 功能分支：`feature/{issue-number}-{branch-name}`
- 示例：`feature/123-add-new-hero-ai`

### Pull Request

使用模板创建 PR，模板文件为 `.github/pull_request_template.md`。
分支名匹配 `^feature/(\\d+)` 时，提取 `issue-id` 作为 Issue 段。
Release Note 段按照 `.claude/skills/changelog/SKILL.md` 文件的规则生成。

### 提交

创建 git commit 时，只写**简短的单行标题**，不写正文、不写 bullet、不写详细说明。标题控制在 72 字符以内。

## Skill 交互规范

执行 skill 时，**遇到不明确的决策点必须用 `AskUserQuestion` 工具以选项菜单形式询问用户**，不得自行假设。适用场景包括但不限于：

- 目标文件有多个候选（如抽奖池 vs 单位专属）
- 操作模式不明确（新建 vs 修正）
- 原版技能信息无法确定（多个候选、版本差异等）

每道问题单独一次 `AskUserQuestion` 调用，`options` 列出具体候选项并附简短说明。
