import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 枷锁：UNIT_TARGET | CHANNELLED / ENEMY / HERO | BASIC。
 *
 * 跳过已被控制的目标，避免对眩晕中的敌人浪费 channeled 技能时间。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_shackles',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
