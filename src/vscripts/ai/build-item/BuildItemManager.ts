/**
 * Bot出装管理器 - 基于 Tier 驱动的新系统
 * 负责决策购买哪些装备、何时出售旧装备
 */

import { ActionItem } from '../action/action-item';
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

    // 如果都买完了（或消耗了）
    if (allBought && currentTier < ItemTier.T5) {
      const nextTier = (currentTier + 1) as ItemTier;

      print(
        `[AI] BuildItemManager.DetermineCurrentTier: ${hero.GetUnitName()} 升级到 T${nextTier}`,
      );
      return nextTier;
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
    const currentItems = this.GetHeroItems(hero);
    if (this.TryPurchaseConsumable(hero, buildState, currentItems)) {
      return true;
    }
    if (this.TryPurchaseNormalItem(hero, buildState, currentItems)) {
      return true;
    }
    return false;
  }

  private static TryPurchaseConsumable(
    hero: CDOTA_BaseNPC_Hero,
    buildState: HeroBuildState,
    currentItems: string[],
  ): boolean {
    const currentTier = buildState.currentTier;

    // 优先处理当前 tier 的消耗品
    const currentTierConsumables = buildState.consumables[currentTier];
    if (!currentTierConsumables) {
      return false;
    }

    // 尝试购买第一个可用的消耗品
    for (const itemName of currentTierConsumables) {
      const result = ActionItem.BuyItem(hero, itemName);
      if (result) {
        // 从消耗品列表中移除
        const index = currentTierConsumables.indexOf(itemName);
        if (index !== -1) {
          currentTierConsumables.splice(index, 1);
          print(
            `[AI] BuildItem ${hero.GetUnitName()} 从消耗品列表移除: ${itemName} (T${currentTier})`,
          );
        }
        // 购买成功后，更新当前 tier（减少调用次数）
        buildState.currentTier = this.DetermineCurrentTier(hero, buildState, currentItems);
        return true;
      }
    }
    return false;
  }

  private static TryPurchaseNormalItem(
    hero: CDOTA_BaseNPC_Hero,
    buildState: HeroBuildState,
    currentItems: string[],
  ): boolean {
    const currentTier = buildState.currentTier;

    // 当前 tier 的普通装备
    const currentTierItems = buildState.resolvedItems[currentTier];
    if (!currentTierItems) {
      return false;
    }

    // 尝试购买第一个可用的普通装备
    for (const itemName of currentTierItems) {
      const result = ActionItem.BuyItem(hero, itemName);
      if (result) {
        // 购买成功后，更新当前 tier（减少调用次数）
        buildState.currentTier = this.DetermineCurrentTier(hero, buildState, currentItems);
        return true;
      }
    }
    return false;
  }
}
