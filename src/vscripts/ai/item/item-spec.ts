import { CastCoindition } from '../action/cast-condition';
import { TargetSide } from '../ability/ability-spec';

/**
 * 物品 AI 规格 —— 描述某个物品在何种条件下、对何种目标使用。
 *
 * 与 AbilitySpec 同构，供 ItemDispatcher 消费；同一个 itemName 可注册多条 spec
 * （如 item_blade_mail_2 的激进/保守两条），由 ItemRegistry 以 Map<itemName, ItemSpec[]> 维护。
 */
export interface ItemSpec {
  itemName: string;
  targetSide: TargetSide;
  condition?: CastCoindition;
  /** 物品在备用栏位（6-8槽）中仍可使用（默认 false）。适用于拾取物。 */
  usableFromBackpack?: boolean;
}
