import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 热机重置：刷新全部技能与物品冷却。
 *
 * 阈值 40 —— 满级四个主动技能全部进入冷却约 80 秒，一半不可用时才值得交出引导时间。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_rearm_lua',
    targetSide: TargetSide.Self,
    condition: {
      self: { cooldownTotal: { gte: 40 } },
    },
  },
];
