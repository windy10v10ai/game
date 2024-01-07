export class ActionItem {
  static BuyItem(hero: CDOTA_BaseNPC_Hero, itemName: string, checkSame: boolean = true): boolean {
    if (checkSame) {
      const item = hero.FindItemInInventory(itemName);

      if (item) {
        print(`[AI] BuyItem ${itemName} failed, already has`);
        return false;
      }
    }
    const cost = GetItemCost(itemName);
    if (cost > hero.GetGold()) {
      print(`[AI] BuyItem ${itemName} failed, not enough gold`);
      return false;
    }

    const addedItem = hero.AddItemByName(itemName);
    if (!addedItem) {
      print(`[AI] BuyItem ${itemName} failed`);
      return false;
    }
    hero.SpendGold(cost, ModifyGoldReason.PURCHASE_ITEM);
    return true;
  }

  static SellItem(hero: CDOTA_BaseNPC_Hero, itemName: string) {
    const item = hero.FindItemInInventory(itemName);
    // 没有该物品
    if (!item) {
      return;
    }
    // FIXME remove and give half gold
    hero.SellItem(item);
  }
}
