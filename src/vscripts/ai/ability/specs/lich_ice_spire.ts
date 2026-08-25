import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 寒冰尖柱：布置在敌方英雄附近，为连环霜冻提供单目标回弹支点。
 *
 * 回弹只在连环霜冻的弹射距离内成立，判据取施法距离内的敌人数，
 * 比按预搜半径计数更贴近该机制。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_ice_spire',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { count: { gte: 1, lte: 1 } } },
  },
];
