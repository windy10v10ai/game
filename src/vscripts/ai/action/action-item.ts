import { ActionAbility } from './action-ability';
import { CastCoindition, CheckUnitConditionFailure, IsAbilityBehavior } from './cast-condition';

export class ActionItem {
  // ---------------------------------------------------------
  // Item usage 使用物品
  // ---------------------------------------------------------
  static UseItemOnTarget(
    hero: CDOTA_BaseNPC_Hero,
    itemName: string,
    target: CDOTA_BaseNPC | undefined,
    condition?: CastCoindition,
  ): boolean {
    if (target === undefined) {
      return false;
    }
    // 寻找可用的物品，检测是否可以施法
    const item = this.FindItemInInventoryUseable(hero, itemName);
    if (!item) {
      return false;
    }

    // 检查施法者 是否满足指定条件
    if (CheckUnitConditionFailure(hero, condition?.self?.unitCondition)) {
      return false;
    }

    // 检测是否在施法范围内
    const distance = hero.GetRangeToUnit(target);
    const castRange = ActionAbility.GetFullCastRange(hero, item);
    if (distance > castRange) {
      return false;
    }

    // 执行默认物品行为
    if (IsAbilityBehavior(item, AbilityBehavior.UNIT_TARGET)) {
      print(`[AI] UseItemOnTarget ${itemName} on target`);
      hero.CastAbilityOnTarget(target, item, hero.GetPlayerOwnerID());
      return true;
    } else if (IsAbilityBehavior(item, AbilityBehavior.POINT)) {
      print(`[AI] UseItemOnTarget ${itemName} on point`);
      hero.CastAbilityOnPosition(target.GetAbsOrigin(), item, hero.GetPlayerOwnerID());
      return true;
    } else if (IsAbilityBehavior(item, AbilityBehavior.AOE)) {
      print(`[AI] UseItemOnTarget ${itemName} on position`);
      hero.CastAbilityOnPosition(target.GetAbsOrigin(), item, hero.GetPlayerOwnerID());
      return true;
    } else if (IsAbilityBehavior(item, AbilityBehavior.NO_TARGET)) {
      print(`[AI] UseItemOnTarget ${itemName} no target`);
      hero.CastAbilityNoTarget(item, hero.GetPlayerOwnerID());
      return true;
    } else {
      print(`[AI] ERROR UseItemOnTarget ${itemName} not found behavior`);
    }

    return false;
  }

  /**
   * 使用无目标物品
   * @param hero 英雄单位
   * @param itemName 物品名称
   * @returns 是否成功使用
   */
  static UseItemNoTarget(hero: CDOTA_BaseNPC_Hero, itemName: string): boolean {
    const item = this.FindItemInInventoryUseable(hero, itemName);
    if (!item) {
      return false;
    }

    hero.CastAbilityNoTarget(item, hero.GetPlayerOwnerID());
    print(`[AI] UseItemNoTarget ${itemName}`);
    return true;
  }

  /**
   * 寻找可用的物品，检测是否可以施法
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
