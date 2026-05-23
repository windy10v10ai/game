import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 狂战士之嚎：DOTA_ABILITY_BEHAVIOR_NO_TARGET，穿魔法免疫（SPELL_IMMUNITY_ENEMIES_YES）。
 *
 * 半径内有 ≥1 个未被控制的可见敌方英雄时施放。
 * cast range = 0（NO_TARGET），以 KV AbilityValues "radius" 作为搜索上限，随天赋动态变化。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'axe_berserkers_call',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
        rangeFromAbilityValue: 'radius',
        ignoresMagicImmune: true,
      },
    },
  },
];
