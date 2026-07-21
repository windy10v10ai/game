---
name: bot-item-build
description: >-
  基于 bot（英雄_BOT.csv）与玩家（英雄_玩家.csv）出装统计 CSV（列：物品,英雄,Average 时长_秒,胜率,事件数,Average 金钱），
  按装备在 src/vscripts/ai/build-item/item-tier-config.ts 的 canonical tier 过滤数据，
  为 src/vscripts/ai/build-item/hero-build-config.ts / hero-build-config-template.ts 的候选池生成扩充建议：
  bot 数据优先、玩家数据补充、同英雄模板兜底，目标每个 tier 候选数至少 8 件（最佳区间 8~10，不超过 12）。
  与用户确认后执行编辑并校验 tier 一致性。
---

# Bot 出装候选池调整

基于统计 CSV 调整 `src/vscripts/ai/build-item/hero-build-config.ts`（英雄专属候选池）与
`hero-build-config-template.ts`（共享模板候选池）的 tier 装备构成。

> 参考文件路径见 CLAUDE.md「Dota 2 参考文件速查」。

---

## 背景知识

### 候选池抽样机制

`hero-build-state.ts` 里 `MAX_ITEMS_PER_TIER = 6`：每个 tier 初始化时用
`SampleWeightedWithoutReplacement`（`weighted-pool.ts`）从候选池加权随机抽 6 件进入实际购买列表
（T5 数量按 `GetT5ItemCount` 难度阶梯浮动，非固定 6）。

**候选池数组的书写顺序对结果没有任何影响**——纯加权随机抽取，权重默认为 1，只有写成
`{ item, weight }` 才能自定义权重。排序、分组只是给人看的，不影响游戏内行为。

**候选池 ≤ 6 件时，抽样等于原样返回，没有随机性**；必须明显 **> 6** 件才能让"这把和上把出的不一样"，
也才能留出以后根据胜率数据继续优化候选池的空间（正好卡在 6 就没有改进余地了）。这是本 skill 每个
tier 目标数量下限定为 **至少 8 件**（而不是恰好 6）的根本原因。**最佳区间是 8~10**，**不超过 12**——
超过 12 会稀释每件装备的实际入选概率、增加维护和人工核对成本，此时应按信号强度裁掉最弱的条目；
但 8~12 之间只要是真实数据支撑的有价值装备，不必为了凑到某个"整数"而强行裁剪。

**T5 是例外**：整个装备库里 T5 装备总数只有约 18 件，摊到单个英雄的候选池撑不满 8~10 的区间，
目标改为 **7~9 件，不超过 10 件**。

> 编写 `src/vscripts/ai/item/specs/` 下的战斗使用逻辑（何时对谁使用某物品）是另一件事，
> 与本 skill 的候选池调整无关，见 [bot-item-usage](../bot-item-usage/SKILL.md) skill。

### Tier 归属规则（`item-tier-config.ts`）

`ItemTier` 按实际金钱划分，区间为**左开右闭** `(下限, 上限]`：

| Tier | 区间                 |
| ---- | -------------------- |
| T1   | cost ≤ 2000          |
| T2   | 2000 < cost ≤ 5000   |
| T3   | 5000 < cost ≤ 10000  |
| T4   | 10000 < cost ≤ 30000 |
| T5   | cost > 30000         |

特殊道具需要偏离价格规则时（如 `item_hand_of_midas` 价格属于 T2 区间但特意定为 T1，
`item_excalibur` 放在 T4 顶级），必须在该条目旁加注释说明原因，**不改规则本身**。

英雄专属池（`hero-build-config.ts` 的 `targetItemsByTier`）若配置了某个 tier，
**完全替代**该英雄所用 `HeroTemplate` 的对应 tier 池，不合并。

### HeroTemplate 分类与属性三选一配件

`HeroTemplate` 按英雄真实主属性（Dota 官方 `AttributePrimary`，见
`docs/reference/<version>/npc_heroes.txt` 对应英雄的 `AttributePrimary` 字段）分四种：
`Strength` / `Agility` / `Intelligence` / `Universal`（ALL）。**新英雄首次配置 `template` 前必须查
`AttributePrimary` 确认，不要凭"这个英雄玩起来像什么"或历史印象判断**——即使英雄名字听起来像力量/敏捷/
智力，实际 `AttributePrimary` 也可能是 ALL。已迁移英雄的 `template` 字段以 `hero-build-config.ts`
当前代码为准，不要仅凭 `AttributePrimary` 反推去"纠正"已有配置——是否重新归类 Universal 需要用户确认。

