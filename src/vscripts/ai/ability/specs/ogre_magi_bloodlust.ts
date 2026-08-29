import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 嗜血术：UNIT_TARGET / AUTOCAST / FRIENDLY。bot 抽到即开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ogre_magi_bloodlust',
    targetSide: TargetSide.Self,
    condition: { action: { autoCastOn: true } },
  },
];
