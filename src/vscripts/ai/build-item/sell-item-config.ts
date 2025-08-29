/**
 * 出售物品配置
 * 管理AI英雄的出售物品列表
 */

/**
 * 阿哈利姆魔晶物品名称
 */
export const AghanimsShardItem = 'item_aghanims_shard';

/**
 * 特殊消耗物品列表 - 拥有这些物品时提高出售阈值
 * 这些物品比较重要，需要保留更多的物品栏空间
 */
export const SpecialConsumableItems: string[] = [
  'item_aegis', // 不朽之守护
  'item_tome_of_strength', // 力量书
  'item_tome_of_agility', // 敏捷书
  'item_tome_of_intelligence', // 智力书
  'item_tome_of_luoshu', // 洛书
  'item_wings_of_haste', // 急速之翼
  'item_ultimate_scepter_2', // 真·阿哈利姆神杖
  'item_moon_shard_datadriven', // 真·银月之晶
  'item_ward_observer', // 侦查守卫
  'item_ward_sentry', // 岗哨守卫
];

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
