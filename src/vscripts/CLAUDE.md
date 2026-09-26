# src/vscripts/ 游戏逻辑（TypeScript → Lua）

TSTL 编译为 Lua，输出到 `game/scripts/vscripts/`。跨层契约见 `src/CLAUDE.md`。

## 模块系统

核心系统实现为注册在 `GameRules` 上的单例类:

```typescript
// In modules/index.ts
export function ActivateModules() {
  if (GameRules.AI == null) GameRules.AI = new AI();
  if (GameRules.Lottery == null) GameRules.Lottery = new Lottery();
  // ... other modules
}
```

通过 `GameRules.Lottery`（技能抽奖）、`GameRules.AI`（Bot AI 管理）、`GameRules.Event`（事件分发器）、`GameRules.GoldXPFilter`（金币/经验修改）访问。

目录分工：`ai/`（Bot AI，见下）、`modules/`（核心系统单例）、`modifiers/`（自定义 modifier 基类）、`api/`（后端 API 客户端）、`utils/`（TSTL 适配器、`dota_ts_adapter.ts`）。

## 修改游戏逻辑时

1. 使用 `@registerModifier()` 和 `@registerAbility()` 装饰器进行自动注册
2. **modifier 类名一律 snake_case**：不传 name 参数时类名即注册到 Lua 的 modifier 名，须与 Dota 原生命名风格一致，如 `modifier_fountain_anti_camp_watcher`、`tinker_ai_modifier`。snake_case 类名会触发 lint，在类声明上方加 `// eslint-disable-next-line @typescript-eslint/naming-convention`。存量 PascalCase AI modifier（`BotBaseAIModifier` 等）是历史遗留，新增不要照抄
3. 从 `utils/dota_ts_adapter.ts` 扩展 `BaseModifier`、`BaseAbility` 或 `BaseItem`
4. 通过 `GameRules.*` 单例访问模块(例如 `GameRules.Lottery.refresh()`)
5. 开发期间在 VConsole 中使用 `script_reload` 进行热重载

## 修改 AI 时

1. 英雄特定 AI: 在 `ai/hero/` 中添加/修改 modifiers
2. 所有英雄 AI 扩展 `BotBaseAIModifier` 并实现 `OnIntervalThink()` (0.5 秒间隔，见 `ai/hero/bot-base.ts` 的 `ThinkInterval`)
3. 模式: 在 `ai/mode/` 中实现 `GetDesire()` (返回 0-1 的浮点数)
4. 动作: 在 `ai/action/` 中添加可重用的行为(attack, move, cast)
5. 物品构建: 在 `ai/build-item/` 中定义，设计与决策见 `ai/build-item/README.md`

## API 调用

后端 API 客户端在 `api/`，统一通过 `api-client.ts` 的 `ApiClient.sendWithRetry()` 发送，认证用的 `x-api-key` 由它统一注入。完整端点清单从本地 API 服务器的 OpenAPI 文档取（`http://localhost:3001/api-docs-json`），不要凭路由名猜字段。

**改 `api/` 下任何代发（客户端 HTTP relay）相关代码前先读 `api/README.md`**：游廊对局服务端发不出 HTTP，线上每一局都靠玩家客户端代发，那条链路的限制（只能 GET、标题长度上限、认响应头、线路可用性）决定了这一层能怎么写。

- **`ApiParameter.retryTimes` 是总尝试次数，不是重试次数**：`sendWithRetry` 的判断是 `retryCount < maxRetryTimes`，所以 `1` = 只发一次不重试，默认 `3` = 首次加两次重试共三次。只有网络失败（状态码 0）、429 与 5xx 才重试，其余 4xx 原样重发结果不会变，直接走失败回调。**会扣积分、扣费或建订单的写入一律设 `1`**——重复执行造成的是真实损失，宁可失败让玩家重点一次，也不要静默扣两次。`POST /game/end/local` 是例外，后端的 5 分钟冷却会挡住已记上的那次，所以重试 3 次；`POST /game/end` 没有这层保护，仍是 `1`。已确认后端本身幂等的保持默认重试（`PUT /player/:id/property` 是目标等级语义、`PUT hero-awakening` 已觉醒直接 no-op、`PUT setting` 与 `PUT game-preset` 是覆盖式写入）。新增 API 调用点时先去后端确认是累加还是覆盖，不要按路由名猜

## 测试