`item_bracer`（护腕）/`item_wraith_band`（怨灵系带）/`item_null_talisman`（空灵挂件）是同价位的
属性三选一配件，分别主加力量/敏捷/智力（各 +5 主属性 +2 其余两项），**必须匹配英雄的真实主属性**，
不能三选一之外的两件也塞进候选池（如力量英雄的候选池里除了护腕又混入怨灵系带）。。

### T5 装备定位参考

部分 T5 装备的英雄适配定位不直接从名字看出，供判断候选时参考：

- `item_hawkeye_turret`（鹰眼炮台）：技能实现要求 `IsRangedAttacker()`，只有远程英雄能触发，是远程英雄的核心 T5 装备
- `item_magic_sword`（魔渊剑）：融合狂战斧 + 绝对破防之刃 + 大冰眼，是力量英雄的核心 T5 装备

---

## 第一步：收集 CSV 输入

用 AskUserQuestion 询问用户提供：

- Bot 出装统计 CSV 路径（`...英雄_BOT.csv`）
- 玩家出装统计 CSV 路径（`...英雄_玩家.csv`）

至少需要一份；两份都有时按下文"数据优先级"处理。CSV 格式：
`物品,英雄,Average 时长_秒,胜率,事件数,Average 金钱`（表头行跳过）。

确认本次要调整的英雄范围（英雄内部代号，如 `npc_dota_hero_axe`）。若用户给出的是英雄中文名（如
「风行者」「莱恩」），在 `npc_heroes.txt`（`docs/reference/<version>/`）中查出对应的
`npc_dota_hero_<id>` 系统名，并在回复中明确列出中文名 → 系统名的对照，供用户确认没有认错英雄。

---

## 第二步：噪音过滤

分析前排除以下几类，不作为候选：

- **消耗品/中立物/仪式类**：信使、守望、烟雾、宝石、tp卷、回复消耗品（tango/flask/clarity/faerie_fire/enchanted_mango/infused_raindrop）、cheese、universal_rune 等
- **融合/成就类原材料**：`item_fusion_*`、`item_dragon_ball_*`、名称含 `_part` 的中间件
- **已由 `consumablesByTier` 自动处理的装备**：`item_wings_of_haste`、`item_ultimate_scepter`、
  `item_ultimate_scepter_2`、`item_aghanims_shard`、`item_moon_shard_datadriven`、
  `item_tome_of_strength`/`item_tome_of_agility`/`item_tome_of_intelligence`。
  这些不进入 `targetItemsByTier` 候选池提案，混进来会和自动购买逻辑重复。
- **`ItemQuality: "consumable"` 的装备**：即使 cost 落在某个 tier 区间也不进 `targetItemsByTier`——
  这类装备本质是用完即耗（如 `item_tome_of_luoshu` 洛书，KV 里 `ItemPermanent: "0"`），塞进装备槽位
  候选池会占用宝贵的槽位却买了就消失。添加候选前查一下该装备在
  `docs/reference/<version>/items.txt` 或 `npc_items_custom.txt` 里的 `ItemQuality`。
- **臂章系列固定候选范围**：`item_armlet` 系列只出 `item_armlet`（基础档）或 `item_armlet_pro_max`
  （终极档），**不出** `item_armlet_plus`（中间件），也不出 pro_max 之后的平行分支
  `item_armlet_light`/`item_armlet_dark`/`item_armlet_artifact`。
