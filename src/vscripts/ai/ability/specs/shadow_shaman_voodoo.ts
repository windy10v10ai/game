import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 妖术：UNIT_TARGET / ENEMY / HERO | BASIC。
 *
 * 跳过已被控制的目标，避免在眩晕/变形等状态下浪费变羊。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_voodoo',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
