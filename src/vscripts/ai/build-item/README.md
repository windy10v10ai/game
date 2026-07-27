# Bot出装系统 (Build Item System)

全新的基于装备等级的Bot出装系统,提供智能的装备购买和出售决策。

## 系统概述

### 核心特性

1. **装备等级系统** (5个等级)

   - T1: <2000金币 - 前期装备
   - T2: 2000-5000金币 - 中期装备
   - T3: 5000-10,000金币 - 中后期装备
   - T4: 10,000-30,000金币 - 后期装备
   - T5: >30,000金币 - 终极装备

2. **装备替代关系系统**

   - **下位装备（材料/前置版本）**：只配置 `baseItems`（直接下一层，多条合成路线写多个）
   - **替代关系**：系统开局对 `baseItems` 做传递闭包，自动得到每件装备替代的全部下位装备，用于智能出售判定

3. **英雄模板系统** (按英雄真实主属性 AttributePrimary 划分为4种模板)

   - Strength: 力量 (Axe, Pudge, Sven等)
   - Agility: 敏捷 (PA, Riki, Luna, Drow, Sniper等)
   - Intelligence: 智力 (Lion, Lina, Crystal Maiden, Dazzle等)
   - Universal: 全才/ALL属性 (Death Prophet等)

   护腕/怨灵系带/空灵挂件这类同价位三选一属性配件，必须按英雄真实主属性匹配（力量用护腕、敏捷用怨灵系带、智力用空灵挂件），不能跨属性混用。

4. **智能装备过渡**

   - 自动根据目标装备生成购买路径
   - 按照模板定义的装备链逐级购买
   - 无需手动配置每个过渡装备

5. **智能装备出售**
   - 拥有上位装备时自动出售下位装备
   - 基于装备等级和升级关系智能判断
   - 避免背包浪费和金钱浪费

## 文件结构

```
src/vscripts/ai/build-item/
├── hero-build-manager.ts        # 核心管理器
├── item-tier-config.ts          # 装备等级配置 (160+装备，包含升级关系函数)
├── hero-build-config-template.ts # 英雄模板配置 (4种模板)
├── hero-build-config.ts         # 英雄出装配置 (示例9个英雄)
├── hero-build-state.ts          # 出装状态管理
└── README.md                    # 本文档
```

## 配置英雄出装

### 1. 基础配置 - 选择模板

```typescript
// 在 hero-build-config.ts 中添加，template 按英雄真实主属性选择
npc_dota_hero_your_hero: {
  template: HeroTemplate.Intelligence,  // 使用智力模板
}
```

### 2. 高级配置 - 自定义目标装备

```typescript
npc_dota_hero_luna: {
  template: HeroTemplate.Agility,
  targetItemsByTier: {
    // 按 tier 配置目标装备
    [ItemTier.T3]: ['item_monkey_king_bar_2'], // 定海神针
    [ItemTier.T4]: [
      'item_excalibur',          // 圣剑
      'item_skadi_2',            // 大冰眼
      'item_satanic_2',          // 真·撒旦
      'item_black_king_bar_2',  // 真·BKB
    ],
  },
}
```

### 3. 配置说明

- **template**: 可选,指定使用的模板
- **targetItemsByTier**: 可选,按 tier 设置目标装备
  - 每个 tier 可以配置多个装备（数组），候选池需保证足够数量（见 `bot-item-build` skill）
  - 系统会从模板中补充空缺的 tier

## 工作原理

### 购买决策流程

1. **填充用户配置** - 将配置的目标装备按 tier 填充到出装列表
2. **使用模板填充** - 对于装备数量少于 6 个的 tier，从模板中补充装备
3. **购买决策** - 按 tier 顺序购买，优先购买当前 tier 的装备

### 出售决策流程

在 `SellItem.SellExtraItems()` 中按以下顺序执行:

