import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 参考 1x6 abilities/ui/sentry.lua */
@registerAbility('ability_ward_sentry_slot')
export class AbilityWardSentrySlot extends BaseAbility {
  IsRefreshable(): boolean {
    return false;
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const point = this.GetCursorPosition();
    const lifetime = this.GetSpecialValueFor('lifetime');
    const trueSightRange = this.GetSpecialValueFor('true_sight_range');

    const ward = CreateUnitByName(
      'npc_dota_sentry_wards',
      point,
      true,
      caster,
      caster,
      caster.GetTeamNumber(),
    );
    ward.SetControllableByPlayer(caster.GetPlayerOwnerID(), true);
    ward.SetOwner(caster);
    ward.AddNewModifier(caster, undefined, 'modifier_item_buff_ward', { duration: lifetime });
    ward.AddNewModifier(caster, undefined, 'modifier_item_ward_true_sight', {
      duration: lifetime,
      true_sight_range: trueSightRange,
    });
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
