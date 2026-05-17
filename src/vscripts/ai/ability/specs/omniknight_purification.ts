import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 全能骑士 - 驱逐：UNIT_TARGET + AOE，TEAM_FRIENDLY。
 *
 * 友方治疗类 spec 最小验证用例：当友方英雄（含自己，按距离排序自己天然在首位）
 * 血量百分比低于阈值时释放。技能本身在 AOE 范围内对附近队友群体治疗。
 * 距离由 dispatcher 自动按技能施法距离过滤。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'omniknight_purification',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 70 },
        },
      },
    },
  },
];
