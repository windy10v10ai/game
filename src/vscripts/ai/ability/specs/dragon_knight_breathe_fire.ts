import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 喷火：DIRECTIONAL/POINT/UNIT_TARGET / ENEMY / HERO+BASIC，射程 1000。
 *
 * 锥形喷火带减攻击力 debuff，对英雄无条件施放；对小兵要求至少 2 个在范围内。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dragon_knight_breathe_fire',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'dragon_knight_breathe_fire',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