- **框架**: Jest 配合 ts-jest preset
- **测试文件**: 与源代码同位置的 `*.test.ts` 文件(例如 `gold-xp-filter.test.ts`)
- **模拟**: 在测试中通过 `global.GameRules = { ... }` 模拟 Dota 全局变量
- **运行**: `npm test` 执行所有测试并生成覆盖率报告
- **只测自己的分支/计算逻辑，不测引擎契约**：判断标准是代码里是否包含足够分量的**自身逻辑**（如加权抽样、难度阶梯映射、tier 归属判断）。以下情况都**不需要**写单元测试，靠 Dota tools 实机验证：
  - 纯函数、零 mock 不是该测的充分条件：只是把设计好的触发条件做布尔组合（如"满足 A 且 B 且距离 > 阈值就触发"）、不含实际计算时，同样不写测试——断言只会复述设计本身
  - 代码主体就是遍历/调用 Dota API（如 `hero.GetItemInSlot(i)` 循环计数、`FindUnitsInRadius` 后直接操作结果集），本身没有值得验证的分支
  - 需要 mock 多个 Dota 全局枚举/常量对象（如 `UnitTargetTeam` / `UnitTargetType` / `UnitTargetFlags` / `FindOrder`）才能让测试跑起来——这是"代码本身没有自身逻辑、只是在拼引擎调用参数"的强信号
  - 一段逻辑严重依赖一串 Dota API 行为（如 `AddAbility`→`GetMaxLevel`→`SetLevel` 的等级同步）时，不要为了覆盖它而搭建可控 mock 配置（如给 fake 注入 maxLevel 映射、构造多种引擎返回值）
  - 断言只是在还原调用方自己传入的配置参数（如断言 `FindUnitsInRadius` 被以哪些 team/flags 调用）——这是在测"我传了什么参数"，不是在测判断逻辑。不管这层调用是 Dota 原生 API 还是项目自己封装的 wrapper（如 `abilities/ts_abilities/shared/auto-cast-ability.ts` 里的 helper），只要断言对象是"mock 有没有被调用/传了什么参数"而非真实判断结果，同样不需要写；技能里若原有的自制逻辑（如某个手动补丁）被验证为多余并删除后，配套测试也要一并检查是否已退化为纯 mock 调用断言
  - Dota 原生 API（`CreateUnitByName` / `ParticleManager.*` / `EmitSoundOn` / `UTIL_Remove` / `AddNewModifier` 等）只作为占位防崩 mock，不要用 `toHaveBeenCalledWith` 断言它们的参数

## 常见陷阱

