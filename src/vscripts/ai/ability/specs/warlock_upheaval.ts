import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 术士 - 剧变：POINT | CHANNELLED。
 *
 * 运行时同时带指向单位的位，指向敌人会被拒绝，强制点地。
 * 引导期间站桩，要有队友护着，并先把大招交出去；敌人都离开后停止引导。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'warlock_upheaval',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200, ultimateNotReady: true },
      target: { castMode: 'targetPosition' },
    },
    stopChannel: { noEnemyHeroInRange: 800 },
  },
];
