import { reloadable } from '../../utils/tstl-utils';
import { AbilityLottery } from './ability/ability-lottery';
import { PassiveTomeLottery } from './ability/passive-tome-lottery';
import { ItemLottery } from './item/item-lottery';

/**
 * 抽奖系统聚合入口。
 * Ability：开局一次性的技能抽奖。
 * Item：藏宝箱触发的瞬时 4 选 1 物品抽奖。
 * PassiveTome：被动技能书触发的瞬时 4 选 1 被动技能抽奖。
 */
@reloadable
export class Lottery {
  readonly Ability = new AbilityLottery();
  readonly Item = new ItemLottery();
  readonly PassiveTome = new PassiveTomeLottery();
}
