/**
 * 装备成长树 - 手动配置的装备升级链
 * 每个系列包含从低级到高级的完整装备列表
 */

/**
 * 装备升级链配置
 * key: 链名称（通常是最高级装备名）
 * value: 装备列表（从低级到高级排序）
 */
export const ItemUpgradeChains: Record<string, string[]> = {
  // ===== 核心输出装备 =====

  // 圣剑系列
  rapier_series: [
    'item_rapier', // T3
    'item_excalibur', // T4
    'item_rapier_ultra', // T5
    'item_rapier_ultra_bot', // T5
    'item_rapier_ultra_bot_1', // T5
  ],

  // 金箍棒系列
  mkb_series: [
    'item_monkey_king_bar', // T2
    'item_monkey_king_bar_2', // T3
  ],

  // 冰眼系列
  skadi_series: ['item_skadi', 'item_skadi_2'],

  // 蝴蝶系列
  butterfly_series: ['item_butterfly', 'item_butterfly_2'],

  // 代达罗斯系列
  daedalus_series: ['item_greater_crit', 'item_greater_crit_2'],

  // 散弹枪系列
  shotgun_series: ['item_shotgun_v2'],

  // 飓风长戟系列
  hurricane_pike_series: ['item_hurricane_pike', 'item_hurricane_pike_2'],

  // ===== 防御装备 =====

  // 撒旦系列
  satanic_series: ['item_satanic', 'item_satanic_2'],

  // 球系列
  sphere_series: ['item_sphere', 'item_sphere_2', 'item_saint_orb'],

  // 强袭系列
  assault_series: ['item_assault', 'item_assault_2'],

  // 心系列
  heart_series: ['item_heart', 'item_undying_heart'],

  // 刃甲系列
  blade_mail_series: ['item_blade_mail', 'item_blade_mail_2'],

  // 希瓦系列
  shivas_series: ['item_shivas_guard', 'item_shivas_guard_2'],

  // 永恒系列
  aeon_series: ['item_aeon_disk', 'item_aeon_pendant'],

  // 法师泳衣系列
  shroud_series: ['item_eternal_shroud', 'item_eternal_shroud_ultra'],

  // ===== 移动装备 =====

  // 跳刀基础系列
  blink_series: ['item_blink'],

  // 敏捷跳刀系列
  swift_blink_series: [
    'item_blink',
    'item_swift_blink',
    'item_swift_blink_2',
    'item_jump_jump_jump',
  ],

  // 力量跳刀系列
  overwhelming_blink_series: [
    'item_blink',
    'item_overwhelming_blink',
    'item_overwhelming_blink_2',
    'item_jump_jump_jump',
  ],

  // 智力跳刀系列
  arcane_blink_series: [
    'item_blink',
    'item_arcane_blink_2',
    'item_arcane_blink',
    'item_jump_jump_jump',
  ],

  // 鞋子系列
  boots_series: ['item_boots', 'item_power_treads', 'item_adi_king', 'item_adi_king_plus'],

  // ===== 控制装备 =====

  // 羊刀系列
  sheep_series: ['item_sheepstick', 'item_necronomicon_staff'],

  // 深渊系列
  abyssal_series: ['item_basher', 'item_abyssal_blade', 'item_abyssal_blade_v2'],

  // ===== 功能装备 =====

  // BKB系列
  bkb_series: ['item_black_king_bar', 'item_black_king_bar_2'],

  // 刷新系列
  refresh_series: ['item_refresher', 'item_refresh_core'],

  // 辉耀系列
  radiance_series: ['item_radiance', 'item_radiance_2'],

  // 推推系列
  force_staff_series: ['item_force_staff', 'item_force_staff_2', 'item_force_staff_3'],

  // 以太系列
  aether_lens_series: ['item_aether_lens', 'item_aether_lens_2'],

  // 神圣权杖系列
  scepter_series: ['item_hallowed_scepter'],

  // 守护系列
  guardian_series: ['item_mekansm', 'item_guardian_greaves', 'item_guardian_greaves_artifact'],

  // ===== 消耗品 =====

  // 蓝杖系列
  agh_series: ['item_ultimate_scepter', 'item_ultimate_scepter_2'],

  // 月刃系列
  moon_shard_series: ['item_moon_shard_datadriven'],

  // 属性书系列
  tome_series: [
    'item_tome_of_strength',
    'item_tome_of_agility',
    'item_tome_of_intelligence',
    'item_tome_of_luoshu',
  ],
};

/**
 * 获取装备所在的升级链
 * @param itemName 装备名称
 * @returns 升级链（从低级到高级），如果找不到返回只包含该装备的数组
 */
function GetItemChain(itemName: string): string[] {
  for (const chain of Object.values(ItemUpgradeChains)) {
    if (chain.includes(itemName)) {
      return chain;
    }
  }

  // 如果找不到，返回只包含该装备的数组
  return [itemName];
}

/**
 * 获取装备的所有前置装备（下位装备）
 * @param itemName 装备名称
 * @returns 前置装备列表（从低级到高级排序）
 */
export function GetItemPrerequisites(itemName: string): string[] {
  const chain = GetItemChain(itemName);
  const index = chain.indexOf(itemName);

  if (index <= 0) {
    return [];
  }

  // 返回该装备之前的所有装备
  return chain.slice(0, index);
}
