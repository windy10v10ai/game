import { CastCoindition } from '../action/cast-condition';
import { TargetSide } from '../ability/ability-spec';

/**
 * 物品 AI 规格 —— 描述某个物品在何种条件下、对何种目标使用。
 *
 * 与 AbilitySpec 同构，供 ItemDispatcher 消费；同一个 itemName 可注册多条 spec
 * （如 item_blade_mail_2 的激进/保守两条），由 ItemRegistry 以 Map<itemName, ItemSpec[]> 维护。
 */
/**
 * 施放档位：bot 按物品栏顺序检查物品，整理物品栏时把档位靠前的放前面，
 * 同时满足条件时先保命、再控制、再加增益，最后才用输出与刷新。
 */
export enum ItemPriority {
  Survival = 1,
  Control,
  Buff,
  Damage,
  Default,
  Refresh,
}

export interface ItemSpec {
  itemName: string;
  targetSide: TargetSide;
  condition?: CastCoindition;
  /** 物品在备用栏位（6-8槽）中仍可使用（默认 false）。适用于拾取物。 */
  usableFromBackpack?: boolean;
  /** 不填为 Default */
  priority?: ItemPriority;
}
