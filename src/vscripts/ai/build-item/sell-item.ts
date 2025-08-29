import {
  AghanimsShardItem,
  SellItemCommonList,
  SellItemHeroList,
  SpecialConsumableItems,
} from './sell-item-config';

/**
 * 出售物品功能类
 */
export class SellItem {
  /**
   * 获取出售物品的阈值
   * @param itemsMap 物品Map
   * @returns 出售阈值，默认7，拥有特殊消耗物品时返回8
   */
  static GetSellThreshold(itemsMap: Map<string, CDOTA_Item[]>): number {
    // 检查是否拥有特殊消耗物品
    for (const consumableItem of SpecialConsumableItems) {
      if (itemsMap.has(consumableItem)) {
        return 8;
      }
    }
    return 7;
  }

  /**
   * 获取英雄物品栏，备用物品栏，储藏处中所有物品的Map
   * 不包含回城卷轴，中立物品
   * @param hero 英雄单位
   * @returns Map<物品名称, 物品对象数组> - 支持同名重复物品
   */
  static GetItemsMapIncludeStash(hero: CDOTA_BaseNPC_Hero): Map<string, CDOTA_Item[]> {
    const itemsMap = new Map<string, CDOTA_Item[]>();
    for (let i = 0; i <= 14; i++) {
      const item = hero.GetItemInSlot(i);
      if (item) {
        const itemName = item.GetName();
        if (!itemsMap.has(itemName)) {
          itemsMap.set(itemName, []);
        }
        itemsMap.get(itemName)!.push(item);
      }
    }

    return itemsMap;
  }

  /**
   * 尝试出售指定物品，如果成功则返回true，否则返回false
   * @param hero 英雄单位
   * @param items 物品数组
   * @param itemName 物品名称
   * @param fullPrice 是否按原价出售，默认false（半价出售）
   * @returns 是否成功出售
   */
  static SellItem(
    hero: CDOTA_BaseNPC_Hero,
    items: CDOTA_Item[],
    itemName: string,
    fullPrice: boolean = false,
  ): boolean {
    // 检查物品数组和第一个物品
    if (!items) {
      print(
        `[AI] SellItem ERROR: items is null, hero: ${hero.GetUnitName()}, itemName: ${itemName}`,
      );
      return false;
    }

    const item = items[0];
    if (!item) {
      print(
        `[AI] SellItem ERROR: item is null, hero: ${hero.GetUnitName()}, itemName: ${itemName}`,
      );
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
   * 出售魔晶 - 已经有魔晶buff时出售魔晶物品
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellAghanimsShard(hero: CDOTA_BaseNPC_Hero, itemsMap: Map<string, CDOTA_Item[]>): boolean {
    if (itemsMap.has(AghanimsShardItem) && hero.HasModifier('modifier_item_aghanims_shard')) {
      const shardItems = itemsMap.get(AghanimsShardItem)!;
      return this.SellItem(hero, shardItems, AghanimsShardItem, true);
    }
    return false;
  }

  /**
   * 出售配方物品 - 出售包含recipe的物品
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellRecipeItems(hero: CDOTA_BaseNPC_Hero, itemsMap: Map<string, CDOTA_Item[]>): boolean {
    for (const [itemName, items] of itemsMap) {
      if (itemName.includes('recipe')) {
        return this.SellItem(hero, items, itemName, true);
      }
    }
    return false;
  }

  /**
   * 出售通用垃圾物品 - 从通用出售列表中寻找要出售的物品
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellCommonJunkItems(
    hero: CDOTA_BaseNPC_Hero,
    itemsMap: Map<string, CDOTA_Item[]>,
  ): boolean {
    for (const itemName of SellItemCommonList) {
      if (itemsMap.has(itemName)) {
        const items = itemsMap.get(itemName)!;
        return this.SellItem(hero, items, itemName, true);
      }
    }
    return false;
  }

  /**
   * 出售英雄特定物品 - 从英雄特定出售列表中寻找要出售的旧装备
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellHeroSpecificItems(
    hero: CDOTA_BaseNPC_Hero,
    itemsMap: Map<string, CDOTA_Item[]>,
  ): boolean {
    const heroSellList = SellItemHeroList[hero.GetUnitName()];

    if (!heroSellList) {
      return false;
    }

    for (const itemName of heroSellList) {
      if (itemsMap.has(itemName)) {
        const items = itemsMap.get(itemName)!;
        return this.SellItem(hero, items, itemName);
      }
    }

    return false;
  }

  /**
   * 出售多余的物品
   * @param hero 英雄单位
   * @returns 是否出售了物品
   */
  static SellExtraItems(hero: CDOTA_BaseNPC_Hero): boolean {
    // 获取物品Map
    const itemsMap = this.GetItemsMapIncludeStash(hero);

    // 计算总物品数量
    let totalItemCount = 0;
    for (const items of itemsMap.values()) {
      totalItemCount += items.length;
    }

    // 获取出售阈值
    const sellThreshold = this.GetSellThreshold(itemsMap);

    // 物品栏未达到阈值，不需要出售
    if (totalItemCount < sellThreshold) {
      return false;
    }

    // 按优先级尝试出售物品
    // 1. 出售魔晶（已有buff时）
    if (this.SellAghanimsShard(hero, itemsMap)) {
      return true;
    }

    // 2. 出售配方物品
    if (this.SellRecipeItems(hero, itemsMap)) {
      return true;
    }

    // 3. 出售通用垃圾物品
    if (this.SellCommonJunkItems(hero, itemsMap)) {
      return true;
    }

    // 4. 出售英雄特定物品
    if (this.SellHeroSpecificItems(hero, itemsMap)) {
      return true;
    }

    return false;
  }
}
