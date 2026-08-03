# 觉醒进阶技法

供 `awaken-ability` 按需查阅，主流程不需要读完。每项都有真实落地参考（斧王、卓尔、PA、影魔、上古巨神等）。

### 进阶 1：等级与原技能关联（插入/新增也继承等级）

替换分支天然继承原技能等级，但**插入/新增**分支默认用 `newLevel`，初始等级不跟随关联技能。需要全程等级关联（如觉醒技能与某个大招同步升级）时，两步配套：

1. **KV 双向 `LinkedAbility`**（升级时等级同步）——在 `npc_abilities_override.txt` 的关联技能、和 `npc_abilities_custom_awaken.txt` 的觉醒技能，两边各加一行指向对方：
   ```
   "LinkedAbility"   "对方技能名"   // 双向联动同步升级
   ```
   两个技能的 `MaxLevel` 须一致。

2. **配置 `inheritLevelFrom`**（添加时继承初始等级）——`awaken-config.ts` 该条加：
   ```ts
   inheritLevelFrom: '关联技能名',
   ```
   `resolveNewLevel` 会在加新技能时取该关联技能当前等级作初始等级（在移除任何技能前求值，故 `inheritLevelFrom` 可以正是被插入槽位的技能）。

> 参考：斧王 `axe_auto_culling_blade` ↔ `axe_culling_blade`。

> **不要用 `Innate "1"` + `DependentOnAbility` 替代 `LinkedAbility`**：官方有「新技能比关联技能多一档等级」的场景用这个组合（古辰山 Absolute Zero 先天、玛尔斯 Sidekick），但那些都是英雄出生自带的先天技能槛位。本项目觉醒技能是运行时用觉醒石 `AddAbility()` 动态加上去的，不是原生先天槛位——给它加 `Innate "1"` 实测会导致技能/buff 图标不显示（卓尔游侠裂影箭觉醒踩过，已放弃改回固定等级）。等级关联场景老老实实用上面的 `LinkedAbility` + `inheritLevelFrom`（要求两边 `MaxLevel` 一致）；如果新技能就是想比关联技能多一档，优先考虑改成固定值/不分级，而不是引入 `DependentOnAbility`。

### 进阶 2：autocast 自动触发（自动施放）

「开 autocast 后自动检测施放」类觉醒，**已有共享基类 `AutoCastAbility`（`src/vscripts/abilities/ts_abilities/shared/auto-cast-ability.ts`），直接继承，不要重复造轮子**：

- KV：`BaseClass ability_lua`、`AbilityBehavior` = `NO_TARGET | IMMEDIATE | AUTOCAST`、`ScriptFile` 指向 `abilities/ts_abilities/...` 编译产物，**不写 `Modifiers`**（intrinsic modifier 由基类提供）。
- 继承 `AutoCastAbility`，只实现 `OnAutoCastThink(caster)`；需要时覆写 `getThinkInterval()`（默认 0.3）。共享 `modifier_autocast_think` 负责 `IsServer / IsAlive / GetAutoCastState` 守卫后回调。
- 基类 helper：`getFullCastRange`（含施法距离增强）、`findEnemiesInRange(caster, range, targetType, allowMagicImmune?)`（始终排除迷雾/隐身，可选命中魔免）、`castImmediatelyOnTarget`。
- 施放用 **`CastAbilityImmediately`**：玩家英雄的背景自动施放**不能**用 order 式（`CastAbilityOnTarget` 等会打断玩家移动/攻击）。新基类/helper 统一放 `ts_abilities/shared/`。

> 参考：斧王 `ts_abilities/axe_auto_culling_blade.ts`（斩杀线阈值 + 可打魔免）、宙斯 `ts_abilities/special_bonus_unique_zuus_upgrade.ts`（英雄优先、雷击仅英雄、不打魔免）。

### 进阶 3：监听某技能施法后触发效果

要在「英雄施放某个特定技能后」附带效果。下面两种实现**不是对等选项**：监听 + 造成伤害是**逻辑**，**从零新增一律走 TS**；DataDriven 一节仅作为「维护已有 datadriven 技能」的范例，不要据此从零新写。

