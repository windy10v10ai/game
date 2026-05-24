import { Tier } from '../shared/tier';

/**
 * 物品抽奖池，Tier 5-1。配合 ITEM_TIER_RATES 累计阈值使用。
 */
export const itemTiers: Tier[] = [
  {
    level: 5,
    names: [
      'item_tome_of_agility',
      'item_tome_of_intelligence',
      'item_tome_of_strength',

      // ---- 中立物品 lv5 ----
      'item_fallen_sky',
      'item_desolator_2',
      'item_mirror_shield',
      'item_ballista',
      'item_seer_stone',
      'item_ex_machina',
      'item_pirate_hat',
    ],
  },
  {
    level: 4,
    names: [
      'item_light_part',
      'item_dark_part',

      // ---- 中立物品 lv4 ----
      'item_penta_edged_sword',
      'item_panic_button',
      'item_minotaur_horn',
      'item_spell_prism',
      'item_helm_of_the_undying',
      'item_woodland_striders',
      'item_princes_knife',
      'item_repair_kit',
    ],
  },
  {
    level: 3,
    names: [
      // ---- 中立物品 lv3 ----
      'item_titan_sliver',
      'item_quickening_charm',
      'item_spider_legs',
      'item_horizon',
      'item_witless_shako',
      'item_third_eye',
      'item_the_leveller',
      'item_paladin_sword',
    ],
  },
  {
    level: 2,
    names: [
      'item_hand_of_midas',
      'item_holy_locket',
      'item_aghanims_shard',
      'item_great_famango',
      'item_tome_of_knowledge',

      // ---- 中立物品 lv2 ----
      'item_imp_claw',
      'item_vampire_fangs',
      'item_mysterious_hat',
      'item_vambrace',
      'item_grove_bow',
      'item_orb_of_destruction',
      'item_philosophers_stone',
      'item_essence_ring',
    ],
  },
  {
    level: 1,
    names: [
      'item_tome_of_knowledge',
      'item_bottle',
      'item_bracer',
      'item_wraith_band',
      'item_null_talisman',
      'item_infused_raindrop',

      // ---- 中立物品 lv1 ----
      'item_chipped_vest',
      'item_ironwood_tree',
      'item_iron_talon',
      'item_keen_optic',
      'item_possessed_mask',
      'item_ring_of_aquila',
      'item_poor_mans_shield',
      'item_broom_handle',
    ],
  },
];
