import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 洪流：POINT + AOE / ENEMY / HERO+BASIC。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'kunkka_torrent',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'kunkka_torrent',
    targetSide: TargetSide.EnemyCreep,
  },
];