- **TS intrinsic modifier（从零新增首选）**：`@registerModifier` 的 modifier 在 `DeclareFunctions` 声明事件，回调里判 `event.unit == parent` 且 `event.ability.GetAbilityName() == "目标技能名"`。不依赖技能 behavior，最通用。**先想清触发时机选对事件**：
  - `MODIFIER_EVENT_ON_ABILITY_START` → `OnAbilityStart`：**前摇开始**就触发（玩家可在前摇结束前取消施法）。只适合需要前摇期就生效的效果（如前摇加魔免防打断，见影魔现有觉醒）。**不要**用它结算附加伤害——玩家取消施法即可反复白嫖。
  - `MODIFIER_EVENT_ON_ABILITY_FULLY_CAST` → `OnAbilityFullyCast`：**前摇走完、真正 OnSpellStart** 才触发，等价「释放完成」。附加伤害/附加效果一律用这个。目标技能是单体指向时，伤害数值可直接 `event.ability.GetSpecialValueFor("xxx")` 读触发技能当前等级的值，天然随其等级/神杖/天赋分级，无需自带 KV 数值。
  - `MODIFIER_EVENT_ON_ABILITY_END_CHANNEL` → `OnAbilityEndChannel`：**引导结束**触发，读条走完和被打断/主动取消都会推。引导期间才生效的觉醒（如引导期魔免）用 `FULLY_CAST` 开、`END_CHANNEL` 收，**不要写轮询**——`CDOTA_BaseNPC` 上没有 `IsChannelling`（只有 `CDOTABaseAbility.IsChanneling()`），照着轮询思路写会编译不过。时长用 `event.ability.GetChannelTime()` 申请，实际回收交给 `END_CHANNEL`。参考：冰女 `special_bonus_unique_crystal_maiden_upgrade`。
- **DataDriven modifier（仅维护已有）**：KV `Modifiers` 加 `"Passive" "1"` 常驻 modifier（配 `"RemoveOnDeath" "0"` + `"Attributes" "MODIFIER_ATTRIBUTE_PERMANENT"`），用 **`OnAbilityExecuted`** 块 `RunScript`。被施放的技能是 **`keys.event_ability`**（不是 `keys.ability`），施法者 `keys.caster`。主动技（如 `UNIT_TARGET`）上也会常驻触发。

> **关键坑**：不要为了让 listener 常驻而给主动技 `AbilityBehavior` 叠加 `DOTA_ABILITY_BEHAVIOR_PASSIVE`——实测会使该主动技**无法施放**。DataDriven 的 `Passive` modifier 不依赖技能 behavior 即可常驻，保持原主动 behavior 即可。

> **关键坑**：`OnAbilityExecuted` 的 `RunScript` 里若要再给自己加一个**同一技能 KV `Modifiers` 里定义的** DataDriven modifier（如限时减伤 buff），必须用 `ability:ApplyDataDrivenModifier(caster, target, "modifier_name", {})`，**不能**用通用的 `unit:AddNewModifier(...)`——用 `AddNewModifier` 加载 DataDriven 定义的 modifier 时，**modifier 本身不会被加载**（不是 KV 占位符解析失败，是整个 modifier 都没生效），buff 图标不会出现在状态栏。`AddNewModifier` 只适用于借用别的技能/原生 hardcoded modifier（见进阶 7），不适用于自己 KV 里定义的 DataDriven modifier。

> 参考：影魔 `ability_lua` + `GetIntrinsicModifierName` 监听 `nevermore_requiem`；PA `ability_datadriven`（`UNIT_TARGET`，未加 PASSIVE）的 `modifier_pa_awaken_dagger_listener` 用 `OnAbilityExecuted`；宙斯 `special_bonus_unique_zuus_upgrade` 是 PASSIVE datadriven 监听范例。

### 进阶 4：数值仅觉醒后生效（special_bonus 关联）

想让原技能某个 KV 数值「仅在该英雄拥有觉醒技能时改变」（运行时无法干净改的固定值，如投射物速度），用**觉醒技能名**作 `special_bonus` key 写进原技能 override KV：

```
"dagger_speed"
{
    "value"                                         "1200"
    "special_bonus_unique_phantom_assassin_upgrade" "=2100"   // 觉醒后覆盖
}
```

`=值` 覆盖、`+值` 增加，此外还支持 `+N%` 按百分比增加（如 `+100%` 表示翻倍，项目里已有大量原版天赋先例，如 `special_bonus_unique_dragon_knight_9 "+120%"`）——多档位字段要整体等比缩放时用这个，不需要手算每档绝对值再写数组。引擎检测英雄拥有该 key 同名技能时自动应用。

