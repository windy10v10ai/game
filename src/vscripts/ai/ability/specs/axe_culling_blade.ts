import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 淘汰之刃：UNIT_TARGET / ENEMY / HERO，可无视魔法免疫（KV 含 MAGIC_IMMUNE_ENEMIES）。
 *
 * 仅在敌方英雄血量 ≤ 当前等级 damage（含天赋 + 法术强度加成）时施放，确保一击必杀。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'axe_culling_blade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { healthAbilityValue: { key: 'damage', lte: true, includeSpellAmp: true } },
      },
    },
  },
];
