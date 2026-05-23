import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 苍穹震击：UNIT_TARGET / ENEMY / HERO | BASIC。
 *
 * 对英雄无额外限制；对小兵要求至少 2 个聚集才施放（技能可 bounce 到相邻目标）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_ether_shock',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'shadow_shaman_ether_shock',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
