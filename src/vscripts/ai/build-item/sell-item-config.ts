/**
 * 出售物品配置
 * 管理AI英雄的出售物品列表
 */

/**
 * 通用出售物品列表 - 所有英雄都会出售的物品
 * 主要是基础配件和早期物品
 */
export const SellItemCommonList: string[] = [
  // v社更新导致的异常出装
  'item_manta', // 幻影斧
  'item_sphere', // 林肯法球
];

/**
 * 英雄特定出售物品列表
 * 根据英雄名称配置特定的出售物品
 */
export const SellItemHeroList: Record<string, string[]> = {
  npc_dota_hero_abaddon: ['item_overwhelming_blink', 'item_echo_sabre_2'],
};
