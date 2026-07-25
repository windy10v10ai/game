import { IsAbilityBehavior } from '../action/cast-condition';

/** 购买后自动消耗、无需战斗时机判断的永久消耗品：CD/蓝耗满足就立刻用。 */
const CONSUME_ITEMS: Array<{ itemName: string; usableFromBackpack?: boolean }> = [
  { itemName: 'item_wings_of_haste' },
  { itemName: 'item_ultimate_scepter_2' },
  { itemName: 'item_moon_shard_datadriven' },
  { itemName: 'item_tome_of_strength', usableFromBackpack: true },
  { itemName: 'item_tome_of_agility', usableFromBackpack: true },
  { itemName: 'item_tome_of_intelligence', usableFromBackpack: true },
  { itemName: 'item_tome_of_luoshu', usableFromBackpack: true },
  { itemName: 'item_inventory_slot_unlock', usableFromBackpack: true },
];

export class ConsumeItem {
  /** 按 behavior 位尝试消耗指定物品，命中返回 true。 */
  private static TryConsumeItem(
    hero: CDOTA_BaseNPC_Hero,
    itemName: string,
    usableFromBackpack: boolean | undefined,
  ): boolean {
    const item = hero.FindItemInInventory(itemName);
    if (!item) {
      return false;
    }
    // 备用栏物品既不能施法也不生效被动加成，买到备用栏时挤开主栏末位强制换入
    if (!usableFromBackpack && item.GetItemSlot() > InventorySlot.SLOT_6) {
      hero.SwapItems(item.GetItemSlot(), InventorySlot.SLOT_6);
    }
    if (!item.IsFullyCastable()) {
      return false;
    }
    if (IsAbilityBehavior(item, AbilityBehavior.UNIT_TARGET)) {
      hero.CastAbilityOnTarget(hero, item, hero.GetPlayerOwnerID());
      return true;
    }
    if (IsAbilityBehavior(item, AbilityBehavior.NO_TARGET)) {
      if (
        itemName === 'item_inventory_slot_unlock' &&
        (item as CDOTA_Item_Lua).CastFilterResult() !== UnitFilterResult.SUCCESS
      ) {
        return false;
      }
      hero.CastAbilityNoTarget(item, hero.GetPlayerOwnerID());
      return true;
    }
    return false;
  }

  /**
   * 扫描背包中已知的永久消耗品并使用。
   * 不区分物品由新出装系统（HeroBuildManager）还是原生 Lua 购买系统买入——
   * 只要出现在背包里就按规则消耗，覆盖所有英雄。
   */
  static ConsumeKnownItems(hero: CDOTA_BaseNPC_Hero): boolean {
    if (hero.IsMuted()) return false;

    for (const { itemName, usableFromBackpack } of CONSUME_ITEMS) {
      if (this.TryConsumeItem(hero, itemName, usableFromBackpack)) {
        return true;
      }
    }

    return false;
  }
}
