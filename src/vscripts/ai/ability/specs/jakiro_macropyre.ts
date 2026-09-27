import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 杰奇洛 - 烈焰焚身：POINT。
 *
 * 放完目标能直接走出火墙，只在有队友拖住或目标跑不动时放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'jakiro_macropyre',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200 },
    },
  },
  {
    abilityName: 'jakiro_macropyre',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { disabled: 'movement' } },
    },
  },
];