1. 出售已消耗的物品（魔晶、急速之翼等）
2. 出售配方物品
3. 出售重复物品
4. 出售通用垃圾物品
5. **出售被替代的装备** - 拥有上位装备时，出售其 `baseItems` 材料链上的所有下位装备
6. 出售出装表中低于当前 tier 的残留装备
7. 按价值顺序出售物品（初级→中级→高级→特殊道具）

### 装备替代关系

假设 `item_hallowed_scepter` 配置为 `baseItems: ['item_magic_scepter']`，而
`item_magic_scepter` 配置为 `baseItems: ['item_kaya']`：

系统开局会对 `baseItems` 做传递闭包，得到 `item_hallowed_scepter` 替代
`item_magic_scepter` 和 `item_kaya` 两件下位装备，拥有前者时二者都会被自动出售。

## 示例配置

### 敏捷 - Luna

```typescript
npc_dota_hero_luna: {
  template: HeroTemplate.Agility,
  targetItemsByTier: {
    [ItemTier.T3]: ['item_monkey_king_bar_2'],
    [ItemTier.T4]: [
      'item_excalibur',
      'item_skadi_2',
      'item_satanic_2',
      'item_black_king_bar_2',
    ],
  },
}
```

### 智力 - Lion

```typescript
npc_dota_hero_lion: {
  template: HeroTemplate.Intelligence,
  targetItemsByTier: {
    [ItemTier.T3]: ['item_aeon_pendant'],
    [ItemTier.T4]: [
      'item_hallowed_scepter',
      'item_necronomicon_staff',
      'item_refresh_core',
      'item_arcane_blink',
    ],
  },
}
```

### 力量 - Axe

```typescript
npc_dota_hero_axe: {
  template: HeroTemplate.Strength,
  targetItemsByTier: {
    [ItemTier.T3]: ['item_blade_mail_2', 'item_radiance_2'],
    [ItemTier.T4]: [
      'item_undying_heart',
      'item_shivas_guard_2',
      'item_black_king_bar_2',
      'item_jump_jump_jump',
    ],
  },
}
```

## 添加新装备

在`item-tier-config.ts`中添加:

```typescript
item_your_new_item: {
  name: 'item_your_new_item',
  tier: ItemTier.T3,
  cost: 8000,
  baseItems: ['item_base_item'], // 可选：直接下位装备（材料/前置版本），多条合成路线写多个
}
```

## 修改模板

在`hero-build-config-template.ts`中修改对应模板的`itemsByTier`:

```typescript
const AgilityTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Agility,
  itemsByTier: {
    [ItemTier.T1]: ["item_boots", "item_power_treads", "item_wraith_band"],
    [ItemTier.T2]: ["item_sange_and_yasha", "item_monkey_king_bar"],
    [ItemTier.T3]: ["item_monkey_king_bar_2", "item_your_new_item"], // 添加新装备
    [ItemTier.T4]: ["item_excalibur"],
  },
};
```

## 调试

系统会在购买和出售时打印日志:

```
[AI] InitializeHeroBuild npc_dota_hero_luna 初始化出装:
  T1: item_boots, item_power_treads, item_wraith_band
  T2: item_sange_and_yasha, item_monkey_king_bar
  T3: item_monkey_king_bar_2
  T4: item_excalibur
[AI] BuildItem npc_dota_hero_luna 购买装备: item_wraith_band (T1)
[AI] SellReplacedItems npc_dota_hero_luna 出售被替代装备: item_wraith_band (已拥有: item_monkey_king_bar_2)
```

## 优势

1. **配置简单** - 只需配置最终目标,系统自动处理过渡
2. **灵活性高** - 按 tier 配置,支持多个目标装备
3. **智能出售** - 基于 `baseItems` 传递闭包自动出售下位装备,避免浪费
4. **易于维护** - 装备、模板、英雄配置分离,清晰明了
5. **可扩展** - 轻松添加新装备、新模板、新英雄
6. **类型安全** - TypeScript类型检查
