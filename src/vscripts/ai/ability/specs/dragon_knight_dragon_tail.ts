import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 龙尾：UNIT_TARGET / ENEMY / HERO，射程 150（近战距离）。
 *
 * 带伤害的短眩晕，目标已被控制也照放，让控制重叠，避免对单人玩家无缝连控。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dragon_knight_dragon_tail',
    targetSide: TargetSide.EnemyHero,
    control: true,
  },
];
