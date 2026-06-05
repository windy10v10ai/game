import { applyAwakenByHero } from '../../modules/awaken/awaken-replacer';
import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

/** 觉醒石：一次性消耗品，对持有英雄应用其觉醒替换，成功后销毁自身 */
@registerAbility('item_awaken_stone')
export class ItemAwakenStone extends BaseItem {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) {
      return;
    }

    const success = applyAwakenByHero(caster as CDOTA_BaseNPC_Hero);
    if (success) {
      UTIL_Remove(this);
    }
  }
}
