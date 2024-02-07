import { ActionAbility } from "./action-ability";

export class ActionItem {
  // ---------------------------------------------------------
  // Item build 购买物品
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Item usage 使用物品
  // ---------------------------------------------------------
  static UseItemOnTarget(
    hero: CDOTA_BaseNPC_Hero,
    itemName: string,
    target: CDOTA_BaseNPC | undefined,
    condition?: (target: CDOTA_BaseNPC, item: CDOTA_Item) => boolean,
  ): boolean {
    if (target === undefined) {
      return false;
    }
    const item = this.FindItemInInventoryUseable(hero, itemName);
    if (!item) {
      return false;
    }

    // 检测是否满足条件
    if (condition && condition(target, item) === false) {
      return false;
    }
    // 检测是否在施法范围内
    const distance = hero.GetRangeToUnit(target);
    const castRange = ActionAbility.GetFullCastRange(hero, item);
    if (distance > castRange) {
      return false;
    }

    hero.CastAbilityOnTarget(target, item, hero.GetPlayerOwnerID());
    print(`[AI] UseItemOnTarget ${itemName} on ${target.GetUnitName()}`);
    return true;
  }

  static UseItemOnPosition(hero: CDOTA_BaseNPC_Hero, itemName: string, pos: Vector): boolean {
    const item = this.FindItemInInventoryUseable(hero, itemName);
    if (!item) {
      return false;
    }

    // TODO 检测是否在施法范围内
    hero.CastAbilityOnPosition(pos, item, hero.GetPlayerOwnerID());
    return true;
  }

  /**
   * 寻找可用的物品
   */
  static FindItemInInventoryUseable(
    hero: CDOTA_BaseNPC_Hero,
    itemName: string,
  ): CDOTA_Item | undefined {
    const item = hero.FindItemInInventory(itemName);
    if (!item) {
      return undefined;
    }
    const itemSlot = item.GetItemSlot();
    // 如果在备用物品栏中 则不可用
    if (itemSlot >= InventorySlot.SLOT_7 && itemSlot <= InventorySlot.SLOT_9) {
      return undefined;
    }
    if (this.IsItemCastable(hero, item) === false) {
      return undefined;
    }
    return item;
  }

  private static IsItemCastable(hero: CDOTA_BaseNPC_Hero, item: CDOTA_Item): boolean {
    if (item.GetCooldownTimeRemaining() > 0) {
      return false;
    }
    // 确认有足够的充能
    if (item.GetAbilityChargeRestoreTime(-1) > 0 && item.GetCurrentCharges() === 0) {
      return false;
    }
    // 确认魔法值足够
    const manaCost = item.GetManaCost(-1);
    if (manaCost > hero.GetMana()) {
      return false;
    }
    return true;
  }
}
