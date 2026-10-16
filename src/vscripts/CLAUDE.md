# src/vscripts/ 游戏逻辑（TypeScript → Lua）

TSTL 编译为 Lua，输出到 `game/scripts/vscripts/`。跨层契约见 `src/CLAUDE.md`，Bot AI 见 `ai/CLAUDE.md`，后端 API 见 `api/CLAUDE.md`。

## 结构

核心系统是 `modules/index.ts` 的 `ActivateModules()` 注册在 `GameRules` 上的单例，如 `GameRules.Lottery`（技能抽奖）、`GameRules.AI`（Bot AI 管理）、`GameRules.Event`（事件分发）、`GameRules.GoldXPFilter`（金币/经验修改）。

目录：`ai/`（Bot AI）、`modules/`（核心系统单例）、`modifiers/`（自定义 modifier 基类）、`api/`（后端 API 客户端）、`utils/`（TSTL 适配器 `dota_ts_adapter.ts`、`damage-calculation.ts` 等）。

## 写技能、物品、modifier

- 扩展 `utils/dota_ts_adapter.ts` 的 `BaseModifier` / `BaseAbility` / `BaseItem`，用 `@registerModifier()` / `@registerAbility()` 注册
- **modifier 类名用 snake_case**：不传 name 时类名就是注册到 Lua 的 modifier 名，与 Dota 原生命名一致（如 `modifier_fountain_anti_camp_watcher`）。类声明上方加 `// eslint-disable-next-line @typescript-eslint/naming-convention`。存量 PascalCase AI modifier（`BotBaseAIModifier` 等）是历史遗留
- **引用自己定义的 modifier/ability 名写 `SomeModifierClass.name`**，与类名同步；引擎原生 hardcoded modifier（如 `modifier_black_king_bar_immune`）没有本地类，写字符串字面量
- **施法错误飘字要 `CastFilterResult` + `GetCustomCastError` 配套**：引擎只在 `CastFilterResult()` 返回 `UnitFilterResult.FAIL_CUSTOM` 时才取错误文本，两者用同一判据。错误文本 key 在本地化文件里定义不带 `#`，代码返回时带 `#`
- **排除技能增强时显式加 `damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION`**：物理伤害也要加。引擎看的是标志位，且本项目技能增强是自定义属性 `property_spell_amplify_percentage`
- **代码直接调 `OnSpellStart()` 代为施放时补 `this.UseResources(mana, useHealth, gold, cooldown)`**：绕过了引擎施法管线，不会自动扣资源、进 CD。玩家手动施放的回调引擎已经结算过，不再调用
- **负面状态时长先过 `utils/damage-calculation.ts` 的 `calculateStatusResistedDuration(duration, target)`**：`AddNewModifier` 不按目标状态抗性缩短 `duration`（已实测），原版 modifier 同样适用。给友方或自己的增益不折算
- **永久增减属性用 `ModifyStrength` / `ModifyAgility` / `ModifyIntellect` 改基础值**（负数即减，自行兜底下限）：一次生效、零持续开销（参考 `game/scripts/vscripts/items/item_tome_of_luoshu.lua`）。声明 `MODIFIER_PROPERTY_STATS_*_BONUS` 的自定义 modifier 每次重算属性都要回调 Lua，还得 `SetHasCustomTransmitterData` 同步才能在 tooltip 显示。要 buff 图标时另挂一个不声明属性回调的纯显示 modifier，数值放 stack count
- **全局事件走共享分发**：受伤（按攻击者）、普攻命中（按攻击者）、单位被加 modifier 三类监听经 `modules/modifier-event/modifier-event-hub.ts` 的 `ModifierEventHub` 按单位登记，不在自己的 modifier 里声明 `MODIFIER_EVENT_ON_TAKEDAMAGE` / `ON_ATTACK_LANDED` / `ON_MODIFIER_ADDED`：引擎对全场每次事件都回调一次每个声明者，只要有一个就有固定开销。伤害通道入口统一跳过伤害 < 20 的事件（持续伤害零碎小跳），新处理不必自己再过滤。吸血与法术吸血用 `modules/lifesteal/` 的 `Lifesteal.Set(unit, modifier, 普攻%, 法术%)` / `Remove` 登记百分比，不另写回血处理
- KV 数值块叫 `AbilityValues`（`AbilitySpecial` 已废弃），变量名与注释写 `abilityValue` / `rangeFromAbilityValue`；引擎 API `GetSpecialValueFor` 照常调用
- 开发期间在 VConsole 用 `script_reload` 热重载

