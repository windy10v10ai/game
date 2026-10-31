import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 水晶室女 - 极寒领域：NO_TARGET | CHANNELLED。
 *
 * 引导期间站桩，有队友在才护得住并把敌人留在圈里。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'crystal_maiden_freezing_field',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200 },
      target: { rangeFromAbilityValue: 'radius' },
    },
  },
];
