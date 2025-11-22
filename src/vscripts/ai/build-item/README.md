# Bot出装系统 (Build Item System)

全新的基于装备等级和槽位的Bot出装系统,提供智能的装备购买和出售决策。

## 系统概述

### 核心特性

1. **装备等级系统** (5个等级)

   - T1: <2000金币 - 前期装备
   - T2: 2000-5000金币 - 中期装备
   - T3: 5000-10,000金币 - 中后期装备
   - T4: 10,000-30,000金币 - 后期装备
   - T5: >30,000金币 - 终极装备

2. **装备槽位系统** (6个槽位)

   - Core: 核心输出装备
   - Defense: 防御装备
   - Mobility: 移动装备
   - Control: 控制装备
   - Utility: 工具装备
   - Consumable: 消耗品

3. **英雄模板系统** (5种模板)

   - AgilityCarryMelee: 敏捷核心(近战) (PA, Juggernaut, Riki等)
   - AgilityCarryRanged: 敏捷核心(远程) (Luna, Drow, Sniper等)
   - MagicalCarry: 法师核心 (Lion, Lina, Zeus等)
   - StrengthTank: 力量坦克 (Axe, Pudge, Bristleback等)
   - Support: 辅助 (Crystal Maiden, Dazzle等)

4. **智能装备过渡**

   - 自动根据目标装备生成购买路径
   - 按照模板定义的装备链逐级购买
   - 无需手动配置每个过渡装备

5. **智能装备出售**
   - 拥有高级装备时自动出售同槽位的低级装备
   - 避免背包浪费和金钱浪费

## 文件结构

```
src/vscripts/ai/build-item/
├── BuildItemManager.ts          # 核心管理器
├── item-tier-config.ts          # 装备等级配置 (160+装备)
├── hero-template-config.ts      # 英雄模板配置 (4种模板)
├── hero-build-config.ts         # 英雄出装配置 (示例9个英雄)
└── README.md                    # 本文档
```

## 配置英雄出装

### 1. 简单配置 - 仅使用模板

如果英雄完全符合某个模板,无需任何配置,系统会根据英雄攻击类型自动使用`AgilityCarryMelee`或`AgilityCarryRanged`模板。

### 2. 基础配置 - 选择模板

```typescript
// 在 hero-build-config.ts 中添加
npc_dota_hero_your_hero: {
  template: HeroTemplate.MagicalCarry,  // 使用法师模板
}
```

### 3. 高级配置 - 自定义目标装备

```typescript
npc_dota_hero_luna: {
  template: HeroTemplate.AgilityCarryRanged,
  targetItems: {
    // 核心槽可以配置多个装备
    [ItemSlot.Core]: [
      'item_excalibur',          // 圣剑
      'item_monkey_king_bar_2',  // 定海神针
      'item_skadi_2',            // 大冰眼
    ],
    // 其他槽配置单个装备
    [ItemSlot.Defense]: 'item_satanic_2',
    [ItemSlot.Utility]: 'item_black_king_bar_2',
    // Mobility槽未配置 - 后期不需要移动装备
  },
  consumables: [
    { item: 'item_aghanims_shard', priority: 1 },
    { item: 'item_wings_of_haste', priority: 2 },
    { item: 'item_ultimate_scepter_2', priority: 3 },
  ],
}
```

### 4. 配置说明

- **template**: 可选,指定使用的模板
- **targetItems**: 可选,设置各槽位的最终目标装备
  - 槽位完全可选 - 不需要的槽位不设置即可
  - 可以设置单个装备(字符串)或多个装备(数组)
- **consumables**: 可选,消耗品列表,按priority优先级购买

## 工作原理

### 购买决策流程

1. **检查消耗品** - 按优先级购买配置的消耗品
2. **检查目标装备** - 对于每个配置的槽位:
   - 检查是否已拥有目标装备
   - 如果没有,生成过渡路径
   - 购买路径中第一个买得起的装备
3. **使用模板** - 如果目标装备都已购买,从模板中找其他装备

### 出售决策流程

在 `SellItem.SellExtraItems()` 中按以下优先级执行:

1. **智能出售低级装备** (装备数量 > 6 时)

   - 使用 `BuildItemManager.ShouldSellItem()` 智能判断
   - 基于装备等级和槽位系统
   - 自动出售同槽位的低级装备

2. **传统出售系统** (fallback):
   - 出售已消耗的物品(魔晶、急速之翼等)
   - 出售配方物品
   - 出售通用垃圾物品
   - 出售重复物品
   - 出售被升级替代的装备
   - 出售英雄特定物品
   - 按价值顺序出售物品(初级→中级→高级)

### 过渡路径生成

