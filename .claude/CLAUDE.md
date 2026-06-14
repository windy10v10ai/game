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

# Build checks (run before committing to catch compile errors)
npm run build:panorama   # Webpack build for Panorama UI
npm run build:vscripts   # TSTL build for VScripts (TypeScript → Lua)
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
│   │   ├── shared/        # 跨 entry 共享：通用组件 / hooks / 设计 token
│   │   │   ├── components/  # AppButton, Dialog, Modal, TabNavigation, ...
│   │   │   ├── hooks/       # useNetTable, useClientEvent
│   │   │   └── styles/      # tokens.less, buttons.less, dialog.less
│   │   ├── hud_lottery/   # 常驻 HUD 浮窗：技能抽奖
│   │   └── hud_main/      # 中心化界面容器（home/shop/achievements 等）
│   │       ├── HudMain.tsx       # 顶层 Provider 组合
│   │       ├── router/           # PageRouter + PageId 类型
│   │       ├── store/            # NavigationContext / DialogContext
│   │       ├── components/       # 常驻入口按钮等容器级组件
│   │       ├── pages/            # 各页面（home / shop / profile / ...）
│   │       │   └── profile/      # 页面 = 文件夹；样式与拥有者同级
│   │       │       ├── ProfilePage.tsx
│   │       │       ├── styles.less        # 聚合入口（layout.xml 引用此文件）
│   │       │       ├── layout.less        # 页面外框 / Tab 导航 / 内容区
│   │       │       ├── stats.less         # Stats Tab + 占位样式
│   │       │       └── tabs/
│   │       │           ├── StatsTab.tsx   # 单文件 tab 直接放 tabs/
│   │       │           └── member/        # 复杂 tab 拆为子目录，自带 styles.less
│   │       │               ├── index.ts
│   │       │               ├── MemberTab.tsx
│   │       │               ├── StatusPage.tsx
│   │       │               ├── SubscribePage.tsx
│   │       │               ├── ClickablePanel.tsx
│   │       │               ├── constants.ts
│   │       │               └── styles.less
│   │       └── dialogs/          # ConfirmDialog + useConfirm
│   ├── utils/             # 全局 utils（@utils/* 别名指向这里）
│   └── webpack.{dev,prod}.js
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
- **测试范围**: 只验证自己写的状态/分支逻辑。Dota 原生 API（`CreateUnitByName` / `ParticleManager.*` / `EmitSoundOn` / `UTIL_Remove` / `AddNewModifier` 等）mock 作为占位防崩，不要用 `toHaveBeenCalledWith` 断言它们的参数——那是在测引擎契约不是自己的代码
- **不为强依赖引擎 API 的逻辑过度搭 mock**: 当一段逻辑严重依赖一串 Dota API 行为（如 `AddAbility`→`GetMaxLevel`→`SetLevel` 的等级同步）时，**不要**为了覆盖它而搭建可控 mock 配置（如给 fake 注入 maxLevel 映射、构造多种引擎返回值）去测引擎行为。这类运行时行为由作者手动在 Dota tools 确认。mock 只保留占位防崩（返回个固定值不崩即可）

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

### Panorama UI 架构

**两类 entry 的边界**：

- **常驻 HUD 浮窗**（`hud_lottery` 等）：独立 webpack entry + layout.xml，常驻屏幕一角，与游戏 HUD 并存。
- **中心化界面**（`hud_main`）：单一 entry，内部用 `PageRouter` 切换 home / shop / achievements 等页面。新增"模态/中心化界面"应作为 hud_main 的页面，**不开新 entry**。

**跨 entry 通信**：

```ts
// 任意 entry → 唤起 hud_main 的某个页面
// 通过服务端广播给所有客户端，接收端用 playerId 过滤只响应本地玩家
GameEvents.SendCustomGameEventToAllClients('hud_open_page', { page: 'home', playerId: Game.GetLocalPlayerID() });
```

`hud_main` 的 `NavigationProvider` 通过 `GameEvents.Subscribe('hud_open_page', ...)` 监听，过滤 `playerId === Game.GetLocalPlayerID()` 后切换 currentPage。事件类型在 `src/common/events.d.ts` 的 `CustomGameEventDeclarations` 中声明。

`param` 支持 `'tab:subTab'` 复合格式定位一级 tab 内的子页：页面组件用 `split(':')` 拆解，将 subTab 透传给 tab 组件（如 `ProfilePage` 把 `'member:points'` 拆出后传给 `MemberTab` 的 `initialSubTab`）。

**通用资源位置**：

