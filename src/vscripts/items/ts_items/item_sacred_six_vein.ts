import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

/** 六脉神剑：属性全部由三把对剑的原生 modifier 提供，自己不声明任何属性。 */
@registerAbility('item_sacred_six_vein')
export class ItemSacredSixVein extends BaseItem {
  GetIntrinsicModifierName(): string {
    return ModifierItemSacredSixVeinPassive.name;
  }
}

@registerModifier('items/ts_items/item_sacred_six_vein', 'modifier_item_sacred_six_vein')
export class ModifierItemSacredSixVeinPassive extends BaseItemModifier {
  override statsModifierName: string = '';
  override vanillaModifierNames: string[] = [
    'modifier_item_sange_and_yasha',
    'modifier_item_yasha_and_kaya',
    'modifier_item_kaya_and_sange',
  ];
}
