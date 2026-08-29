import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 烟幕：POINT + AOE / ENEMY / HERO+BASIC，沉默与失手，不造成伤害。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'riki_smoke_screen',
    targetSide: TargetSide.EnemyHero,
  },
];
