import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 帕吉 - 肢解：UNIT_TARGET | CHANNELLED / ENEMY。
 *
 * 冷却短，近身就放；伤害高，目标已被控制也照放，让控制重叠，避免对单人玩家无缝连控。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'pudge_dismember',
    targetSide: TargetSide.EnemyHero,
    control: true,
  },
];
