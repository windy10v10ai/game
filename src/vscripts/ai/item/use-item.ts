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
  'item_wings_of_haste',
  'item_ultimate_scepter_2',
  'item_moon_shard_datadriven',
];

/**
 * 不需要目标的消耗品列表
 * 这些物品直接使用，无需指定目标
 */
const CONSUME_ITEMS_NO_TARGET = [
  'item_tome_of_agility',
  'item_tome_of_strength',
  'item_tome_of_intelligence',
  'item_tome_of_luoshu',
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

  static UseItemEnemy(hero: CDOTA_BaseNPC_Hero, enemys?: CDOTA_BaseNPC[]): boolean {
    if (!enemys) {
      return false;
    }
    if (enemys.length === 0) {
      return false;
    }
    const enemy = enemys[0];

    // 血腥榴弹
    if (ActionItem.UseItemOnTarget(hero, 'item_blood_grenade', enemy)) {
      return true;
    }
    return false;
  }

  static UseItemCreep(hero: CDOTA_BaseNPC_Hero, creeps?: CDOTA_BaseNPC[]): boolean {
    if (!creeps) {
      return false;
    }
    if (creeps.length === 0) {
      return false;
    }
    const creep = creeps[0];
    if (creep.IsAncient()) {
      return false;
    }

    // 团队之手
    if (ActionItem.UseItemOnTarget(hero, 'item_hand_of_group', creep)) {
      return true;
    }

    return false;
  }
}
