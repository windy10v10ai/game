import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 参考 1x6 abilities/ui/sentry.lua */
@registerAbility('ability_ward_sentry_slot')
export class AbilityWardSentrySlot extends BaseAbility {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    const point = this.GetCursorPosition();
    const lifetime = this.GetSpecialValueFor('lifetime');

    const ward = CreateUnitByName(
      'npc_dota_sentry_wards',
      point,
      true,
      caster,
      caster,
      caster.GetTeamNumber(),
    );
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