> **关键坑：key 必须是 `special_bonus_` 前缀的技能名**。引擎靠前缀识别哪些子 key 是「bonus 覆盖」，非此前缀的子 key 被当无关元数据**静默忽略**（数值不变，无报错）。觉醒技能即使是普通可学习主动技（如 PA `special_bonus_unique_phantom_assassin_upgrade` 是 `UNIT_TARGET` 主动），只要名字带前缀就能当 key；反之，不带前缀的觉醒技能名（如曾用的 `sniper_assassinate_upgrade`）写进去不生效，须把觉醒技能**重命名**为 `special_bonus_unique_*`（连带改抽奖池引用、Lua 类名、本地化 key；ScriptFile 路径/Lua 文件名可不动，仅同步文件内 ability 类名）。该 key 技能还须被英雄拥有且等级 ≥ 1 才应用。

> **同一 value 块可以挂多个 `special_bonus_` key，但引擎只应用块内第一个命中的**，所以觉醒键须排在 `value` 之后、其它键之前。动手前先按 `update-abilities-override` skill 的方法读该技能整段（override 差分 + `docs/reference/<version>/heroes/` 原版全集，**原版键会被合并进来，只看 override 会漏**），确认块内已有哪些 `special_bonus_*`（常见来源：原版天赋、魔晶、神杖、其它觉醒）。排首位意味着觉醒后该字段上的其它 bonus 全部失效，若不可接受则换一个干净字段，或改用其它实现方式（DataDriven Modifiers / TS）。

> **块内原有的原版键必须在 override 里逐条显式重写，并排在觉醒键之后**。只把觉醒键写进 override 是不够的——override 未显式声明的原版键在合并时会排到觉醒键**前面**，觉醒同样静默失效。这些重写行的唯一作用是固定键序，须加注释说明，避免被后续「删同值差分」当冗余清理掉（写与原版不同的值可再加一层保险）。

> 实测：`tiny_tree_grab` 的 `attack_count` 原本挂着原版天赋 `special_bonus_unique_tiny_6` 与魔晶键，觉醒键排第三时**静默失效**（无报错、数值不变）；把觉醒键提到 `value` 之后、并将原版天赋键显式重写在其后，才生效。

> 参考：PA 觉醒后潜匿之刺 `dagger_speed` 1200→2100；狙击手 `special_bonus_unique_sniper_assassinate_upgrade` 觉醒后爆头 `proc_chance` `=100`。

### 进阶 5：加魔免但不顶替真 BKB

给英雄加魔免时，直接 `AddNewModifier("modifier_black_king_bar_immune")` 会缩短/顶掉玩家自己的 BKB。一律走全局工具函数（`game/scripts/vscripts/util.lua`）：

```lua
ApplyAwakenMagicImmunity(unit, ability, duration)
```

已有相等或更长的 BKB 时跳过，否则加魔免 + 播音效，**返回是否实际施加**。

**TS 代码优先用已有的 TS 封装**：`src/vscripts/abilities/ts_abilities/shared/awaken-magic-immunity.ts` 导出的 `applyAwakenMagicImmunity(unit, ability, duration)` 是同一逻辑的原生 TS 实现（同样借用 `modifier_black_king_bar_immune` 且不顶替真 BKB），直接 `import` 复用即可，不要再 `declare function` 绑定 Lua 全局。它与 Lua 版的差异是返回值：施加成功返回该 modifier 的句柄（`CDOTA_Buff`），跳过时返回 `undefined`（Lua 版返回布尔值）。

**魔抗必须在自己技能 KV 写 `spell_reduce`**：`modifier_black_king_bar_immune` 自带的只有减益免疫，魔抗数值是引擎从**施加它的那个 ability** 上读 `spell_reduce` 字段（原版即 `item_black_king_bar` 的 `AbilityValues`，值为 `60`）。借到觉醒技能上时，觉醒技能 KV 若没有这个字段，玩家只拿到减益免疫、**魔抗为 0**——不报错、不打日志，只能靠实机看数值发现。字段名须与 `item_black_king_bar` 一致，写进觉醒技能自己的 `AbilityValues`（符合进阶 10），不要塞进原版技能的 override。

