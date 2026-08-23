import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 迷雾缠绕：可指向双方阵营，治疗友军或伤害敌人，两种用法都要施法者自己掉血。
 *
 * 友方候选天然包含施法者且排在首位，而对自己施放等于自伤换自愈，所以必须排除自己。
 * 没有队友血量够低时转为打敌人，两条 spec 按此顺序尝试。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'abaddon_death_coil',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 80 } },
        excludeSelf: true,
      },
    },
  },
  {
    abilityName: 'abaddon_death_coil',
    targetSide: TargetSide.EnemyHero,
  },
];