- 通用组件 / 对话框骨架：`src/panorama/react/shared/components/`
- 通用 hooks（net table 订阅、客户端事件订阅）：`src/panorama/react/shared/hooks/`
- 设计 token / 通用 class（`.btn-primary` `.modal-panel` 等）：`src/panorama/react/shared/styles/`，通过 `<include src="../shared/styles/index.less" />` 引入到任意 entry 的 layout.xml
- 路径别名 `@utils/*` 指向 `src/panorama/utils/`（**不是** `react/utils`）

**hud_main 页面拆分约定**（避免单文件膨胀）：

- 每个页面是 `pages/<name>/` 一个文件夹，至少包含 `<Name>Page.tsx` 和 `styles.less`（聚合入口）
- 简单 tab：`tabs/<TabName>.tsx` 单文件，样式归并到页面级 less 中（如 `pages/profile/stats.less`）
- 复杂 tab（>200 行 / 含多个子页 / 多个内部组件）：拆为 `tabs/<tabName>/` 子目录，按职责分文件（顶层 `Tab.tsx` + 各 `*Page.tsx` + 共享 `*.tsx` + `constants.ts` + 自带 `styles.less`），通过 `index.ts` 重新导出
- **样式与拥有者同级**：页面级样式（外框/导航/单文件 tab）直接放页面根目录；复杂 tab 的样式跟随其子目录。页面根 `styles.less` 仅用 `@import` 聚合，layout.xml 仍只引用此一个文件
- 仅当前 tab 用到的子组件留在该 tab 文件夹内（不下沉到 `shared/`）；跨 tab 复用才考虑提到 `shared/`

### 修改 Panorama UI 时:

1. React 组件位于 `src/panorama/react/`
2. 使用 `src/panorama/utils/net-table.ts` 或 `shared/hooks/useNetTable` 处理 Net Table 订阅
3. 通过 `GameEvents.SendCustomGameEventToServer()` 发送服务端事件；UI 间通信用 `GameEvents.SendEventClientSide()`
4. Panorama UI 使用 React 16.14 配合函数式组件和 hooks

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
- **KV 文件格式**: `game/scripts/npc/` 目录下所有 `.txt` 文件必须全程使用 **tab**，包括行首缩进以及 key 与 value 之间的对齐间距，不得使用空格
- **新建 KV 文件**: 在 `game/scripts/npc/` 下新建任何 `.txt` 文件后，必须在 `npc_abilities_custom.txt`（或对应的主入口文件）顶部添加 `#base "<filename>.txt"` 引入，否则引擎不会加载该文件
- **本地化文件模块顺序**: `addon_english.txt` / `addon_schinese.txt` 中各模块的排列顺序为：Custom Abilities（自定义技能）→ Awaken Abilities（觉醒技能）→ Heroes Override（原版英雄技能）
- **TSTL 对象 spread 不可传 undefined**: 在 `src/vscripts/` 中**禁止**对可能为 `undefined` 的对象使用 spread（`{ ...maybeUndefined }` 或 `{ ...obj?.maybeUndefined }`）。TSTL 把对象 spread 编成 `__TS__ObjectAssign`，内部用 `pairs(...)` 遍历每个参数，传到 `nil` 会运行时 crash `bad argument #1 to 'pairs' (table expected, got nil)`。改用显式 if 判断 + 手动赋值，或用 `?? {}` 兜底后再 spread。jest 测试不会暴露此问题，必须在 Dota tools 实跑验证
- **VScripts 验证时机**: 不要在每次修改 `src/vscripts/` 后都自动运行 `npm run build:vscripts`；用户的开发环境会自动编译。仅在创建 PR 前、最终完成前，或用户明确要求验证时统一运行一次。验证时只看 TS/TSTL 是否报错，**不要去读 `game/scripts/vscripts/` 下编译生成的 `.lua` 产物**对照（浪费时间，产物是 TSTL 自动生成的）。运行时行为靠 jest（自己的分支逻辑）+ Dota tools 实跑验证
- **TSTL 枚举用 normalized 成员名**: `src/vscripts/` 中引用 Dota 枚举成员时去掉原生前缀（`UF_` / `DOTA_` 等），如 `UnitFilterResult.FAIL_CUSTOM`（**不是** `UF_FAIL_CUSTOM`）、`UnitFilterResult.SUCCESS`。TSTL 编译时会自动内联回 Lua 原生名（`UF_FAIL_CUSTOM`）。用带前缀的名字 TS 会报 `Property 'UF_XXX' does not exist`
- **施法错误飘字须 CastFilterResult + GetCustomCastError 配套**: 自定义物品/技能要在施法前拦截并飘字提示时，仅实现 `GetCustomCastError()` 无效——引擎只在 `CastFilterResult()` 返回 `UnitFilterResult.FAIL_CUSTOM` 时才去取错误文本。两者须配套（用同一判据）。错误文本 key 在本地化文件中**定义不带 `#`**（如 `dota_hud_error_xxx`），代码返回时**带 `#`**（`#dota_hud_error_xxx`）
- **新建 Net Table 必须双注册**: 在 `src/common/net_tables.d.ts` 的 `CustomNetTableDeclarations` 加类型只是 TS 契约，引擎运行时还要在 `game/scripts/custom_net_tables.txt` 注册表名，否则服务端 `SetTableValue` 会报 `Unknown custom nettable` 且客户端永远收不到。改完后必须**重启 Dota Tools**（script_reload 不重读 KV）
- **Net Table 清行不能传 nil**: `CustomNetTables.SetTableValue(table, key, nil)` 在 Dota 引擎下是 **noop**，不会删除或同步空值给客户端。如需清行，传**空 table**（数组类用 `[]`、对象类用 `{}`），客户端 `Object.values(value).length === 0` 即可识别为空
- **React Panorama 条件返回不同 panel 结构会渲染失败**: 在 React 组件中根据状态返回**完全不同的 JSX 结构**（例如 `if (empty) return <Panel collapse />; return <Panel>...复杂子树...</Panel>;`）会导致 panel 在 Panorama DOM 中始终缺失。改为**始终渲染同一 panel 树**，用 `style={{ visibility: cond ? 'visible' : 'collapse' }}` 切换显隐

