import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 穿刺：DOTA_ABILITY_BEHAVIOR_POINT / ENEMY / HERO+BASIC，射程 550–775。
 *
 * 施法者会钻到目标脚下，对英雄只在决定上去打时用；对小兵要求 ≥2 个目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sandking_burrowstrike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { stance: 'fight' },
    },
  },
  {
    abilityName: 'sandking_burrowstrike',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
