import { SellItemCommonList, SellItemHeroList } from './sell-item-config';

/**
 * 出售物品功能类
 */
export class SellItem {
  /**
   * 尝试出售指定物品，如果成功则返回true，否则返回false
   * 包含身上9个格子，中立物品，回城卷轴
   * 不包含储藏处的物品
   * @param hero 英雄单位
   * @param itemName 物品名称
   * @param fullPrice 是否按原价出售，默认false（半价出售）
   * @returns 是否成功出售
   */
  static TryToSellItem(
    hero: CDOTA_BaseNPC_Hero,
    itemName: string,
    fullPrice: boolean = false,
  ): boolean {
    const item = hero.FindItemInInventory(itemName);
    // 没有该物品
    if (!item) {
      return false;
    }

    // 计算出售价格
    const originalCost = GetItemCost(itemName);
    const sellPrice = fullPrice ? originalCost : Math.floor(originalCost / 2);
    hero.ModifyGold(sellPrice, true, ModifyGoldReason.SELL_ITEM);

    // 移除物品
    UTIL_RemoveImmediate(item);
    const priceType = fullPrice ? 'full price' : 'half price';
    print(
      `[AI] SellItem hero: ${hero.GetUnitName()}, item: ${itemName}, sold for ${sellPrice} gold (${priceType})`,
    );
    return true;
  }

  /**
   * 出售垃圾物品 - 当物品栏有7件及以上物品时出售垃圾的物品
   * @param hero 英雄单位
   * @returns 是否出售了物品
   */
  static SellJunkItems(hero: CDOTA_BaseNPC_Hero): boolean {
    const itemCount = hero.GetNumItemsInInventory();

    // 物品栏未满，不需要出售
    if (itemCount < 7) {
      return false;
    }

    // 已经有魔晶buff，则出售魔晶
    if (
      hero.HasItemInInventory('item_aghanims_shard') ||
      hero.HasModifier('modifier_item_aghanims_shard')
    ) {
      const result = this.TryToSellItem(hero, 'item_aghanims_shard', true);
      if (result) {
        return true;
      }
    }

    // 出售包含recipe的物品
    for (let i = 0; i <= 8; i++) {
      const item = hero.GetItemInSlot(i);
      if (!item) continue;

      const itemName = item.GetName();
      if (itemName.includes('recipe')) {
        const result = this.TryToSellItem(hero, itemName, true);
        if (result) {
          return true;
        }
      }
    }

    // 从通用出售列表中寻找要出售的物品
    for (const itemName of SellItemCommonList) {
      if (hero.HasItemInInventory(itemName)) {
        const result = this.TryToSellItem(hero, itemName, true);
        if (result) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 出售过期装备 - 当物品栏有8件及以上物品时出售自定义购买的旧物品
   * @param hero 英雄单位
   * @returns 是否出售了物品
   */
  static SellOutdatedItems(hero: CDOTA_BaseNPC_Hero): boolean {
    const itemCount = hero.GetNumItemsInInventory();

    // 物品栏未满8件，不需要出售
    if (itemCount < 8) {
      return false;
    }

    const heroName = hero.GetUnitName();

    // 从英雄特定出售列表中寻找要出售的旧装备
    const heroSellList = SellItemHeroList[heroName];

    if (heroSellList) {
      for (const itemName of heroSellList) {
        if (hero.HasItemInInventory(itemName)) {
          const result = this.TryToSellItem(hero, itemName);
          if (result) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 智能出售物品 - 统一入口，按优先级处理出售逻辑
   * < 7件      → 不出售
   * ≥ 7件      → 出售垃圾物品
   * ≥ 8件      → 出售垃圾物品 + 过期装备
   * @param hero 英雄单位
   * @returns 是否出售了物品
   */
  static SellItems(hero: CDOTA_BaseNPC_Hero): boolean {
    // 优先出售垃圾物品（7件以上）
    if (this.SellJunkItems(hero)) {
      return true;
    }

    // 再出售过期装备（8件以上）
    if (this.SellOutdatedItems(hero)) {
      return true;
    }

    return false;
  }
}
