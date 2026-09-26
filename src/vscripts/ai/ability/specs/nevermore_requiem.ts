import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 影魔 - 魂之挽歌：NO_TARGET。
 *
 * 前摇长且贴近才吃满多道伤害，只对贴身且被硬控的敌人放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'nevermore_requiem',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        range: { lte: 400 },
        unitCondition: { disabled: 'hard' },
      },
    },
  },
];
