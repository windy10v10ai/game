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

  // Use item
  static UseTeleportScroll(hero: CDOTA_BaseNPC_Hero, pos: Vector) {
    const item = hero.FindItemInInventory("item_tpscroll");
    if (item) {
      hero.CastAbilityOnPosition(pos, item, hero.GetPlayerOwnerID());
    }
  }

  static UseItemOnPosition(hero: CDOTA_BaseNPC_Hero, itemName: string, pos: Vector): boolean {
    const item = hero.FindItemInInventory(itemName);
    if (!item) {
      print(`[AI] ERROR UseItemOnPosition ${itemName} failed, not found`);
      return false;
    }
    if (this.IsItemCastable(hero, item) === false) {
      return false;
    }
    hero.CastAbilityOnPosition(pos, item, hero.GetPlayerOwnerID());
    return true;
  }

  static IsItemCastable(hero: CDOTA_BaseNPC_Hero, item: CDOTA_Item): boolean {
    if (item.GetCooldownTimeRemaining() > 0) {
      return false;
    }
    // check mana
    const manaCost = item.GetManaCost(-1);
    if (manaCost > hero.GetMana()) {
      return false;
    }
    return true;
  }
}
