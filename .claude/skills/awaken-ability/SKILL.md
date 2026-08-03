---
name: awaken-ability
description: 为英雄创作「觉醒技能」时使用——通过觉醒石（item_awaken_stone，抽奖发放）替换/插入/新增英雄技能槽的强化版技能。处理范围包括 src/vscripts/modules/awaken/ 的配置表与替换算法、game/scripts/npc/npc_abilities_custom_awaken.txt 的觉醒技能 KV、对应 Lua/TSTL 实现、game/scripts/npc/npc_abilities_override.txt 的关联差分，以及 addon_schinese.txt/addon_english.txt 的文案。当用户说「加一个觉醒技能」「给 XX 做觉醒」「觉醒后 XX 强化」「觉醒技能等级关联/自动触发/加魔免」等时触发。
---

# Awaken Ability

觉醒 = 玩家用觉醒石对指定英雄做一次技能槽改造。配置表 + 替换算法是纯 TSTL 模块，加一个觉醒通常只改配置 + 补技能资产。

## 架构（三个文件）

| 文件 | 职责 |
| ---- | ---- |
| `src/vscripts/modules/awaken/awaken-config.ts` | `ABILITY_REPLACEMENTS` 配置表 + `AbilityReplacement` 接口。**加觉醒主要改这里** |
| `src/vscripts/modules/awaken/awaken-replacer.ts` | 替换算法 `executeReplacement`（新增/替换/插入三分支，入口有幂等守卫）；对外 `applyAwakenByHero`/`canAwaken`/`isAwakened` |
| `src/vscripts/items/ts_items/item_awaken_stone.ts` | 觉醒石。`OnSpellStart` 调 `applyAwakenByHero`，成功才 `UTIL_Remove`；用 `CastFilterResult`+`GetCustomCastError` 给「不支持/已觉醒」飘字 |

## 三种替换操作

配置表每条记录一个英雄的觉醒。三种操作由字段组合决定：

| 操作 | 含义 | 字段 |
| ---- | ---- | ---- |
| **新增** | 直接加新技能，不动原有技能 | 只填 `newAbility` |
| **替换** | 移除某旧技能，加新技能（同步已学等级，不退点数） | `targetAbility` + `newAbility` |
| **插入** | 在指定槽位插入新技能，原技能保留等级重新加回 | `targetSlot` + `newAbility` |

`AbilityReplacement` 字段：
- `heroName`：适用英雄（`npc_dota_hero_xxx`）
- `targetAbility?` / `targetSlot?`：替换目标技能名 或 插入槽位（二选一；都不填 = 纯新增）
- `newAbility`：觉醒后的新技能名
- `newLevel`：新技能初始等级。替换分支里 `newLevel > 0` 用它，否则套用原技能已学等级
- `inheritLevelFrom?`：见「进阶 1」

> `targetSlot` 命中 `generic_hidden`（占位空槽）时走替换而非插入。

## 添加一个新觉醒的步骤

### 1) 配置

在 `awaken-config.ts` 的 `ABILITY_REPLACEMENTS` 加一条。最小形态（纯新增被动）：

```ts
{
  heroName: 'npc_dota_hero_xxx',
  newAbility: 'special_bonus_unique_xxx_upgrade',
  newLevel: 1,
},
```

> **注释只写英雄名**（如 `// 齐天大圣 觉醒`），**不要**罗列会随版本变动的技能效果/数值。效果描述属于本地化文案，不该散落在配置注释里。也不要写成「移除 A，替换为 B」这类复述改动结果的叙述——哪怕不含数值，本质仍是效果描述，且与本地化文案重复，文案一改注释就过时。需要点明机制时用字段名/系统名（如「与大招 LinkedAbility 同步升级」），不要叙述玩法效果。

### 2) 觉醒技能本体

若 `newAbility` 复用已有技能则跳过本步。新技能需补齐：

- **KV 定义** → 写进 `game/scripts/npc/npc_abilities_custom_awaken.txt`（已 `#base` 引入，无需再加）。关键字段 `BaseClass`、`ScriptFile`（指向实现）、`AbilityTextureName`（图标名）：

  ```
  "special_bonus_unique_xxx_upgrade"
  {
      "BaseClass"             "ability_lua"
      "ScriptFile"            "abilities/ts_abilities/special_bonus_unique_xxx_upgrade"
      "AbilityTextureName"    "xxx_some_icon"
      "MaxLevel"              "5"
      "AbilityValues" { ... }
  }
  ```

- **`ScriptFile` 实现选型** → 见 `custom-ability` skill，觉醒不另立规则。被动觉醒标准写法：`GetIntrinsicModifierName()` 返回一个内置 modifier，无需学习即生效，所有可调值从 KV `AbilityValues` 读取。源码放 `src/vscripts/abilities/`，KV `ScriptFile` 指向编译产物 `abilities/ts_abilities/<name>`（参考斧王 `axe_auto_culling_blade`、宙斯 `special_bonus_unique_zuus_upgrade`）。

