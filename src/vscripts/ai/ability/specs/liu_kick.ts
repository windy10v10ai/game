import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 初音飞踢：UNIT_TARGET + AOE / ENEMY / HERO+BASIC。
 *
 * 施法距离定义在 AbilityValues 的 AbilityCastRange 子字段，engine 自动探测读不到，需显式指定。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'liu_kick',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'AbilityCastRange' },
    },
  },
  {
    abilityName: 'liu_kick',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { rangeFromAbilityValue: 'AbilityCastRange' },
    },
  },
];
