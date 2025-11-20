/**
 * Bot出装管理器
 * 负责决策购买哪些装备、何时出售旧装备
 */

import { HeroBuildConfig, getHeroBuildConfig } from './hero-build-config';
import { HeroTemplate, getTemplateItemChain } from './hero-template-config';
import { ItemSlot, ItemTier, getItemConfig, getItemSlot, getItemTier } from './item-tier-config';

/**
 * 装备购买决策结果
 */
export interface PurchaseDecision {
  /** 推荐购买的装备名称 */
  itemName: string;
  /** 装备槽位 */
  slot: ItemSlot;
  /** 装备等级 */
  tier: ItemTier;
  /** 是否为消耗品 */
  isConsumable: boolean;
}

/**
 * 出装管理器
 */
export class BuildItemManager {
  /**
   * 获取英雄下一个应该购买的装备
   * @param hero 英雄单位
   * @returns 购买决策,如果没有需要购买的返回undefined
   */
  public static GetNextItemToBuy(hero: CDOTA_BaseNPC_Hero): PurchaseDecision | undefined {
    const heroName = hero.GetUnitName();
    const gold = hero.GetGold();

    // 1. 获取英雄的出装配置
    const buildConfig = getHeroBuildConfig(heroName);
    if (!buildConfig) {
      // 如果没有配置,使用默认的PhysicalCarry模板
      return this.GetNextItemFromTemplate(hero, HeroTemplate.PhysicalCarry, gold);
    }

    // 2. 根据配置的目标装备购买常规装备
    if (buildConfig.targetItems) {
      const regularDecision = this.PurchaseRegularItem(hero, buildConfig, gold);
      if (regularDecision) {
        return regularDecision;
      }
    }

    // 3. 如果配置了模板但目标装备都买齐了,从模板中找其他装备(包括消耗品)
    if (buildConfig.template) {
      return this.GetNextItemFromTemplate(hero, buildConfig.template, gold);
    }

    return undefined;
  }

  /**
   * 购买常规装备(非消耗品)
   */
  private static PurchaseRegularItem(
    hero: CDOTA_BaseNPC_Hero,
    buildConfig: HeroBuildConfig,
    gold: number,
  ): PurchaseDecision | undefined {
    if (!buildConfig.targetItems) {
      return undefined;
    }

    const currentItems = this.GetHeroItems(hero);

    // 遍历所有配置的槽位
    for (const slot of Object.values(ItemSlot)) {
      if (slot === ItemSlot.Consumable) {
        continue; // 消耗品单独处理
      }

      const targetItems = buildConfig.targetItems[slot];
      if (!targetItems) {
        continue; // 这个槽位没有配置目标装备
      }

      // 目标装备可能是单个装备名或数组
      const targetItemList = typeof targetItems === 'string' ? [targetItems] : targetItems;

      // 检查每个目标装备
      for (const targetItem of targetItemList) {
        // 如果已经拥有这个目标装备,跳过
        if (currentItems.includes(targetItem)) {
          continue;
        }

        // 生成到达目标装备的过渡路径
        const transitionPath = this.GenerateTransitionPath(targetItem, slot, buildConfig.template);

        // 找到过渡路径中第一个还没买且买得起的装备
        for (const itemName of transitionPath) {
          if (currentItems.includes(itemName)) {
            continue; // 已经有了
          }

          const itemConfig = getItemConfig(itemName);
          if (!itemConfig) {
            continue;
          }

          if (itemConfig.cost <= gold) {
            // 找到了可以购买的装备
            return {
              itemName: itemName,
              slot: slot,
              tier: itemConfig.tier,
              isConsumable: false,
            };
          }
        }
      }
    }

    return undefined;
  }

  /**
   * 从模板中获取下一个要购买的装备
   */
  private static GetNextItemFromTemplate(
    hero: CDOTA_BaseNPC_Hero,
    template: HeroTemplate,
    gold: number,
  ): PurchaseDecision | undefined {
    const currentItems = this.GetHeroItems(hero);

    // 遍历所有槽位
    for (const slot of Object.values(ItemSlot)) {
      if (slot === ItemSlot.Consumable) {
        continue; // 消耗品不从模板购买
      }

      const itemChain = getTemplateItemChain(template, slot);
      if (!itemChain || itemChain.length === 0) {
        continue;
      }

      // 找到装备链中第一个还没买且买得起的装备
      for (const itemName of itemChain) {
        if (currentItems.includes(itemName)) {
          continue;
        }

        const itemConfig = getItemConfig(itemName);
        if (!itemConfig) {
          continue;
        }

        if (itemConfig.cost <= gold) {
          return {
            itemName: itemName,
            slot: slot,
            tier: itemConfig.tier,
            isConsumable: false,
          };
        }
      }
    }

    return undefined;
  }

