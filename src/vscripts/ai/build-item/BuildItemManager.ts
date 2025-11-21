/**
 * Bot出装管理器 - 基于 Tier 驱动的新系统
 * 负责决策购买哪些装备、何时出售旧装备
 */

import { HeroBuildState } from './hero-build-state';
import { ItemSlot, ItemTier, getItemConfig } from './item-tier-config';

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
}

/**
 * 出装管理器
 */
export class BuildItemManager {
  /**
   * 获取英雄下一个应该购买的装备
   * @param hero 英雄单位
   * @param buildState 出装状态（来自 bot-base.ts）
   * @returns 购买决策，如果没有需要购买的返回 undefined
   */
  public static GetNextItemToBuy(
    hero: CDOTA_BaseNPC_Hero,
    buildState: HeroBuildState,
  ): PurchaseDecision | undefined {
    if (!buildState) {
      print(
        `[AI] BuildItemManager.GetNextItemToBuy: buildState is undefined for ${hero.GetUnitName()}`,
      );
      return undefined;
    }

    const gold = hero.GetGold();
    const currentItems = this.GetHeroItems(hero);

    // 更新当前 tier
    buildState.currentTier = this.DetermineCurrentTier(hero, buildState, currentItems);

    // 遍历当前 tier 的装备列表
    const currentTierItems = buildState.resolvedItems[buildState.currentTier];

    if (!currentTierItems || currentTierItems.length === 0) {
      print(
        `[AI] BuildItemManager.GetNextItemToBuy: No items in tier ${buildState.currentTier} for ${hero.GetUnitName()}`,
      );
      return undefined;
    }

    for (const itemName of currentTierItems) {
      // 跳过已拥有的装备
      if (currentItems.includes(itemName)) {
        continue;
      }

      const itemConfig = getItemConfig(itemName);
      if (!itemConfig) {
        continue;
      }

      // 跳过已消耗的消耗品
      if (itemConfig.slot === ItemSlot.Consumable) {
        if (buildState.consumedItems.has(itemName)) {
          continue;
        }
      }

      // 检查金币是否足够
      if (itemConfig.cost <= gold) {
        return {
          itemName: itemName,
          slot: itemConfig.slot,
          tier: buildState.currentTier,
        };
      }
    }

    return undefined;
  }

  /**
   * 判断当前应该购买的 tier
   * @param hero 英雄单位
   * @param buildState 出装状态
   * @param currentItems 当前拥有的装备列表
   * @returns 当前 tier
   */
  private static DetermineCurrentTier(
    hero: CDOTA_BaseNPC_Hero,
    buildState: HeroBuildState,
    currentItems: string[],
  ): ItemTier {
    const gold = hero.GetGold();
    const currentTier = buildState.currentTier;

    // 检查当前 tier 的装备是否都已购买（排除消耗品）
    const currentTierItems = buildState.resolvedItems[currentTier];
    let allBought = true;

    for (const itemName of currentTierItems) {
      const itemConfig = getItemConfig(itemName);
      if (!itemConfig) continue;

      // 消耗品不影响 tier 升级
      if (itemConfig.slot === ItemSlot.Consumable) {
        continue;
      }

      // 非消耗品：检查是否拥有
      if (!currentItems.includes(itemName)) {
        allBought = false;
        break;
      }
    }

    // 如果都买完了（或消耗了），且金币足够，考虑升级 tier
    if (allBought && currentTier < ItemTier.T5) {
      const nextTier = (currentTier + 1) as ItemTier;
      const nextTierItems = buildState.resolvedItems[nextTier];

      if (nextTierItems && nextTierItems.length > 0) {
        // 找到下一 tier 中最便宜的装备
        let minCost = 999999;
        for (const itemName of nextTierItems) {
          const itemConfig = getItemConfig(itemName);
          if (itemConfig && itemConfig.cost < minCost) {
            minCost = itemConfig.cost;
          }
        }

        // 如果金币达到最便宜装备的 50%，就升级 tier
        if (gold >= minCost * 0.5) {
          print(
            `[AI] BuildItemManager.DetermineCurrentTier: ${hero.GetUnitName()} 升级到 T${nextTier} (金币: ${gold}, 最低消费: ${minCost})`,
          );
          return nextTier;
        }
      }
    }

    return currentTier;
  }

  /**
   * 获取英雄当前拥有的所有装备名称列表
   * @param hero 英雄单位
   * @returns 装备名称列表
   */
  public static GetHeroItems(hero: CDOTA_BaseNPC_Hero): string[] {
    const items: string[] = [];

    // 遍历背包 (0-8: 6个背包 + 3个背包栏)
    for (let i = 0; i < 9; i++) {
      const item = hero.GetItemInSlot(i);
      if (item && !item.IsNull()) {
        items.push(item.GetName());
      }
    }

    // 遍历仓库 (9-14)
    for (let i = 9; i < 15; i++) {
      const item = hero.GetItemInSlot(i);
      if (item && !item.IsNull()) {
        items.push(item.GetName());
      }
    }

    // 中立物品槽 (16)
    const neutralItem = hero.GetItemInSlot(16);
    if (neutralItem && !neutralItem.IsNull()) {
      items.push(neutralItem.GetName());
    }

    return items;
  }

  /**
   * 尝试购买装备
   * @param hero 英雄单位
   * @param buildState 出装状态
   * @returns 是否成功购买
   */
  public static TryPurchaseItem(hero: CDOTA_BaseNPC_Hero, buildState: HeroBuildState): boolean {
    // 获取购买决策
    const decision = this.GetNextItemToBuy(hero, buildState);
    if (!decision) {
      return false;
    }

    // 获取装备的实际价格
    const itemCost = GetItemCost(decision.itemName);

    // 再次检查金钱是否足够（防止并发问题）
    const currentGold = hero.GetGold();
    if (currentGold < itemCost) {
      return false;
    }

    // 尝试购买推荐的装备
    const result = hero.AddItemByName(decision.itemName);
    if (result !== undefined) {
      // 扣除金钱
      hero.SpendGold(itemCost, ModifyGoldReason.PURCHASE_ITEM);

      print(
        `[AI] BuildItem ${hero.GetUnitName()} 购买装备: ${decision.itemName} (${decision.slot}, T${decision.tier}) 花费: ${itemCost}金`,
      );
      return true;
    }

    return false;
  }

  /**
   * 比较两个 tier 的大小
   * @returns -1 if tierA < tierB, 0 if equal, 1 if tierA > tierB
   */
  public static CompareTier(tierA: ItemTier, tierB: ItemTier): number {
    return tierA - tierB;
  }
}
