import { TryCastBySpec } from '../action/target-dispatch';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { ItemRegistry } from './item-registry';

/** 备用栏起始槽位（6号格，index 6） */
const BACKPACK_START_SLOT = InventorySlot.SLOT_7;

/**
 * 统一的 bot 战斗物品 AI 入口，与 AbilityDispatcher 平级，共用 TryCastBySpec。
 *
 * 由 bot-base ActionMode 内各 ActionXxx 在 AbilityDispatcher.Run 之后调用：
 *   if (ItemDispatcher.Run(this)) return true;
 *
 * 只遍历随身 0~8 号槽位（不含仓库、TP、中立槽），备用栏（6~8）物品默认跳过，
 * 除非 spec 显式声明 usableFromBackpack（用于肉山战旗等拾取物）。
 */
export class ItemDispatcher {
  static Run(ai: BotBaseAIModifier): boolean {
    const hero = ai.GetHero();
    if (hero.IsMuted()) {
      return false;
    }

    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_9; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item) {
        continue;
      }

      const specs = ItemRegistry.get(item.GetName());
      if (!specs) {
        continue;
      }

      if (slot >= BACKPACK_START_SLOT && !specs.some((spec) => spec.usableFromBackpack)) {
        continue;
      }

      if (!item.IsFullyCastable()) {
        continue;
      }

      for (const spec of specs) {
        if (slot >= BACKPACK_START_SLOT && !spec.usableFromBackpack) {
          continue;
        }
        if (TryCastBySpec(ai, item, spec.targetSide, spec.condition)) {
          return true;
        }
      }
    }

    return false;
  }
}