**前摇加魔免要防取消刷新**：魔免绑在 `ON_ABILITY_START`（前摇开始）触发时，玩家可在前摇结束前取消再施法反复刷新（取消不进 CD、不耗蓝）。防法：仅当 `ApplyAwakenMagicImmunity` 返回 true 才启动取消检测；`StartIntervalThink` 轮询 `IsInAbilityPhase()`，前摇结束后若 `GetCooldownTimeRemaining() <= 0`（被取消）则移除；**移除前判据**——仅当 `modifier_black_king_bar_immune` 剩余 ≤ 本次魔免时长才 `Destroy()`，**绝不无条件 `RemoveModifierByName`**（同名 modifier 区分不了来源，会误删真 BKB）。

> 参考：影魔 `special_bonus_unique_nevermore_upgrade.lua` 的 `OnIntervalThink` 取消检测；PA 闪烁/匕首魔免。

### 进阶 6：纯被动标记技能改用 Modifier 展示（省技能栏空间）

纯被动且描述简单的觉醒技能（典型如进阶 4 的「数值仅觉醒后生效」纯 KV 标记技能），不必占技能栏（castbar）一个槛位，可改用常驻 buff 图标展示：

- KV：`AbilityBehavior` 加 `DOTA_ABILITY_BEHAVIOR_HIDDEN`（不进技能栏），同时加一个 `Modifiers` 子块，子 modifier 设 `"Passive" "1"` + `"IsHidden" "0"`（非隐藏，展示为常驻 buff 图标，自动复用 `AbilityTextureName` 做图标）。
- 本地化：ability 自身的 `DOTA_Tooltip_ability_<name>` / `_Description` **保留不删**——觉醒预览页 `AwakenTab.tsx` 用 `DOTAAbilityImage` 读取的是 ability 的 tooltip，不是 modifier 的。额外补一组 `DOTA_Tooltip_modifier_<modifier_name>` / `_Description`，内容与 ability 标题/描述完全一致，确保游玩时看到的 buff tooltip 与觉醒页说明一致。
- modifier 描述里若有写死的字面 `%` 号，**同样要转义成 `%%`**（不要因为是 modifier 就漏掉，规则与正文一致，见 CLAUDE.md 本地化文案规约）。
- **modifier tooltip 不支持直接 `%key%` 读取 ability 的 `AbilityValues`**（会显示空白或吞掉百分号）；ability 自身的描述不受影响，仍可正常用 `%key%`。modifier 这边按实现方式分三种处理：
  - **DataDriven 且数值挂在内置 `MODIFIER_PROPERTY_*`**（如 `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`、`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` 等标准属性，`Properties` 块里已声明）：**可以**直接动态取值，本地化写 `%dMODIFIER_PROPERTY_<属性名>%%%` 即可，引擎自动读取该 modifier 当前的属性值，**不需要**任何 RunScript/OnTooltip 代码，也**不需要**手动包白色粗体（项目里已有先例：`monkey_king_defy`、`insight_armor_aura`）。
  - **DataDriven 且数值不对应任何内置 Property**（纯标记技能、无脚本）：没有代码可补，描述里**写死成具体数字**。
  - **TS/Lua 脚本类 modifier**（`ability_lua` + `GetIntrinsicModifierName`，如进阶 3 的监听型觉醒）：数值若会变化（随等级、天赋等），**不要写死**——用 `MODIFIER_PROPERTY_TOOLTIP` 动态取值：`DeclareFunctions` 加 `ModifierFunction.TOOLTIP`，实现 `OnTooltip(): number` 返回目标值（如 `this.GetAbility()?.GetSpecialValueFor('xxx') ?? 0`），本地化里用 `%dMODIFIER_PROPERTY_TOOLTIP%%%` 占位（同一 modifier 最多两个动态值，第二个用 `MODIFIER_PROPERTY_TOOLTIP2`/`OnTooltip2`/`%dMODIFIER_PROPERTY_TOOLTIP2%`）。只有真正固定不变的数值才写死。**`%dMODIFIER_PROPERTY_TOOLTIP%` 不会像 ability 的 `%key%` 一样自动套白色粗体**（实测），需要手动包 `<font color='#FFFFFF'><b>...</b></font>`，和写死数值的处理方式一样（这条仅限自定义 `TOOLTIP`/`TOOLTIP2`，内置 Property 不受影响）。

