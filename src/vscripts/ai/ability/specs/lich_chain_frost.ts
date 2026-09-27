import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 巫妖 - 连环霜冻：UNIT_TARGET / ENEMY。
 *
 * 单个玩家时也值得放，见到就放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_chain_frost',
    targetSide: TargetSide.EnemyHero,
  },
];
