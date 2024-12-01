import { Tier } from './tier';

/**
 * 技能抽选概率，Tier 5-1
 * 确保概率从低到高排列
 */
export const abilityTiers: Tier[] = [
  {
    level: 5,
    rate: 1,
    names: [
      'phantom_assassin_coup_de_grace', // 恩赐解脱
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      'chaos_knight_chaos_strike', // 混沌一击
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      'bloodseeker_thirst', // 焦渴
      'axe_counter_helix', // 反击螺旋
    ],
  },
  {
    level: 2,
    rate: 50,
    names: [
      'bounty_hunter_jinada', // 忍术
      'abaddon_frostmourne', // 魔霭诅咒
      'abyssal_underlord_atrophy_aura', // 衰退光环
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      'earthshaker_aftershock', // 余震
      'antimage_mana_break', // 法力损毁
      'broodmother_poison_sting', // 毒刺
      'broodmother_incapacitating_bite', // 麻痹之咬
    ],
  },
];