- **`sell-item-config.ts` 的 `SellItemCommonJunkList` 里的装备**（`item_magic_wand` 和「消耗品」
  段落里列出的几件除外——它们是设计上就该用完即扔的一次性/早期消耗品）：这份列表是背包超过出售阈值
  （7~9件，`SellItem.GetSellThreshold`）时 `SellCommonJunkItems` **无条件**优先出售的清单。
  `RemoveCurrentTierItems` 只保护"当前正在购买的这一 tier"，一旦出装进度推进到下一 tier，前面买的、
  但在这份名单里的装备就会在下次背包超阈值时被半价甩卖——不管是不是特意买的。CSV 信号再强也不能用
  （如 `item_diffusal_blade`、`item_eagle`、`item_talisman_of_evasion`、裸的
  `item_kaya`/`item_sange`/`item_yasha`）。**每次生成候选池前必须对照这份列表逐条过滤**，不要只凭
  tier 归属和信号强度判断。

---

## 第三步：按 canonical tier 过滤数据（不是按当前摆放位置）

读取 `item-tier-config.ts`，取每个装备的 `tier` 字段作为唯一权威依据。**过滤 CSV 数据时用这个字段**，
不要看装备当前摆在 `hero-build-config.ts` 的哪个 tier 桶里——当前摆放位置可能本身就是待修正的错误
（例如价格/tier 规则调整后遗留的历史归属）。

**CSV 里出现但 `item-tier-config.ts` 完全没收录的装备**（不属于第二步噪音过滤名单，是真实遗漏）：
不要因为查不到 tier 就直接跳过或换用别的装备顶替。**信号强（事件数明显不低，尤其是多个英雄反复出现同
一件未收录装备）时直接自动补录，不需要额外用 AskUserQuestion 确认**——先在 `item-tier-config.ts` 里
补上这条配置：`cost` 取 CSV 的「Average 金钱」列（同一装备各行数值应一致，可与命名/功能相近的同价位
装备互相印证），`tier` 按该 cost 对照本节的价格区间表得出。补完后再按正常流程把它纳入候选。只有当信号
很弱（个位数、极低事件数）或明显是过时/已改名的历史装备时才跳过。

**`ItemQuality: "component"` 的装备即使信号很强也跳过**：在 `docs/reference/<version>/items.txt`
查该装备的 `ItemQuality` 字段——标为 `"component"` 说明官方就把它定位为合成中间件（如
`item_orb_of_venom`、`item_helm_of_iron_will`、`item_diadem`），不是玩家会长期持有的终局装备，
不应作为候选池目标，无论 CSV 事件数多高都跳过。`"secret_shop"`、`"artifact"` 等其他 quality 标签
才是可以正常收录的终局装备。

**`nameCN` 取值来源，禁止自己猜译名**：优先在现有代码里找权威译名——`item-tier-config.ts` 里若已有
该装备的 `nameCN` 字段直接用；没有的话查 `game/scripts/vscripts/bot/bot_item_data.lua` 或其他英雄配置
里出现过的同装备注释。都找不到时，去 `game/resource/addon_schinese.txt` 搜
`DOTA_Tooltip_Ability_<item_name>` 键取其值。三处都查不到再询问用户，不要凭印象/相似装备名称推测。

---

## 第四步：读取当前候选池状态

对每个目标英雄：

- `Read hero-build-config.ts`，取该英雄 `targetItemsByTier` 里各 tier 现有条目
- 若某 tier 未被英雄专属覆盖，`Read hero-build-config-template.ts` 查该英雄 `template` 对应的
  `HeroTemplate` 配置里同 tier 的条目（作为现状基线，也作为后续兜底来源）

---

## 第五步：逐 tier 构建扩充候选（数据优先级）

对每个目标英雄的每个 tier，按以下优先级顺序纳入候选，直到数量达到 **至少 8 件**（最佳区间 8~10，
不超过 12，见下方第 6 条）：

1. **保留现有池子里的所有装备**
2. **Bot 数据优先**：该 tier 下、该英雄的 Bot CSV 里出现过的装备，**全部纳入**（不设事件数阈值，
   只要 tier 匹配、非噪音就算，因为这是历史实际购买行为，信号本身就有意义）
3. **玩家数据补充**：若"现有 + Bot"仍不足 8，从玩家 CSV 按事件数降序取，补到 8 件以上
4. **同英雄模板兜底**：若上述来源仍不够、且找不到明显合适的装备，**先按英雄主属性对应的 `HeroTemplate`
   （Strength/Agility/Intelligence/Universal）里同 tier 尚未使用的条目挑选**，而不是直接跳到纯判断——
   模板里的条目已经是该属性英雄的通用可用装备，比凭空猜测更可靠。仍不够时才检查角色定位相近的其他
   tier（如力量模板的 T5 可能被辅助英雄借用）
