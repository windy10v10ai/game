import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 参考 1x6 abilities/ui/sentry.lua */
@registerAbility('abilities/ts_abilities/ward_slot/ability_ward_sentry_slot')
export class AbilityWardSentrySlot extends BaseAbility {
  OnSpellStart(): void {
    print('[ward-slot] sentry OnSpellStart');
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
    print('[ward-slot] sentry ward: ' + (ward ? ward.GetClassname() : 'nil'));
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