### 图片资源管理

**三类图片，存放位置不同：**

> **先判断是否需要放 png**：若 `AbilityTextureName` 引用的是 **Dota2 已有的原版 texture**（原版技能/物品名），直接写名字引用即可，**无需**放任何 png；只有**自定义图标**才需把 png 放进下面的目录。自定义图标来源是从 Dota2 自带 texture 资源（解包 `.vtex_c`）提取或自制的同名 `.png`。

#### 技能图标（`AbilityTextureName`，技能 `ability_xxx`）

放在 `game/resource/flash3/images/spellicons/<name>.png`，KV 中直接用文件名引用：

```
"AbilityTextureName"    "axe_auto_culling_blade"
```

引擎会自动在 `spellicons/` 目录下查找同名 `.png`，**不需要**注册到 `images.xml`。

#### 物品图标（`AbilityTextureName`，物品 `item_xxx`）

放在 `game/resource/flash3/images/items/<name>.png`，机制与技能图标相同：

```
"AbilityTextureName"    "awaken_stone"
```

引擎自动在 `items/` 目录下查找同名 `.png`，**不需要**注册到 `images.xml`。图标名建议与物品名去掉 `item_` 前缀保持一致。

#### Panorama UI 图片

放在 `content/panorama/images/custom_game/<module>/`，按功能模块分二级目录（如 `lottery/`、`profile/`、`battlepass/` 等）。

**新增图片步骤**：

1. 文件放到对应二级目录，命名小写下划线，前缀按类型（`icon_` `bg_` `frame_` `decor_`）
2. 在 `content/panorama/layout/custom_game/images.xml` 隐藏 Panel 内加一行 `<Image>` 声明（id 在该文件内唯一），用于触发 `.vtex_c` 编译
3. **不再**为每张图创建单独的 `<name>.xml` 编译壳

**引用方式**：在 React 或 less 中用 `file://{images}/custom_game/<module>/<file>.png`。

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
| 原版物品参考 | `docs/reference/<version>/items.txt` |
| 克隆升级物品 KV | `game/scripts/npc/npc_items_clone.txt` |
| 觉醒技能 KV | `game/scripts/npc/npc_abilities_custom_awaken.txt` |
| addon 英文本地化 | `game/resource/addon_english.txt` |
| addon 简体中文本地化 | `game/resource/addon_schinese.txt` |
| addon 俄文本地化 | `game/resource/addon_russian.txt` |

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

## KV Configuration

技能射程、伤害值及其他可调参数一律从 KV 文件**动态读取**，不要硬编码已存在于 KV 中的数值。

- **让 tooltip 计入技能增强**：某条 `AbilityValues` 数值想在游戏中按住 ALT 时显示「被技能增强放大后」的值，在该数值块内加 `"CalculateSpellDamageTooltip" "1"`（**不是** `affected_by_spell_amplify`，没有这个字段）。原版默认多为 `"0"`（不计入）。配套字段：`"DamageTypeTooltip"`（伤害类型）、`"display_type"`（如 `kMagicalDamagePercentage` 百分比显示）。

## 本地化文案规约

