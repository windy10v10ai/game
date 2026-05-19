import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 裂地尖刺：UNIT_TARGET / ENEMY / HERO+CREEP。
 *
 * 对英雄无限制；对小兵要求技能 level >= 4（高级才值得用于清兵）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_impale',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'lion_impale',
    targetSide: TargetSide.EnemyCreep,
  },
];
