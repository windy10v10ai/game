import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 寒霜爆发：UNIT_TARGET | AOE / ENEMY / HERO+BASIC。
 *
 * - 对敌方英雄：范围内任意敌方英雄即可主动释放；技能 level >= 2 才用（1 级伤害低、蓝耗占比高）。
 * - 对敌方小兵：要求范围内至少 2 个敌方小兵（AOE 才划算）；其余蓝量/血量/level/无敌英雄附近
 *   等限制由 CREEP_DEFAULT_CONDITION 自动套用。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_frost_nova',
    targetSide: TargetSide.EnemyHero,
    condition: {
      ability: { level: { gte: 2 } },
    },
  },
  {
    abilityName: 'lich_frost_nova',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
