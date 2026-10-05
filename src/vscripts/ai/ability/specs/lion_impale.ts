import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 裂地尖刺：UNIT_TARGET / ENEMY / HERO+CREEP。
 *
 * 伤害高，目标已被控制也照放，让控制重叠，避免对单人玩家无缝连控。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_impale',
    targetSide: TargetSide.EnemyHero,
    control: true,
  },
  {
    abilityName: 'lion_impale',
    targetSide: TargetSide.EnemyCreep,
  },
];
