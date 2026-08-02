import { HeroBuildState } from './hero-build-state';
import { GetReplacedItems, ItemTier } from './item-tier-config';
import {
  NeverSellItems,
  SellItemCommonJunkList,
  SpecialConsumableItems,
  ValueBasedSellItemsList,
} from './sell-item-config';

/**
 * 出售物品功能类
 */
export class SellItem {
  /**
   * 获取出售物品的阈值，物品数量达到阈值时开始出售物品
   * @param itemsMap 物品Map
   * @returns 出售阈值，默认7，拥有特殊消耗物品时最高9个
   */
  static GetSellThreshold(itemsMap: Map<string, CDOTA_Item[]>): number {
    // 检查是否拥有特殊消耗物品
    // 消耗品数量
    let consumableCount = 0;
    for (const items of itemsMap.values()) {
      for (const item of items) {
        if (SpecialConsumableItems.includes(item.GetName())) {
          consumableCount++;
        }
      }
    }
    const threshold = 7;
    return Math.min(threshold + consumableCount, 9);
  }

  /**
   * 获取英雄物品栏，备用物品栏，储藏处中所有物品的Map
   * 不包含回城卷轴，中立物品
   * @param hero 英雄单位
   * @returns Map<物品名称, 物品对象数组> - 支持同名重复物品
   */
  static GetItemsMapIncludeStash(hero: CDOTA_BaseNPC_Hero): Map<string, CDOTA_Item[]> {
    const itemsMap = new Map<string, CDOTA_Item[]>();
    for (let i = 0; i < 15; i++) {
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
   * 获取英雄随身物品栏（0-8号槽位，不含储藏室）的物品Map，用于判断是否触发出售
   * @param hero 英雄单位
   * @returns Map<物品名称, 物品对象数组> - 支持同名重复物品
   */
  static GetFieldItemsMap(hero: CDOTA_BaseNPC_Hero): Map<string, CDOTA_Item[]> {
    const itemsMap = new Map<string, CDOTA_Item[]>();
    for (let i = 0; i < 9; i++) {
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
    // const priceType = fullPrice ? 'full price' : 'half price';
    // print(
    //   `[AI] SellItem hero: ${hero.GetUnitName()}, item: ${itemName}, sold for ${sellPrice} gold (${priceType})`,
    // );
    return true;
  }

  /**
   * 出售已消耗的物品 - 已经获得buff时出售对应物品
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellConsumedItems(hero: CDOTA_BaseNPC_Hero, itemsMap: Map<string, CDOTA_Item[]>): boolean {
    // 出售魔晶 - 已经有魔晶buff时出售魔晶物品
    const aghanimsShardItem = 'item_aghanims_shard';
    if (itemsMap.has(aghanimsShardItem) && hero.HasModifier('modifier_item_aghanims_shard')) {
      const shardItems = itemsMap.get(aghanimsShardItem)!;
      return this.SellItem(hero, shardItems, aghanimsShardItem, true);
    }
    // 出售急速之翼的配方鞋子 - 已消耗急速之翼时出售其配方中的鞋子
    if (hero.HasModifier('modifier_item_wings_of_haste_consumed')) {
      // 急速之翼的配方鞋子：相位鞋、奥术鞋、静谧鞋
      const bootsList = ['item_power_treads', 'item_arcane_boots', 'item_tranquil_boots'];
      for (const bootItem of bootsList) {
        if (itemsMap.has(bootItem)) {
          const items = itemsMap.get(bootItem)!;
          print(`[AI] SellConsumedItems ${hero.GetUnitName()} 出售急速之翼的配方鞋子: ${bootItem}`);
          return this.SellItem(hero, items, bootItem, true);
        }
      }
    }

    // 出售真·阿哈利姆神杖相关物品 - 已消耗真·阿哈利姆神杖时出售相关物品
    if (hero.HasModifier('modifier_item_ultimate_scepter_2_consumed')) {
      // 出售普通阿哈利姆神杖
      const aghanimsScepter = 'item_ultimate_scepter';
      if (itemsMap.has(aghanimsScepter)) {
        const items = itemsMap.get(aghanimsScepter)!;
        print(`[AI] SellConsumedItems ${hero.GetUnitName()} 出售阿哈利姆神杖（已有真·神杖buff）`);
        return this.SellItem(hero, items, aghanimsScepter, true);
      }
      // 出售真·阿哈利姆神杖
      const ultimateScepter = 'item_ultimate_scepter_2';
      if (itemsMap.has(ultimateScepter)) {
        const items = itemsMap.get(ultimateScepter)!;
        print(`[AI] SellConsumedItems ${hero.GetUnitName()} 出售真·阿哈利姆神杖`);
        return this.SellItem(hero, items, ultimateScepter, true);
      }
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
    for (const itemName of SellItemCommonJunkList) {
      if (itemsMap.has(itemName)) {
        const items = itemsMap.get(itemName)!;
        return this.SellItem(hero, items, itemName, true);
      }
    }
    return false;
  }

  /**
   * 出售重复物品 - 出售数量超过1个的物品中多余的
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellDuplicateItems(
    hero: CDOTA_BaseNPC_Hero,
    itemsMap: Map<string, CDOTA_Item[]>,
  ): boolean {
    for (const [itemName, items] of itemsMap) {
      if (NeverSellItems.includes(itemName)) {
        continue;
      }
      if (items.length > 1) {
        return this.SellItem(hero, items, itemName, true);
      }
    }
    return false;
  }

  /**
   * 按价值顺序出售物品 - 当物品数量过多时按价值从低到高出售物品
   * 包括初级(<2k)、中级(2k~5k)、高级(5k~10k)物品
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellItemsByValue(hero: CDOTA_BaseNPC_Hero, itemsMap: Map<string, CDOTA_Item[]>): boolean {
    for (const itemName of ValueBasedSellItemsList) {
      if (itemsMap.has(itemName)) {
        const items = itemsMap.get(itemName)!;
        print(`[AI] SellItemsByValue ${hero.GetUnitName()} 按价值出售物品: ${itemName}`);
        return this.SellItem(hero, items, itemName, true);
      }
    }
    return false;
  }

  /**
   * 出售被替代的下位装备 - 拥有上位装备（含合成材料链的传递闭包）时出售
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @returns 是否出售了物品
   */
  static SellReplacedItems(hero: CDOTA_BaseNPC_Hero, itemsMap: Map<string, CDOTA_Item[]>): boolean {
    for (const ownedItem of itemsMap.keys()) {
      const replacedItems = GetReplacedItems(ownedItem);
      for (const replacedItem of replacedItems) {
        if (itemsMap.has(replacedItem)) {
          const items = itemsMap.get(replacedItem)!;
          print(
            `[AI] SellReplacedItems ${hero.GetUnitName()} 出售被替代装备: ${replacedItem} (已拥有: ${ownedItem})`,
          );
          return this.SellItem(hero, items, replacedItem, true);
        }
      }
    }
    return false;
  }

  /**
   * 出售出装表中低于当前 tier 的残留装备（无替代关系的过时装备）
   * @param hero 英雄单位
   * @param itemsMap 物品Map
   * @param buildState 出装状态
   * @returns 是否出售了物品
   */
  static SellOutdatedTierItems(
    hero: CDOTA_BaseNPC_Hero,
    itemsMap: Map<string, CDOTA_Item[]>,
    buildState: HeroBuildState,
  ): boolean {
    for (let tier = ItemTier.T1; tier < buildState.currentTier; tier++) {
      const tierItems = buildState.resolvedItems[tier];
      for (const itemName of tierItems) {
        if (itemsMap.has(itemName)) {
          const items = itemsMap.get(itemName)!;
          return this.SellItem(hero, items, itemName, true);
        }
      }
    }
    return false;
  }

  /**
   * 从物品Map中移除受保护的装备
   * tome 阶段出装已定型，保护全部 tier；否则只保护当前 tier
   * @param itemsMap 物品Map
   * @param buildState 出装状态
   */
  static RemoveCurrentTierItems(
    itemsMap: Map<string, CDOTA_Item[]>,
    buildState: HeroBuildState,
  ): void {
    const tiers = buildState.tomePhase
      ? [ItemTier.T1, ItemTier.T2, ItemTier.T3, ItemTier.T4, ItemTier.T5]
      : [buildState.currentTier];

    for (const tier of tiers) {
      for (const itemName of buildState.resolvedItems[tier]) {
        itemsMap.delete(itemName);
      }
    }
  }

  /**
   * 出售多余的物品
   * @param hero 英雄单位
   * @param buildState 出装状态（可选）
   * @returns 是否出售了物品
   */
  static SellExtraItems(hero: CDOTA_BaseNPC_Hero, buildState?: HeroBuildState): boolean {
    // 出售阈值只看随身物品（不含储藏室），避免储藏室堆积物品误触发出售
    const fieldItemsMap = this.GetFieldItemsMap(hero);
    let fieldItemCount = 0;
    for (const items of fieldItemsMap.values()) {
      fieldItemCount += items.length;
    }
    const sellThreshold = this.GetSellThreshold(fieldItemsMap);
    if (fieldItemCount < sellThreshold) {
      return false;
    }

    // 触发出售后，仍在随身+储藏室全部范围内寻找出售目标
    const itemsMap = this.GetItemsMapIncludeStash(hero);

    // 如果提供了buildState，移除当前tier的物品，防止出售购买死循环
    if (buildState) {
      this.RemoveCurrentTierItems(itemsMap, buildState);
    }

    // 出售已消耗的物品（魔晶、急速之翼、真·阿哈利姆神杖等）
    if (this.SellConsumedItems(hero, itemsMap)) {
      return true;
    }

    // 出售配方物品
    if (this.SellRecipeItems(hero, itemsMap)) {
      return true;
    }

    // 出售重复物品
    if (this.SellDuplicateItems(hero, itemsMap)) {
      return true;
    }

    // 出售通用垃圾物品
    if (this.SellCommonJunkItems(hero, itemsMap)) {
      return true;
    }

    // 出售被上位装备替代的下位装备
    if (this.SellReplacedItems(hero, itemsMap)) {
      return true;
    }

    // 出售出装表中低于当前 tier 的残留装备
    if (buildState && this.SellOutdatedTierItems(hero, itemsMap, buildState)) {
      return true;
    }

    // 当物品数量过多时，按价值顺序出售物品（初级->中级->高级）
    if (this.SellItemsByValue(hero, itemsMap)) {
      return true;
    }

    return false;
  }
}
