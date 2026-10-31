import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 死亡先知 - 灵魂汲取：UNIT_TARGET / ENEMY，按充能施放。
 *
 * 同一目标已被汲取时再放只会浪费充能，只对还没被汲取的敌方英雄放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'death_prophet_spirit_siphon',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: {
          noModifier: [
            'modifier_death_prophet_spirit_siphon',
            'modifier_death_prophet_spirit_siphon_slow',
          ],
        },
      },
    },
  },
];
