import { SellItemCommonList, SellItemHeroList, SpecialConsumableItems } from './sell-item-config';

/**
 * 出售物品功能类
 */
export class SellItem {
  /**
   * 获取出售物品的阈值
   * @param itemsMap 物品Map
   * @returns 出售阈值，默认7，拥有特殊消耗物品时返回8
   */
  static getSellThreshold(itemsMap: Map<string, CDOTA_Item>): number {
    // 检查是否拥有特殊消耗物品
    for (const consumableItem of SpecialConsumableItems) {
      if (itemsMap.has(consumableItem)) {
        return 8;
      }
    }
    return 7;
  }

  /**
   * 获取英雄物品栏中所有物品的Map
   * @param hero 英雄单位
   * @returns Map<物品名称, 物品对象>
   */
  static getItemsMap(hero: CDOTA_BaseNPC_Hero): Map<string, CDOTA_Item> {
    const itemsMap = new Map<string, CDOTA_Item>();
    for (let i = 0; i <= 8; i++) {
      const item = hero.GetItemInSlot(i);
      if (item) {
        itemsMap.set(item.GetName(), item);
      }
    }
    return itemsMap;
  }

  /**
   * 尝试出售指定物品，如果成功则返回true，否则返回false
   * 包含身上9个格子，中立物品，回城卷轴
   * 不包含储藏处的物品
   * @param hero 英雄单位
   * @param item 物品对象
   * @param itemName 物品名称
   * @param fullPrice 是否按原价出售，默认false（半价出售）
   * @returns 是否成功出售
   */
  static SellItem(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    itemName: string,
    fullPrice: boolean = false,
  ): boolean {
    // 物品不存在
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
   * 出售多余的物品
   * @param hero 英雄单位
   * @returns 是否出售了物品
   */
  static SellExtraItems(hero: CDOTA_BaseNPC_Hero): boolean {
    // 获取物品Map
    const itemsMap = this.getItemsMap(hero);

    // 获取出售阈值
    const sellThreshold = this.getSellThreshold(itemsMap);

    // 物品栏未达到阈值，不需要出售
    if (itemsMap.size < sellThreshold) {
      return false;
    }

    // 已经有魔晶buff，则出售魔晶
    if (itemsMap.has('item_aghanims_shard') && hero.HasModifier('modifier_item_aghanims_shard')) {
      const shardItem = itemsMap.get('item_aghanims_shard');
      if (shardItem) {
        const result = this.SellItem(hero, shardItem, 'item_aghanims_shard', true);
        if (result) {
          return true;
        }
      }
    }

    // 出售包含recipe的物品
    for (const [itemName, item] of itemsMap) {
      if (itemName.includes('recipe')) {
        const result = this.SellItem(hero, item, itemName, true);
        if (result) {
          return true;
        }
      }
    }

    // 从通用出售列表中寻找要出售的物品
    for (const itemName of SellItemCommonList) {
      if (itemsMap.has(itemName)) {
        const item = itemsMap.get(itemName);
        if (item) {
          const result = this.SellItem(hero, item, itemName, true);
          if (result) {
            return true;
          }
        }
      }
    }

    // 从英雄特定出售列表中寻找要出售的旧装备
    const heroSellList = SellItemHeroList[hero.GetUnitName()];

    if (heroSellList !== undefined) {
      for (const itemName of heroSellList) {
        if (itemsMap.has(itemName)) {
          const item = itemsMap.get(itemName);
          if (item) {
            const result = this.SellItem(hero, item, itemName);
            if (result) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}