改 `addon_schinese.txt` / `addon_english.txt`（及 UI 的 `addon_russian.txt`）时**必须**遵守（几乎每个任务都涉及，勿遗漏）：

- 中英文**同时**增删，内容与格式完全一致
- 两个 tab 缩进，键值多 tab 对齐；颜色代码**大写**
- 注释用**中文**且中英一致；HTML 标签与换行（`\n` 分段、`<br><br>` 段内换行）中英一致
- **文案不用分号**（`；`/`;`），句间用逗号或句号
- `_Description` **不复述已单独成行的数值**：若已有 `_xxx`（带冒号的数值标签行）单独条目，正文就不再写 `%xxx%` 复述；仅当该数值无单独条目时才内联 `%xxx%`
- **UI 键**（按钮/标签/提示等 Panorama 文本）需同步**俄文**；技能/物品/游戏逻辑类键不译俄文

> 完整规则、对齐示例见 `.claude/skills/localization-format-guide/references/localization-format-guide.md`。

## Implementation Style

代码改动保持最小化，优先用最简单的机制实现：

- 把 timer 延迟设为 0，而不是另加一次冗余调用
- 复用一个字符串事件，而不是新增自定义事件
- 避免过度还原、过度分析

## 注释规约

代码注释只写**为什么这样做**，不写**这行代码做了什么**。读者能从代码本身读懂的，就不要再用注释复述一遍。

不写：
- KV 字段、behavior、cast range 等可以直接查 KV 文件得到的事实
- "移植自 xxx.lua 的 yyy 函数"之类来源说明（git 历史会保留）
- 单行字段含义的复述（`// 覆盖默认 level >= 3` 跟在 `ability: { level: { gte: 2 } }` 后面就是冗余）
- 段落式罗列"对英雄做什么 / 对小兵做什么"，代码已经表达得很清楚

写：
- 选择某个数值/方案的**原因**（"1 级伤害太低、蓝耗占比高，2 级起才用"）
- 与默认/约定不一致的**特殊处理**（"AoE 半径远大于 cast range，需要 castMode 投影到边缘"）
- 一两句话点出技能中文名 / 设计目的

整个文件一个 `/** 一两行 */` JSDoc 即可，不需要分段、不需要 bullet 列表。

## Plan 规范

Plan 阶段重点讲清楚**设计思路和数据流**，不要写代码细节：

- **先设计，后细节**：Plan 应包含：背景/目标、设计决策（为什么这样做）、数据流（谁读谁写、字段名、经过哪些层）、修改文件列表（一行描述）、验证方式。
- **不写代码**：Plan 中不应出现具体函数签名、完整代码块、参数列表。这些留给实现阶段。
- **文件列表简洁**：每个文件一行，说明"改什么"即可，不说"怎么改"。

## Git 工作流

### 分支命名

- 功能分支：`feature/{issue-number}-{branch-name}`
- 示例：`feature/123-add-new-hero-ai`

### Pull Request

使用模板创建 PR，模板文件为 `.github/pull_request_template.md`。
分支名匹配 `^feature/(\\d+)` 时，提取 `issue-id` 作为 Issue 段。
Release Note 段按照 `.claude/skills/release-note/SKILL.md` 文件的规则生成。
**PR 标题默认使用英文。**

### Commit 格式

简短单行标题（≤72 字符）+ 正文只写 `Co-Authored-By`，不写其他正文、不写 bullet 说明。
详细说明由 PR description 承担，commit message 保持简洁。

### Git & Commits

只 stage 与本次请求明确相关的文件，无需逐个列给用户确认。但提交前若当前分支不符合预期（如本应在 feature 分支却处于 `develop`/`main`），先提示用户确认目标分支再提交。


## 文档自维护规范

当用户纠正 Claude 的做法、发现文档与实际代码矛盾、或用户补充了新约定时，触发 `doc-update` skill 将有价值的内容沉淀到文档中。执行流程见 `.claude/skills/doc-update/SKILL.md`。

文档与 skill 专属规则应写入对应的 `SKILL.md`，**不要**放进 CLAUDE.md；CLAUDE.md 只保留项目级通用规则。文档更新应作为完成一次改动的一部分（自维护），不要等用户催促。

## Skill 交互规范

执行 skill 时，**遇到不明确的决策点必须用 `AskUserQuestion` 工具以选项菜单形式询问用户**，不得自行假设。适用场景包括但不限于：

- 目标文件有多个候选（如抽奖池 vs 单位专属）
- 操作模式不明确（新建 vs 修正）
- 原版技能信息无法确定（多个候选、版本差异等）

每道问题单独一次 `AskUserQuestion` 调用，`options` 列出具体候选项并附简短说明。
