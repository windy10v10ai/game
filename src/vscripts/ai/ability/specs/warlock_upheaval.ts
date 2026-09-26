import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 术士 - 剧变：POINT | CHANNELLED。
 *
 * 引导期间站桩，要有队友护着，并先把大招交出去；敌人都离开后停止引导。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'warlock_upheaval',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200, ultimateNotReady: true },
    },
    stopChannel: { noEnemyHeroInRange: 800 },
  },
];