5. **纯角色定位判断**：若模板也补不出第 8 件（数据彻底稀薄，模板同 tier 条目已用完），
   允许挑选一件契合该英雄技能定位、但完全没有数据支撑的装备（**仍需遵守属性三选一配件的匹配规则**）。
   这类装备**必须单独列出**，用 AskUserQuestion 请用户确认是否认可这个判断，不能自行决定后直接写入配置
6. **超过 12 件时按信号强度裁剪，8~12 之间不强行裁剪**：若总数落在 8~12 之间、都是有真实数据支撑的
   有价值装备，**保留全部**；只有超过 12 件时才按 Bot/玩家事件数之和裁掉信号最弱的条目，裁到 12 件以内

每个候选标注来源（Bot 胜率/事件数、玩家事件数、模板借用、纯判断），供用户在确认阶段判断取舍。

### 5.1 关键约束：同一 tier 不能塞进互斥装备

`resolvedItems[tier]` 是**买光整份清单**，不是"多选一"——`hero-build-manager.ts` 的
`TryPurchaseNormalItem` 会依次买掉该 tier 抽样命中的每一件，直到全部买完才进入下一 tier。
所以**同一 tier 候选池里绝不能同时放入功能互斥的装备**，否则英雄会把它们全部买一遍，白白浪费金钱。

最典型的互斥组是**鞋子**：`item_boots`（基础鞋）、`item_power_treads`、`item_arcane_boots`、
`item_phase_boots`、`item_tranquil_boots` 在 `item-tier-config.ts` 里共享同一个 `baseItems`
下位装备（`item_boots`），彼此之间**没有互相顶替出售的关系**（每种升级鞋只会顶替 `item_boots`
本身，不会顶替另一种升级鞋）。**每个英雄的候选池里，鞋子类装备只能保留一种**（且不要把
`item_boots` 当"安全填充"留着——它是低级鞋，选定了真正要用的鞋之后应直接替换掉，不要与真鞋并存）。

添加候选前，检查该装备在 `item-tier-config.ts` 里的 `baseItems` 链：如果两件候选是同一功能槽位的
不同分支（如多种鞋子、或共享同一下位装备但互不替代的平行版本），只留其中一件，其余用别的非冲突装备替代。

**同一 `baseItems` 的平行分支同理，不只是鞋子**：`item-tier-config.ts` 里两件装备如果
`baseItems` 都包含同一个下位装备（如 `item_wasp_callous` 和 `item_wasp_despotic` 都以
`item_butterfly` 为下位装备，分别升级到蝴蝶的两条不同分支），它们是**互斥的平行分支**，不是互补装备——
出售替代关系（`GetReplacedItems`）里彼此互不替代，买了不会互相顶替出售，会被同时买下白白浪费金钱。
添加候选前扫一遍 `item-tier-config.ts` 找出所有共享同一 `baseItems` 条目的装备组，同一 tier 只保留
其中信号最强的一个（下位装备本身，如 `item_butterfly`，可以和分支之一共存，因为分支会顶替它）。

---

## 第六步：展示提案，等待确认

按英雄分组、按 tier 列出"现状 → 提案"，标明每个新增装备的来源。改动规模较小（几个英雄、几个 tier）
时可直接在对话中用表格展示 + 一次性征求确认；改动规模大（批量英雄/多轮迭代）时应按
`superpowers:writing-plans` 规范写入 plan 文件。

第五步第 5 条产生的"纯判断"装备，必须在展示时单独高亮，不要和数据支撑的条目混在一起，避免用户误以为
有数据背书。

---

## 第七步：应用改动（用户确认后）

- 编辑 `hero-build-config.ts`（或 `hero-build-config-template.ts`，若某 tier 在模板层本身普遍偏窄、
  且多个英雄共享该模板均会受益，优先扩模板而不是逐个英雄重复相同装备）
