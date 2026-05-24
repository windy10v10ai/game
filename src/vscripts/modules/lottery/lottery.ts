import { reloadable } from '../../utils/tstl-utils';
import { AbilityLottery } from './ability/ability-lottery';
import { ItemLottery } from './item/item-lottery';

/**
 * 抽奖系统聚合入口。
 * Ability：开局一次性的技能抽奖（整局存在）。
 * Item：藏宝箱触发的瞬时 4 选 1 物品抽奖。
 */
@reloadable
export class Lottery {
  readonly Ability = new AbilityLottery();
  readonly Item = new ItemLottery();
}
