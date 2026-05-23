import { AbilitySpec, TargetSide } from '../ability-spec';

/** 冰霜魔盾：可对友方英雄/建筑施放，noModifier 防止持续期内重复刷新。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_frost_shield',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 90 },
          noModifier: 'modifier_lich_frost_shield',
        },
      },
    },
  },
  {
    abilityName: 'lich_frost_shield',
    targetSide: TargetSide.FriendlyBuilding,
    condition: {
      target: {
        unitCondition: {
          noModifier: 'modifier_lich_frost_shield',
        },
      },
    },
  },
];
