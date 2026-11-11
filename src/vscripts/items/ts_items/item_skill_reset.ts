import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

/** 遗忘技能书:使用后从被动技能书学到的被动里选一个遗忘，选定后才消耗 */
@registerAbility('item_skill_reset')
export class ItemSkillReset extends BaseItem {
  CastFilterResult(): UnitFilterResult {
    const caster = this.GetCaster();
    if (caster === undefined || !caster.IsHero()) {
      return UnitFilterResult.SUCCESS;
    }
    return GameRules.Lottery.PassiveTome.hasOwnedAbility(caster.GetPlayerOwnerID())
      ? UnitFilterResult.SUCCESS
      : UnitFilterResult.FAIL_CUSTOM;
  }

  GetCustomCastError(): string {
    return '#dota_hud_error_skill_forget_no_passive';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (!caster || !caster.IsHero()) {
      return;
    }
    GameRules.Lottery.PassiveTome.openForget(caster as CDOTA_BaseNPC_Hero, this);
  }
}
