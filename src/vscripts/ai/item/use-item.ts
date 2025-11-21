/**
 * 物品使用管理器
 * 负责 Bot 自动使用消耗品
 */

import { ActionItem } from '../action/action-item';

/**
 * 需要目标的消耗品列表
 * 这些物品会对英雄自身使用
 */
const CONSUME_ITEMS_WITH_TARGET = [
  'item_tango',
  'item_flask',
  'item_clarity',
  'item_enchanted_mango',
  'item_faerie_fire',
];

/**
 * 不需要目标的消耗品列表
 * 这些物品直接使用，无需指定目标
 */
const CONSUME_ITEMS_NO_TARGET = [
  'item_bottle',
  'item_dust',
  'item_smoke_of_deceit',
];

export class UseItem {
  /**
   * 使用所有消耗品
   * @param hero 英雄单位
   * @returns 是否使用了任何物品
   */
  static UseConsumeItems(hero: CDOTA_BaseNPC_Hero): boolean {
    // 1. 使用需要目标的消耗品（目标为自己）
    for (const itemName of CONSUME_ITEMS_WITH_TARGET) {
      if (ActionItem.UseItemOnTarget(hero, itemName, hero)) {
        return true;
      }
    }

    // 2. 使用不需要目标的消耗品
    for (const itemName of CONSUME_ITEMS_NO_TARGET) {
      if (ActionItem.UseItemNoTarget(hero, itemName)) {
        return true;
      }
    }

    return false;
  }
}