  /**
   * 生成到达目标装备的过渡路径
   * @param targetItem 目标装备名称
   * @param slot 装备槽位
   * @param template 使用的模板(如果有)
   * @returns 装备名称列表,从低tier到目标装备
   */
  private static GenerateTransitionPath(
    targetItem: string,
    slot: ItemSlot,
    template?: HeroTemplate,
  ): string[] {
    // 如果没有模板,直接返回目标装备
    if (!template) {
      return [targetItem];
    }

    // 从模板中获取这个槽位的装备链
    const itemChain = getTemplateItemChain(template, slot);
    if (!itemChain || itemChain.length === 0) {
      return [targetItem];
    }

    // 找到目标装备在链中的位置
    const targetIndex = itemChain.indexOf(targetItem);
    if (targetIndex === -1) {
      // 目标装备不在模板链中,直接返回
      return [targetItem];
    }

    // 返回从开始到目标装备的所有装备
    return itemChain.slice(0, targetIndex + 1);
  }

  /**
   * 判断是否应该出售某个装备
   * @param hero 英雄单位
   * @param itemName 要判断的装备名称
   * @returns 是否应该出售
   */
  public static ShouldSellItem(hero: CDOTA_BaseNPC_Hero, itemName: string): boolean {
    const heroName = hero.GetUnitName();

    // 获取装备的槽位和等级
    const itemSlot = getItemSlot(itemName);
    const itemTier = getItemTier(itemName);

    if (!itemSlot || !itemTier) {
      return false; // 未知装备,不出售
    }

    // 消耗品不通过这个逻辑出售
    if (itemSlot === ItemSlot.Consumable) {
      return false;
    }

    // 获取英雄的出装配置
    const buildConfig = getHeroBuildConfig(heroName);
    if (!buildConfig || !buildConfig.targetItems) {
      return false; // 没有配置,不出售
    }

    // 获取这个槽位的目标装备
    const targetItems = buildConfig.targetItems[itemSlot];
    if (!targetItems) {
      // 这个槽位没有配置目标,不出售现有装备
      return false;
    }

    const targetItemList = typeof targetItems === 'string' ? [targetItems] : targetItems;

    // 检查是否已经拥有更高级的目标装备
    const currentItems = this.GetHeroItems(hero);
    for (const targetItem of targetItemList) {
      if (currentItems.includes(targetItem)) {
        // 已经有目标装备了
        const targetTier = getItemTier(targetItem);
        if (targetTier && this.CompareTier(itemTier, targetTier) < 0) {
          // 当前装备等级低于目标装备,应该出售
          return true;
        }
      }
    }

    // 检查是否有同槽位的更高级装备
    for (const currentItemName of currentItems) {
      if (currentItemName === itemName) {
        continue;
      }

      const currentItemSlot = getItemSlot(currentItemName);
      if (currentItemSlot !== itemSlot) {
        continue; // 不是同一个槽位
      }

      const currentItemTier = getItemTier(currentItemName);
      if (!currentItemTier) {
        continue;
      }

      if (this.CompareTier(itemTier, currentItemTier) < 0) {
        // 有同槽位的更高级装备,应该出售这个低级装备
        return true;
      }
    }

    return false;
  }

  /**
   * 获取英雄当前拥有的所有装备名称
   */
  private static GetHeroItems(hero: CDOTA_BaseNPC_Hero): string[] {
    const items: string[] = [];

    // 遍历所有装备栏位 (0-8: 背包和物品栏,不包括中立物品)
    for (let i = 0; i < 9; i++) {
      const item = hero.GetItemInSlot(i);
      if (item) {
        items.push(item.GetName());
      }
    }

    return items;
  }

  /**
   * 比较两个装备等级
   * @returns -1: tier1 < tier2, 0: tier1 == tier2, 1: tier1 > tier2
   */
  private static CompareTier(tier1: ItemTier, tier2: ItemTier): number {
    const tierOrder = {
      [ItemTier.T1]: 1,
      [ItemTier.T2]: 2,
      [ItemTier.T3]: 3,
      [ItemTier.T4]: 4,
      [ItemTier.T5]: 5,
    };

    const order1 = tierOrder[tier1];
    const order2 = tierOrder[tier2];

    if (order1 < order2) return -1;
    if (order1 > order2) return 1;
    return 0;
  }
}
