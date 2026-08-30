import { AbilitySpec, TargetSide } from '../ability-spec';

/** 榴霰弹：保留充能，对未受减速的兵群施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sniper_shrapnel',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { unitCondition: { noModifier: ['modifier_sniper_shrapnel_slow'] } },
      ability: { charges: { gte: 3 } },
    },
  },
];