- **VScripts 验证时机**: 不要在每次修改 `src/vscripts/` 后都自动运行 `npm run build:vscripts`；用户的开发环境会自动编译。仅在创建 PR 前、最终完成前，或用户明确要求验证时统一运行一次。验证时只看 TS/TSTL 是否报错，**不要去读 `game/scripts/vscripts/` 下编译生成的 `.lua` 产物**对照（浪费时间，产物是 TSTL 自动生成的）。运行时行为靠 jest（自己的分支逻辑）+ Dota tools 实跑验证
- **TSTL 对象 spread 不可传 undefined**: **禁止**对可能为 `undefined` 的对象使用 spread（`{ ...maybeUndefined }` 或 `{ ...obj?.maybeUndefined }`）。TSTL 把对象 spread 编成 `__TS__ObjectAssign`，内部用 `pairs(...)` 遍历每个参数，传到 `nil` 会运行时 crash `bad argument #1 to 'pairs' (table expected, got nil)`。改用显式 if 判断 + 手动赋值，或用 `?? {}` 兜底后再 spread。jest 测试不会暴露此问题，必须在 Dota tools 实跑验证
- **TSTL 枚举用 normalized 成员名**: 引用 Dota 枚举成员时去掉原生前缀（`UF_` / `DOTA_` 等），如 `UnitFilterResult.FAIL_CUSTOM`（**不是** `UF_FAIL_CUSTOM`）、`UnitFilterResult.SUCCESS`。TSTL 编译时会自动内联回 Lua 原生名（`UF_FAIL_CUSTOM`）。用带前缀的名字 TS 会报 `Property 'UF_XXX' does not exist`
- **引擎枚举不要在模块顶层求值**: 承上，normalized 枚举编译出来是 Lua 全局名而非内联数字，所以 `const FLAGS = DamageFlag.A + DamageFlag.B` 这种模块顶层常量会在 `require` 阶段就去读全局。某个全局在当前引擎版本不存在时 `nil + nil` 直接抛错，**整个模块加载失败**，该文件里所有 `@registerAbility` / `@registerModifier` 都不执行——症状是技能和 modifier 的图标集体消失，没有崩溃弹窗，很容易误判成图标资源问题。枚举组合一律写在函数体内（如直接内联进 `ApplyDamage` 的 `damage_flags`），把求值推迟到调用时
- **本地常量不要与 Dota 引擎全局同名**: TSTL/moddota 转译器会把 normalized 枚举（如 `DamageTypes.PURE`）编译成同名的 Lua 全局标识符（如 `DAMAGE_TYPE_PURE`）。若同一文件里另外声明了同名的 `const`/`local`（哪怕只是内部用途，如自定义的掷骰索引），Lua 词法作用域会让局部变量遮蔽全局，编译和类型检查都不会报错，只有运行时才会取到错误的数值（如 `DamageTypes.PURE` 实际取到局部的 `3` 而非引擎的 `4`，导致 `ApplyDamage` 静默不生效）。避免用 `DAMAGE_TYPE_*`、`UnitTargetTeam` 等引擎保留名做本地变量
- **引用自己项目定义的 modifier/ability 名用类名 `.name`，不要另开重复字符串常量**：`@registerModifier`/`@registerAbility` 不传 `name` 参数时，注册到 Lua 的名字就是类本身的类名（见 `dota_ts_adapter.ts` 的 `registerModifier` 实现）。在同一或其他文件里引用这个自定义 modifier/ability（如 `AddNewModifier`/`FindModifierByName`/`HasModifier` 的名字参数）时直接写 `SomeModifierClass.name`，不要另外声明一个 `const XXX_MODIFIER_NAME = 'modifier_xxx'` 字符串常量——后者在改类名时容易忘记同步，导致两处不一致。此写法不适用于引用引擎原生 hardcoded modifier（如 `modifier_black_king_bar_immune`），那些没有本地类可取 `.name`，仍需写字符串字面量
- **施法错误飘字须 CastFilterResult + GetCustomCastError 配套**: 自定义物品/技能要在施法前拦截并飘字提示时，仅实现 `GetCustomCastError()` 无效——引擎只在 `CastFilterResult()` 返回 `UnitFilterResult.FAIL_CUSTOM` 时才去取错误文本。两者须配套（用同一判据）。错误文本 key 在本地化文件中**定义不带 `#`**（如 `dota_hud_error_xxx`），代码返回时**带 `#`**（`#dota_hud_error_xxx`）
- **不吃技能增强须显式标 flag，不靠物理类型**: 自定义技能用 `ApplyDamage` 造成物理伤害时，**不要**依赖「物理类型隐式不吃 spell amp」这条经验来确保不被技能增强放大。引擎判定是否吃技能增强的真正开关是伤害标志位，要明确排除时显式加 `damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION`（本项目技能增强是自定义属性 `property_spell_amplify_percentage` 实现，更不应靠隐式行为）
- **代码代为触发技能施放须补 `UseResources`**：代码直接调用某个技能的 `OnSpellStart()`（如自动检测循环里代玩家触发施法、监听某事件后连锁触发另一个技能）时，跳过了引擎原生施法管线，不会自动扣资源/进 CD，须显式调用 `this.UseResources(mana, useHealth, gold, cooldown)` 补上（四个布尔参数对应要不要消耗法力/生命/金钱、要不要进入冷却，按该技能实际消耗类型传参）。这一步只在「代码主动触发施放」时需要；玩家手动点技能触发的 `OnSpellStart()` 回调，引擎在调用前已经走完资源结算，不要重复调用，否则会双重扣资源/双重进 CD
- **下达攻击命令前先查 `IsAttacking()`**：高频重复下达 `ATTACK_MOVE` / `ATTACK_TARGET`（如 0.1 秒一次的执行器）会不断重置攻击前摇，Bot 表现为反复抬手却打不出伤害。发命令前加 `if (hero.IsAttacking()) return;` 让当前这次攻击走完，参考 `ai/action/action-attack.ts` 的 `MoveToAttack`。判定要放在结束/中断条件**之后**、发命令**之前**，否则 Bot 被小兵缠住时会连中断条件都不再检查
- **永久增减属性用 `Modify*` 改基础值，不要挂属性回调 modifier**：给英雄永久加/减全属性直接调 `ModifyStrength` / `ModifyAgility` / `ModifyIntellect`（传负数即减，只动基础属性、不含装备加成），一次生效、零持续开销（参考 `game/scripts/vscripts/items/item_tome_of_luoshu.lua`）。**不要**为了承载这个数值而挂一个声明 `MODIFIER_PROPERTY_STATS_*_BONUS` 的自定义 modifier——引擎每次重算属性都要跨进 Lua 调一遍回调，且数值还得靠 `SetHasCustomTransmitterData` 额外同步才能在客户端 tooltip 显示，漏同步就显示成 0。需要 buff 图标时另挂一个**不声明任何属性回调**的纯显示 modifier，数值放 stack count（引擎原生同步，客户端一定拿得到）。扣基础属性时须自行兜底下限，避免扣成负数

## 查阅引擎 API（函数签名、参数）

编写或修改 `game/scripts/vscripts/` 下的纯 Lua、或任意调用 `GameRules` / 单位 / 技能等引擎绑定 API 的代码时，出现「参数个数/类型不符」等运行时错误，优先对照在线 API 而不是只猜 TypeScript 类型：[ModDota API · vscripts](https://moddota.com/api/#/vscripts)

通用战斗公式（伤害/护甲等）在 `game/scripts/vscripts/util.lua`（手写纯 Lua，被遗留纯 Lua 物品脚本引用），TS 侧同步入口是 `utils/damage-calculation.ts`。
