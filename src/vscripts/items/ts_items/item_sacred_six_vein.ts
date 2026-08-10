import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

/** 六脉神剑：属性主体复用三叉戟，它不属于散华/夜叉/慧光家族，多件之间不会被「同系取最大」压掉。 */
@registerAbility('item_sacred_six_vein')
export class ItemSacredSixVein extends BaseItem {
  GetIntrinsicModifierName(): string {
    return ModifierItemSacredSixVeinPassive.name;
  }
}

@registerModifier('items/ts_items/item_sacred_six_vein', 'modifier_item_sacred_six_vein')
export class ModifierItemSacredSixVeinPassive extends BaseItemModifier {
  override statsModifierName: string = '';
  override vanillaModifierNames: string[] = ['modifier_item_trident'];

  // 这三项三叉戟不提供，DataDriven 的 Properties 也没有对应名字，只能自己声明
  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.CASTTIME_PERCENTAGE,
      ModifierFunction.MANACOST_PERCENTAGE_STACKING,
      ModifierFunction.SLOW_RESISTANCE_STACKING,
    ];
  }

  GetModifierPercentageCasttime(): number {
    return this.GetAbility()?.GetSpecialValueFor('cast_speed_pct') ?? 0;
  }

  GetModifierPercentageManacostStacking(): number {
    return this.GetAbility()?.GetSpecialValueFor('manacost_reduction') ?? 0;
  }

  GetModifierSlowResistance_Stacking(): number {
    return this.GetAbility()?.GetSpecialValueFor('slow_resistance') ?? 0;
  }
}