假设Luna的Core槽配置:

```typescript
[ItemSlot.Core]: 'item_excalibur'
```

系统会从`AgilityCarryRanged`模板的Core装备链中提取:

```
item_wraith_band (T1)
→ item_mask_of_madness (T1)
→ item_sange_and_yasha (T2)
→ item_monkey_king_bar (T2)
→ item_monkey_king_bar_2 (T3)
→ item_excalibur (T4) ← 目标
```

Bot会按顺序购买这些装备,直到达到目标。

## 示例配置

### 敏捷核心(远程) - Luna

```typescript
npc_dota_hero_luna: {
  template: HeroTemplate.AgilityCarryRanged,
  targetItems: {
    [ItemSlot.Core]: ['item_excalibur', 'item_monkey_king_bar_2', 'item_skadi_2'],
    [ItemSlot.Defense]: 'item_satanic_2',
    [ItemSlot.Utility]: 'item_black_king_bar_2',
  },
  consumables: [
    { item: 'item_aghanims_shard', priority: 1 },
    { item: 'item_wings_of_haste', priority: 2 },
    { item: 'item_ultimate_scepter_2', priority: 3 },
    { item: 'item_moon_shard_datadriven', priority: 4 },
  ],
}
```

### 法师核心 - Lion

```typescript
npc_dota_hero_lion: {
  template: HeroTemplate.MagicalCarry,
  targetItems: {
    [ItemSlot.Core]: 'item_hallowed_scepter',
    [ItemSlot.Control]: 'item_necronomicon_staff',
    [ItemSlot.Utility]: 'item_refresh_core',
    [ItemSlot.Defense]: 'item_aeon_pendant',
    [ItemSlot.Mobility]: 'item_arcane_blink',
  },
  consumables: [
    { item: 'item_aghanims_shard', priority: 1 },
    { item: 'item_ultimate_scepter_2', priority: 2 },
  ],
}
```

### 力量坦克 - Axe

```typescript
npc_dota_hero_axe: {
  template: HeroTemplate.StrengthTank,
  targetItems: {
    [ItemSlot.Defense]: [
      'item_blade_mail_2',
      'item_undying_heart',
      'item_shivas_guard_2',
    ],
    [ItemSlot.Core]: 'item_radiance_2',
    [ItemSlot.Utility]: 'item_black_king_bar_2',
    [ItemSlot.Mobility]: 'item_jump_jump_jump',
  },
  consumables: [
    { item: 'item_aghanims_shard', priority: 1 },
    { item: 'item_wings_of_haste', priority: 2 },
    { item: 'item_ultimate_scepter_2', priority: 3 },
  ],
}
```

## 添加新装备

在`item-tier-config.ts`中添加:

```typescript
item_your_new_item: {
  name: 'item_your_new_item',
  tier: ItemTier.T3,
  slot: ItemSlot.Core,
  cost: 8000,
  upgradesTo: ['item_upgraded_version'], // 可选
}
```

## 修改模板

在`hero-template-config.ts`中修改对应模板的`itemChains`:

```typescript
const AgilityCarryRangedTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryRanged,
  itemChains: [
    {
      slot: ItemSlot.Core,
      items: [
        "item_wraith_band",
        "item_your_new_item", // 添加到装备链
        "item_excalibur",
      ],
    },
    // ...
  ],
};
```

## 调试

系统会在购买和出售时打印日志:

```
[AI] BuildItem npc_dota_hero_luna 购买装备: item_wraith_band (Core, T1)
[AI] BuildItem npc_dota_hero_luna 出售低级装备: item_wraith_band
[AI] BuildItem npc_dota_hero_luna 购买装备: item_mask_of_madness (Core, T1)
```

## 优势

1. **配置简单** - 只需配置最终目标,系统自动处理过渡
2. **灵活性高** - 完全可选的槽位系统,支持多个目标装备
3. **智能出售** - 自动出售低级装备,避免浪费
4. **易于维护** - 装备、模板、英雄配置分离,清晰明了
5. **可扩展** - 轻松添加新装备、新模板、新英雄

## 与旧系统的对比

| 特性     | 旧系统 (Lua)     | 新系统 (TypeScript)    |
| -------- | ---------------- | ---------------------- |
| 配置方式 | 每个装备手动配置 | 只配置目标装备         |
| 装备过渡 | 手动定义每个过渡 | 自动生成路径           |
| 出售逻辑 | 固定规则         | 基于等级和槽位智能判断 |
| 英雄模板 | 无               | 4种预定义模板          |
| 槽位系统 | 无               | 6种槽位类型            |
| 可维护性 | 低               | 高                     |
| 类型安全 | 无               | TypeScript类型检查     |
