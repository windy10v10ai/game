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

2. **装备升级关系系统**

   - **下位装备（前置装备）**：单向链，只配置直接关联的前置装备，系统自动递归补全
   - **上位装备（升级装备）**：一对多关系，系统自动生成，用于智能出售判定

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
   - 拥有上位装备时自动出售下位装备
   - 基于装备等级和升级关系智能判断
   - 避免背包浪费和金钱浪费

## 文件结构

```
src/vscripts/ai/build-item/
├── hero-build-manager.ts        # 核心管理器
├── item-tier-config.ts          # 装备等级配置 (160+装备，包含升级关系函数)
├── hero-build-config-template.ts # 英雄模板配置 (5种模板)
├── hero-build-config.ts         # 英雄出装配置 (示例9个英雄)
├── hero-build-state.ts          # 出装状态管理
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

### 4. 配置说明

- **template**: 可选,指定使用的模板
- **targetItemsByTier**: 可选,按 tier 设置目标装备
  - 每个 tier 可以配置多个装备（数组）
  - 系统会自动补全前置装备（下位装备）
  - 系统会从模板中补充空缺的 tier

## 工作原理

### 购买决策流程

1. **填充用户配置** - 将配置的目标装备按 tier 填充到出装列表
2. **补全前置装备** - 为高 tier 装备递归补全所有前置装备（下位装备）
3. **使用模板填充** - 对于装备数量少于 6 个的 tier，从模板中补充装备
4. **购买决策** - 按 tier 顺序购买，优先购买当前 tier 的装备

### 出售决策流程

在 `SellItem.SellExtraItems()` 中按以下优先级执行:

1. **智能出售低级装备** (装备数量 > 6 时)

   - 检查是否有上位装备（升级装备）
   - 如果拥有上位装备，自动出售下位装备
   - 基于装备等级和升级关系智能判断

2. **传统出售系统** (fallback):
   - 出售已消耗的物品(魔晶、急速之翼等)
   - 出售配方物品
   - 出售通用垃圾物品
   - 出售重复物品
   - 出售被升级替代的装备
   - 出售英雄特定物品
   - 按价值顺序出售物品(初级→中级→高级)

### 前置装备补全

假设配置了 `item_excalibur` (T4):

系统会自动补全前置装备链:

```
item_rapier (T3) ← item_excalibur 的 prerequisite
→ item_excalibur (T4) ← 目标
```

如果 `item_rapier` 也有前置装备，会继续递归补全，直到没有前置装备为止。

## 示例配置

### 敏捷核心(远程) - Luna

```typescript
npc_dota_hero_luna: {
  template: HeroTemplate.AgilityCarryRanged,
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

### 法师核心 - Lion

```typescript
npc_dota_hero_lion: {
  template: HeroTemplate.MagicalCarry,
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

### 力量坦克 - Axe

```typescript
npc_dota_hero_axe: {
  template: HeroTemplate.StrengthTank,
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
  prerequisite: 'item_base_item', // 可选：直接前置装备
  upgradesTo: ['item_upgraded_version'], // 可选：可升级到的装备列表
}
```

## 修改模板

在`hero-build-config-template.ts`中修改对应模板的`itemsByTier`:

```typescript
const AgilityCarryRangedTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryRanged,
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
[AI] SellLowTierItems npc_dota_hero_luna 出售下位装备: item_wraith_band (已拥有上位装备: item_monkey_king_bar_2)
```

## 优势

1. **配置简单** - 只需配置最终目标,系统自动处理过渡
2. **灵活性高** - 按 tier 配置,支持多个目标装备
3. **智能出售** - 基于升级关系自动出售下位装备,避免浪费
4. **易于维护** - 装备、模板、英雄配置分离,清晰明了
5. **可扩展** - 轻松添加新装备、新模板、新英雄
6. **自动补全** - 前置装备自动递归补全,无需手动配置

## 与旧系统的对比

| 特性     | 旧系统 (Lua)     | 新系统 (TypeScript)  |
| -------- | ---------------- | -------------------- |
| 配置方式 | 每个装备手动配置 | 只配置目标装备       |
| 装备过渡 | 手动定义每个过渡 | 自动递归补全前置装备 |
| 出售逻辑 | 固定规则         | 基于升级关系智能判断 |
| 英雄模板 | 无               | 5种预定义模板        |
| 装备组织 | 无               | 按 tier 组织         |
| 可维护性 | 低               | 高                   |
| 类型安全 | 无               | TypeScript类型检查   |
