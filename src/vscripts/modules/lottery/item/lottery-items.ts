import { Tier } from '../shared/tier';

export const treasuredItems = [
  'item_bfury_copy',
  'item_radiance_copy',
  'item_blade_mail_copy',
  'item_heart_copy',
  'item_aghanim_bundle',
  'item_haste_moon_bundle',
  'item_berserkers_sabatons_copy',
  'item_echo_sabre_2_copy',
  'item_hydras_breath_copy',
  'item_hand_of_midas_copy',
  'item_starforge_copy',
  'item_dagon_ultra_copy',
];

export const itemTiers: Tier[] = [
  {
    level: 7,
    names: ['item_tome_of_luoshu', 'item_passive_skill_tome'],
  },
  {
    level: 6,
    names: ['item_awaken_stone', 'item_inventory_slot_unlock'],
  },
  {
    level: 5,
    names: [
      'item_fusion_hawkeye',
      'item_fusion_forbidden',
      'item_fusion_brutal',
      'item_fusion_beast',
      'item_fusion_life',
      'item_fusion_shadow',
      'item_fusion_magic',
      'item_fusion_agile',
      'item_treasure_cheese',
    ],
  },
  {
    level: 4,
    names: [
      'item_tome_of_ability_reset',
      'item_tome_of_agility',
      'item_tome_of_intelligence',
      'item_tome_of_strength',
      'item_roshans_banner',
      'item_treasure_bottle',
      'item_treasure_passive_fragment',
    ],
  },
  {
    level: 3,
    names: [
      'item_consumable_gem',
      'item_candy_candy',
      'item_horn_of_battle_greater',
      'item_treasure_inventory_fragment',
    ],
  },
  {
    level: 2,
    names: [
      'item_tome_of_knowledge',
      'item_great_famango',
      'item_treasure_attribute_fragment',
      'item_treasure_slot_machine',
    ],
  },
  {
    level: 1,
    names: [
      ...treasuredItems,
      'item_treasure_salve',
      'item_treasure_clarity',
      'item_treasure_mango',
      'item_treasure_raindrop',
    ],
  },
];
