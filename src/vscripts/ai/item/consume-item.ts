import { IsAbilityBehavior } from '../action/cast-condition';

/**
 * 购买后自动消耗的永久消耗品：不需要战斗时机决策，CD/蓝耗满足就用。
 * 按 behavior 位统一派发（UNIT_TARGET → 对自己使用，NO_TARGET → 直接施放），
 * 不再区分"需要目标"和"不需要目标"两张表。
 *
 * item_blood_grenade 不在此列——其 UNIT_TARGET 需要敌方目标，对自己使用没有意义，
 * 且历史上对敌使用存在卡放的引擎 bug（沿用现状，不在此次重构中恢复战斗使用）。
 */
const CONSUME_ITEMS: string[] = [
  'item_wings_of_haste',
  'item_ultimate_scepter_2',
  'item_moon_shard_datadriven',
  'item_faerie_fire',
  'item_enchanted_mango',
  'item_infused_raindrop',
  'item_tome_of_strength',
  'item_tome_of_agility',
  'item_tome_of_intelligence',
  'item_tome_of_luoshu',
];

export class ConsumeItem {
  /**
   * 将物品从备用栏换到主栏空位（主栏全满时强行对调最后一位）。
   * 属性书/洛书购买时主栏已满会落到备用栏，需先换回主栏才能被使用逻辑扫描到。
   */
  private static SwapToMainInventoryIfNeeded(hero: CDOTA_BaseNPC_Hero, itemName: string): void {
    const item = hero.FindItemInInventory(itemName);
    if (!item) return;
    const slot = item.GetItemSlot();
    if (slot < InventorySlot.SLOT_7) return; // 已在主栏
    for (let i = InventorySlot.SLOT_1; i <= InventorySlot.SLOT_6; i++) {
      const existing = hero.GetItemInSlot(i);
      if (!existing || existing.IsNull()) {
        hero.SwapItems(slot, i);
        return;
      }
    }
    // 主栏全满，强行对调第 6 格（最后一位主栏）
    hero.SwapItems(slot, InventorySlot.SLOT_6);
  }

  /**
   * 扫描背包中已知的永久消耗品并使用。
   * 不区分物品由新出装系统（HeroBuildManager）还是原生 Lua 购买系统买入——
   * 只要出现在背包里就按 behavior 消耗，覆盖所有英雄。
   */
  static ConsumeKnownItems(hero: CDOTA_BaseNPC_Hero): boolean {
    if (hero.IsMuted()) return false;

    for (const itemName of CONSUME_ITEMS) {
      this.SwapToMainInventoryIfNeeded(hero, itemName);
      const item = hero.FindItemInInventory(itemName);
      if (!item || item.GetItemSlot() > InventorySlot.SLOT_6) {
        continue;
      }
      if (!item.IsFullyCastable()) {
        continue;
      }
      if (IsAbilityBehavior(item, AbilityBehavior.UNIT_TARGET)) {
        hero.CastAbilityOnTarget(hero, item, hero.GetPlayerOwnerID());
        return true;
      }
      if (IsAbilityBehavior(item, AbilityBehavior.NO_TARGET)) {
        hero.CastAbilityNoTarget(item, hero.GetPlayerOwnerID());
        return true;
      }
    }

    return false;
  }
}
