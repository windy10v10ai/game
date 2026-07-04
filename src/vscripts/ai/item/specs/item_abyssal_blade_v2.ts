import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/**
 * 一闪：跳过已被控目标；Lua 原版有 20% 随机几率门槛，这里改为条件满足即放
 * （CD/血量条件已足够节流，不再引入随机数字段）。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_abyssal_blade_v2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { notActionable: true } },
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
];
