import { applyAwakenByHero, canAwaken, isAwakened } from '../../modules/awaken/awaken-replacer';
import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

/** 觉醒石：一次性消耗品，对持有英雄应用其觉醒替换，成功后销毁自身 */
@registerAbility('item_awaken_stone')
export class ItemAwakenStone extends BaseItem {
  // 返回拦截用的错误文本 key（带 #），可觉醒则返回空字符串
  private castErrorKey(): string {
    const caster = this.GetCaster();
    if (caster === undefined || !caster.IsHero()) {
      return '';
    }
    const hero = caster as CDOTA_BaseNPC_Hero;
    if (!canAwaken(hero)) {
      return '#dota_hud_error_awaken_stone_unsupported';
    }
    if (isAwakened(hero)) {
      return '#dota_hud_error_awaken_stone_awakened';
    }
    return '';
  }

  // CastFilterResult 返回 UF_FAIL_CUSTOM 时引擎才会取 GetCustomCastError 飘字，两者须配套
  CastFilterResult(): UnitFilterResult {
    return this.castErrorKey() !== '' ? UnitFilterResult.FAIL_CUSTOM : UnitFilterResult.SUCCESS;
  }

  GetCustomCastError(): string {
    return this.castErrorKey();
  }

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