> 参考：寒冬飞龙觉醒 `special_bonus_unique_winter_wyvern_upgrade`（DataDriven 写死数值）；卓尔游侠裂影箭觉醒 `special_bonus_unique_drow_ranger_upgrade`（TS modifier，分裂概率会被天赋提升，用 `OnTooltip` 动态显示而非写死）；发条技师觉醒 `special_bonus_unique_rattletrap_upgrade_shield`（DataDriven 内置 Property 动态取值，`%dMODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE%%%`）。

### 进阶 7：借用原生 hardcoded modifier（如隐身）实现效果

某些效果（如隐身）引擎有原生硬编码 modifier 支撑，但目标 KV 里查不到 `Modifiers` 块（完全编译进引擎，无法照抄），仍可在 TS 里直接 `AddNewModifier` 按名字借用：

```ts
const invis = parent.AddNewModifier(parent, this.GetAbility(), 'modifier_riki_backstab', {
  duration,
  fade_delay: fadeDelay,
});
```

`duration` 参数通常能让原生 modifier 自动到期（如 `modifier_black_king_bar_immune`）。**若实机验证发现某个借用的原生 modifier 不吃 `duration` 自动移除**，改用 `Timers.CreateTimer(duration, callback)` 手动 `Destroy()`，`callback` 内先 `IsNull()` 判空再 `Destroy()`（防止已被其它途径提前移除时重复调用报错）：

```ts
if (!invis) return;
Timers.CreateTimer(duration, () => {
  if (invis.IsNull()) return;
  invis.Destroy();
});
```

原生 modifier 内部可能还支持其它同名参数覆写（如本例 `fade_delay`），具体哪些参数生效、哪些字段该从自身觉醒技能 KV 读取（而非硬编码），**没有文档，只能靠实机反复验证**，不要凭一次测试结果下结论。

> 参考：风行者觉醒 `windrunner_whirlwind_custom`（`GetIntrinsicModifierName` 挂的被动 modifier）借用隐刺 `modifier_riki_backstab`；该被动与技能自身的主动 `OnSpellStart` 共存，二者互不影响——`GetIntrinsicModifierName` 不依赖 `AbilityBehavior`，主动大招可以正常保留 `IMMEDIATE | NO_TARGET` 之类行为。

### 进阶 8：需要读取「施法者当前 AoE/属性加成」等动态值时，优先在自身 KV 声明同名字段

想让觉醒技能的某个数值自动叠加施法者当前的 AoE 加成（或其他类似的引擎内置加成机制）时，**不要**用「哑值探测」手法（如声明一个 `value: "1"` 的占位数值加 `affected_by_aoe_increase: "1"`，再用 `GetSpecialValueFor() - 1` 反推出加成百分比、手动相加到别的数值上）。正确做法是直接在自身 KV 里声明目标字段本身（字段名与原版一致，如 `scepter_aura_radius`），带上同样的 `affected_by_aoe_increase: "1"`，让 `GetSpecialValueFor('scepter_aura_radius')` 直接返回已经计入加成的最终值。这样既不需要跨技能读取原版 KV，也不需要额外的相加逻辑，且能直接用 `%scepter_aura_radius%` 占位符内联进本地化正文（与原版写法一致）。

### 进阶 9：运行时替换类技能的 `HasScepterUpgrade` + `scepter_description` 不会正常显示

觉醒技能若是**运行时替换**（通过 `awaken-config.ts` 的 `targetAbility` 把原版技能整体换成新的 `ability_lua`），即使 KV 里带 `HasScepterUpgrade: "1"` 并写了 `_scepter_description`，引擎也不会渲染这个神杖对比预览面板——因为该面板依赖的是"英雄默认自带、原生学习"的技能实例，替换类技能走的是完全不同的运行时挂载路径。神杖相关的效果说明应直接写进主 `_Description` 正文（可加 `<font color='#92acf5'>阿哈利姆神杖</font>` 提示），不要指望 `_scepter_description` 单独显示。（注：常驻挂在英雄默认技能槽的觉醒技能，如 `imba_chaos_knight_phantasm`，`scepter_description` 可以正常显示，问题只出在替换类。）

### 进阶 10：觉醒专属参数不要塞进原版技能的 override KV