- **觉醒状态必须在游戏内可见** → 觉醒是玩家花积分换来的永久改造，进游戏后必须能确认自己已觉醒。**技能栏可见**与**常驻 buff 图标**二选一，两者都隐藏 = 玩家零感知，视为未完成：
  - 技能栏可见：`AbilityBehavior` 不加 `DOTA_ABILITY_BEHAVIOR_HIDDEN`。主动技觉醒天然满足（参考 PA `special_bonus_unique_phantom_assassin_upgrade`、军团 `legion_commander_auto_duel`）。
  - 常驻 buff 图标：技能加 `HIDDEN` 不占技能栏，另挂一个**非隐藏**的常驻 modifier —— TS 里 `IsHidden()` 返回 `false`，DataDriven 写 `"IsHidden" "0"`（参考发条 `special_bonus_unique_rattletrap_upgrade`、斯温 `special_bonus_unique_sven_upgrade`）。细节见进阶 6。

  走 buff 图标这条时 `GetTexture()` 和 `DOTA_Tooltip_modifier_<modifier_name>` / `_Description` 都要补齐，否则图标是紫块、悬停无说明。**只写了 tooltip 文案却把 modifier 设成隐藏**是最容易漏的组合——文案在文件里躺着，游戏里永远看不到。

- **图标** → 引用 Dota2 原版技能名则不放 png；自定义图标才复制同名 png 到 `game/resource/flash3/images/spellicons/<name>.png`。`AbilityTextureName` 也可直接填**至宝/变体 texture 路径**（如 `necrolyte/apostle_of_decay_icons/necrolyte_heartstopper_aura`、`drow_ranger/immortal/drow_ranger_wave_of_silence`、`zuus_static_field_alt1`），引擎直接引用，同样无需放 png。

- **本地化** → 在两个 addon 文件的 `Awaken Abilities 觉醒技能` 模块补条目（中英同步）。标题格式见下。

### 3) 标题本地化格式（统一）

技能名称行用紫色 `#d000ff` 并闭合 `</font>`：
- 中文：`<font color='#d000ff'>名称 觉醒</font>`（**空格**分隔，不要 `-觉醒` 连字符）
- 英文：`<font color='#d000ff'>Name Awakened</font>`

**不要**用 `#8B008B`/`#00ff00`/`#a74abd` 等其他色值、不要漏 `</font>`。新增觉醒后核对该英雄标题与池内其它觉醒一致。

**正文关键词颜色（统一）**：
- 魔法免疫 / 减益免疫等保护类关键词 → 金色 `#FFCC66`（参考 PA、影魔）
- 伤害类型关键词（正文内联的「纯粹伤害 / 魔法伤害」等）→ 纯粹 `#FFE56E`（金色）、魔法 `#05CAFF`（蓝色）。项目既有约定，新增照此对齐
- 自动施放 / 触发类提示 → 红色 `#FF0000`（参考斧王、肉钩）
- 神杖升级说明 → 白色 `#FFFFFF` 配「神杖升级：」前缀（参考死灵竭心光环、火枪暗杀）
- **写死的数值** → 引擎只对 `%key%` 变量自动套白色粗体，正文里手写的具体数字不会变色，须**手动**包成 `<font color='#FFFFFF'><b>数字</b></font>`（白色粗体，模拟引擎数值样式；参考钢背兽、影魔觉醒）。每个技能的强化各占一行（`<br>` 分隔）。

### 4) 觉醒预览页

在 `src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx` 的 `AWAKEN_ABILITIES` 加一条 `{ heroName, abilityName }`。该列表是配置表的展示副本，需手动同步，否则新觉醒不会出现在个人中心「觉醒」页。觉醒石 `_Description` 不再列英雄名（指向此页面），无需改动物品描述。

### 5) 限时免费体验清单

新觉醒默认加入限免清单，让玩家不花积分也能试。清单是手工维护的，两处都要改：

- `src/vscripts/modules/awaken/awaken-config.ts` 的 `FREE_TRIAL_HEROES` 加英雄名（决定实际生效）
- `AwakenTab.tsx` 对应条目加 `freeTrial: true`（决定卡片是否显示限免角标）

加完后**必须**用 `AskUserQuestion` 把清单里已有的旧英雄列出来，问用户哪些移出——清单没有到期机制，不问就会一直免费下去。

### 6) 验证

`npm run build:vscripts` 不报错 + `npx jest awaken-replacer` 过。槽位顺序 / 点数退还 / 飘字 / 运行时行为须 Dota tools 实跑确认。改完 vscripts 只看编译是否通过，不读编译产物 `.lua`。

---

## 进阶技法

11 条技法集中在 `references/advanced-techniques.md`，主流程不需要读。**命中下面任一条才去读对应项**：

| 需求 | 进阶 |
| ---- | ---- |
| 觉醒技能要与某个原技能**同步升级** | 1 |
| 要**自动施放**（开 autocast 后自动检测触发） | 2 |
| 要在**施放某个技能之后**附带效果 | 3 |
| 某个原技能数值**仅觉醒后改变** | 4 |
| 要**加魔免**（不能顶替玩家真 BKB） | 5 |
| 纯被动标记技能想**省掉技能栏槽位** | 6 |
| 要借用引擎**原生 hardcoded modifier**（隐身等） | 7，另见 `../shared-references/vanilla-modifiers.md` |
| 要读取施法者**当前 AoE / 属性加成** | 8 |
| 替换类技能的**神杖描述**不显示 | 9 |
| 觉醒专属参数该**放哪个 KV** | 10 |
| 需求本质是**简化原版操作**而非改效果 | 11 |

---

## 不明确时询问

遇到这些决策点用 `AskUserQuestion` 菜单询问，不要自行假设：
- 操作类型不明（新增 vs 替换 vs 插入）
- 数值/效果「仅觉醒后生效」还是「全局对该英雄生效」
- 等级是否需要与某技能关联
- 主动技是否要做成自动触发
- 限免清单中已有的哪些旧英雄该移出（见步骤 5，每次新增觉醒都要问）