- 装备条目注释**只写中文名**（如 `// 金手指`），不写"数据信号稀薄的补充""胜率强信号"这类取舍推导过程
  ——按项目注释规约，讨论过程不进代码注释。**例外**：若是真正的 tier 归属修正（如把某装备从错误的
  tier 桶挪到正确的桶），可以留一句简短说明（如 `// 从 T5 移入，真实价格属于 T4`）
- 若 canonical tier 本身需要调整（如某装备价格上偏离价格规则被特意定为另一档），在
  `item-tier-config.ts` 对应条目旁加注释说明原因

### 7.1 首次迁移新英雄时的额外注册

新出装系统已是 `BotBaseAIModifier` 的唯一默认行为——`Init()` 会对 `hero-build-config.ts` 中有配置的英雄无条件调用 `InitializeHeroBuild`，不再有英雄名单开关。老 Lua 出装系统（`modifier_bot_think_strategy`）已随全部英雄迁移完成一并移除。为新英雄首次添加 `hero-build-config.ts` 配置后**不需要**额外注册到任何名单，也**不需要**额外新建 `src/vscripts/ai/hero/hero-<name>.ts`：
`AI.ts` 的 `getModifierName()` 对没有专属判断分支的英雄会默认落到通用的 `BotBaseAIModifier`，
已迁移的 abaddon/axe/bane/bloodseeker/bounty_hunter 均无专属文件、全部走这条默认路径。只有当英雄
需要**自定义技能施法逻辑**（超出通用出装/攻击行为）时才新建专属文件并在 `AI.ts` 的
`getModifierName()` 里加判断分支，参考 `hero-viper.ts`、`hero-drow-ranger.ts` 等既有实现。

---

## 第八步：一致性校验

改完后必须确认没有引入新的"摆放 tier 与 canonical tier 不一致"问题：写一个临时脚本（不提交进仓库，
放 scratchpad 目录即可）解析 `hero-build-config.ts` / `hero-build-config-template.ts` 里每个
`[ItemTier.Tn]: [...]` 区块中的装备名，对照 `item-tier-config.ts` 的 `tier` 字段，确认 0 处不一致。

同时检查第 5.1 节的互斥组问题：脚本里从 `item-tier-config.ts` 解析出所有共享同一 `baseItems`
条目的装备分组（鞋子互斥组 `item_boots`/`item_power_treads`/`item_arcane_boots`/`item_phase_boots`/
`item_tranquil_boots` 只是其中一种，`item_wasp_callous`/`item_wasp_despotic` 这类共享同一下位装备的
平行分支同理），逐组扫描每个英雄每个 tier 是否同时出现 2 件以上，若有则必须修复。

然后运行：

```bash
npx eslint <改动文件> --max-warnings=0
npx jest src/vscripts/ai/build-item
```

---

## Skill 交互规范

- **数据优先级固定**：Bot 优先、玩家补充、模板兜底、纯判断兜底，不跳过前面的层级直接用判断。
- **纯判断类装备必须 AskUserQuestion 确认**，不得自行决定。
- **目标至少 8 件，最佳区间 8~10，不超过 12**——正好 6 件没有为后续胜率驱动的迭代留出空间。8~12
  之间只要是真实数据支撑的有价值装备就可以保留，不必强行裁到某个"整数"；超过 12 件才需要按信号
  强度裁剪。**T5 例外：装备库总量少，目标改为 7~9 件，不超过 10 件**。
- **不修改** `MAX_ITEMS_PER_TIER`、`GetT5ItemCount` 难度阶梯、tier 边界规则本身。
- **注释只写装备中文名**，不写数据来源推导过程；tier 归属修正类改动才附简短原因。
- **同一 tier 内鞋子（及其他无 sell-replacement 关系的同槽位装备）只能保留一种**，`item_boots`
  不作为"安全填充"与真鞋并存，选定真鞋后应从候选池移除。
- **属性三选一配件（护腕/怨灵系带/空灵挂件）必须匹配英雄真实主属性**，查
  `docs/reference/<version>/npc_heroes.txt` 的 `AttributePrimary` 确认，不要凭印象判断；
  Universal 英雄不用这三件中的任何一件。
- **臂章系列只出 `item_armlet` 或 `item_armlet_pro_max`**，不出 `item_armlet_plus`，也不出
  `item_armlet_light`/`item_armlet_dark`/`item_armlet_artifact`。