## TSTL 陷阱

- **对象 spread 的每个参数都要有值**：`{ ...maybeUndefined }` 编成 `__TS__ObjectAssign`，内部 `pairs(nil)` 运行时报 `bad argument #1 to 'pairs'`，jest 测不出。用显式 if 赋值，或 `?? {}` 兜底再 spread
- **枚举用 normalized 成员名**：`UnitFilterResult.FAIL_CUSTOM`，不带 `UF_` / `DOTA_` 前缀，TSTL 会内联回 Lua 原生名
- **引擎枚举只在函数体内求值**：normalized 枚举编译成 Lua 全局名，模块顶层的 `const FLAGS = DamageFlag.A + DamageFlag.B` 在 `require` 阶段读全局，某个全局不存在时整个模块加载失败，文件里所有 `@registerAbility` / `@registerModifier` 都不执行。症状是技能和 modifier 图标集体消失、没有崩溃弹窗，容易误判成图标问题
- **本地常量避开引擎全局名**：`DamageTypes.PURE` 编译成全局 `DAMAGE_TYPE_PURE`，同文件里同名的 `const`/`local` 会遮蔽它，编译不报错，运行时取到错误数值（如 `ApplyDamage` 静默不生效）
- **TS 函数默认多一个 self 参数**：没标 `this: void` 的函数（含挂到 `_G` 的全局函数、作为参数传递的回调）编译后第一个参数是 self，Lua 侧调用要在第一个参数位置传 `_` 占位。给 Lua 调用或接收 Lua 函数的新接口，在函数类型和回调类型上都写 `this: void`，Lua 侧就按普通参数调用（如 `modules/modifier-event/` 的全局入口）
- **有模块级状态的文件不要放 `@registerModifier`**：`LinkLuaModifier` 登记的脚本在引擎创建该 modifier 时会再执行一遍，文件顶层的单例、静态字段、`_G` 赋值都会多出一份，与 `require` 拿到的那份互不相通（症状：登记了却收不到回调、监听建了两个）。modifier 放单独文件，通过 `import` 引用状态模块（如 `modules/modifier-event/`）
- **Lua 里空字符串和 0 都为真**：判断可选字符串、数字「有值」显式写 `!== undefined && !== ''`

## 测试与验证

- jest + ts-jest，测试文件与源码同目录 `*.test.ts`，用 `global.GameRules = { ... }` 模拟全局
- **只测自己的分支/计算逻辑**（加权抽样、难度阶梯映射、tier 归属判断这类），引擎行为靠 Dota tools 实机验证。以下信号说明没有值得测的自身逻辑：
  - 只是把设计好的触发条件做布尔组合，断言只会复述设计（纯函数、零 mock 也一样）
  - 主体是遍历/调用 Dota API（`GetItemInSlot` 循环计数、`FindUnitsInRadius` 后直接操作结果）
  - 要 mock 多个引擎枚举（`UnitTargetTeam` / `UnitTargetType` / `UnitTargetFlags` / `FindOrder`）才跑得起来
  - 要搭可控 mock 模拟一串引擎行为（如 `AddAbility`→`GetMaxLevel`→`SetLevel`）
  - 断言的是 mock 被怎么调用、传了什么参数（原生 API 与项目 wrapper 都算）。删掉多余的自制逻辑后，检查配套测试是否已退化成这种断言
- Dota 原生 API（`CreateUnitByName` / `ParticleManager.*` / `EmitSoundOn` / `UTIL_Remove` / `AddNewModifier` 等）只作占位防崩 mock
- **`npm run build:vscripts` 在创建 PR 前、最终完成前或用户要求时统一跑一次**，用户的开发环境会自动编译。只看 TS/TSTL 报错，编译产物 `.lua` 不用读

## 查引擎 API

运行时报「参数个数/类型不符」时对照 [ModDota API · vscripts](https://moddota.com/api/#/vscripts)，其他文档入口见 `dota-docs-lookup` skill。通用战斗公式在 `game/scripts/vscripts/util.lua`（遗留纯 Lua 物品脚本引用），TS 侧入口是 `utils/damage-calculation.ts`。
