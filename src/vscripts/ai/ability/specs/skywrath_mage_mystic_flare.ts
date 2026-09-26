import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 天怒法师 - 神秘之耀：POINT | AOE。
 *
 * 范围小，目标一走就打不满，只对跑不动的目标放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'skywrath_mage_mystic_flare',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { disabled: 'movement' } },
    },
  },
];