觉醒技能若需要「跟随某个原版技能的等级/天赋联动」某个数值（如领域半径随原版技能天赋扩大），**不要**为了图省事把这个觉醒专属的自定义字段直接写进 `npc_abilities_override.txt` 里原版技能自己的 `AbilityValues`——即使代码要通过 `FindAbilityByName(原版技能).GetSpecialValueFor('自定义字段')` 去读、需要蹭同一份天赋绑定，也不能把字段存放在原版技能身上。这样会让原版技能的差分文件里混入一个只有觉醒机制认识的字段，看 override 文件的人无法理解这个字段为什么存在，后续调整原版技能数值平衡时也容易误改或误删。

正确做法：字段直接定义在觉醒技能自己的 KV 里；需要联动原版技能当前等级/天赋时，在代码里读取原版技能实例的等级/已生效数值，用公式在觉醒技能侧算出最终值，而不是让原版技能替觉醒机制保管参数。

### 进阶 11：目标是「简化原版操作」时，优先包一层自动化外壳，不要重新实现原版机制

有些觉醒诉求本质是「原版技能手动操作太繁琐，希望自动帮玩家完成」（如某个需要手动施放+手动收尾两步操作的技能，想在自动施法开启后全自动化）。这类需求容易被过度设计成一套全新机制（如引入持续 buff/领域/独立数值体系去模拟"自动化后应有的效果"），实际上完全不需要——原版技能自身的施法逻辑、命中判定、加成效果都不用动，觉醒技能只需要做**一层控制外壳**。

这个方案还额外解决了英雄技能槽位已满、无法新增独立技能的问题：把原版技能隐藏（`SetHidden(true)`）挂在英雄身上而不是移除，觉醒技能占用同一个槽位对外显示，自身 KV 完整还原原版数值供玩家查看，内部通过代为调用原版技能的 `OnSpellStart()` 复用其全部效果——玩家看到的是"同一个技能位置多了自动施法能力"，而不是"技能被替换成了别的东西"。这是利用引擎已有机制实现最小改动的方式，槽位紧张、又只想加自动化能力时优先考虑这个思路。

- 关闭自动施法：技能栏显示原版技能本体，玩家手动操作，行为与不觉醒时完全一致
- 打开自动施法：觉醒技能的 intrinsic modifier 用 `OnIntervalThink` 周期检测触发条件（如冷却是否转好、范围内是否有合适目标），满足条件时**代替玩家调用原版技能自身的 `OnSpellStart()`**（而不是重新实现一遍技能效果），原版技能命中判定、加成、伤害全部原样生效；需要玩家原本手动点第二步操作（如某个收尾/确认技能）时，同样在检测循环里判断该技能是否可施放，可施放就代为调用

判断「简化操作」类需求是否走偏了的信号：如果实现过程中出现了原版技能本身没有的新数值字段（半径、持续时间、加成档位）、新的 buff/debuff modifier、或者需要"叠加/覆盖原版效果"的逻辑，那大概率是把"自动化操作"和"改变技能效果"这两件事混在一起了——先回头确认需求到底是哪一种，多数"简化操作"类诉求只需要前者。代码代为触发 `OnSpellStart()` 时须补 `UseResources`，见 CLAUDE.md「常见陷阱」。

**替换类觉醒仍需完整还原原版技能的 KV 数值和本地化文案**：这层"自动化外壳"不改变原版效果，因此觉醒技能自己的 KV（`AbilityValues`、`AbilityCooldown`、`AbilityManaCost`、`HasScepterUpgrade` 等）和本地化描述都应该与原版技能 + `npc_abilities_override.txt` 差分之后的最终值保持完全一致（玩家在未开自动施法时，看到的技能面板本质就是原版技能本身）。新增的自动施法说明追加在原版描述之后，不要替换掉原版的效果描述。

> 参考：上古巨神觉醒 `elder_titan_ancestral_spirit_awaken`——自动施法开启后，冷却转好且附近有敌方英雄时自动朝最远的英雄施放先祖之魂（直接调用原版 `elder_titan_ancestral_spirit` 的 `OnSpellStart`），游魂可召回时自动调用原版 `elder_titan_return_spirit`，不新增任何数值/效果，原版命中加成、护甲魔抗削弱、KV 数值、本地化描述全部原样保留。
