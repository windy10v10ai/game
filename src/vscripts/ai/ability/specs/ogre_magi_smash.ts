import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 烈火护盾：UNIT_TARGET / FRIENDLY / HERO+BASIC+BUILDING，Shard 解锁。
 *
 * noModifier 防止在护盾持续期内重复覆盖。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ogre_magi_smash',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { noModifier: ['modifier_ogre_magi_smash_buff'] },
      },
    },
  },
];
