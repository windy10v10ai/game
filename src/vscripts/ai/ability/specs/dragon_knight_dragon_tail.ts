import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 龙尾：UNIT_TARGET / ENEMY / HERO，射程 150（近战距离）。
 *
 * 眩晕技能，跳过已处于硬控状态的目标避免浪费。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dragon_knight_dragon_tail',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
