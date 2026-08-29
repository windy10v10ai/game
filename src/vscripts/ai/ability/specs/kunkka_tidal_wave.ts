import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 潮汐波：POINT / ENEMY / HERO+BASIC，Shard 解锁。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'kunkka_tidal_wave',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'kunkka_tidal_wave',
    targetSide: TargetSide.EnemyCreep,
  },
];
