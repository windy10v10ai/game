import { BaseAbility, registerAbility } from '../../utils/dota_ts_adapter';

/** 假眼额外槽位：充能由商店购买假眼经 WardSlot filter 注入，放置时消耗一层充能。 */
@registerAbility('abilities/ward_slot/ability_ward_sentry_slot')
export class AbilityWardSentrySlot extends BaseAbility {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    const point = this.GetCursorPosition();
    const lifetime = this.GetSpecialValueFor('lifetime');

    const ward = CreateUnitByName(
      'npc_dota_sentry_wards',
      point,
      false,
      caster,
      caster,
      caster.GetTeamNumber(),
    );
    ward.SetControllableByPlayer(caster.GetPlayerOwnerID(), true);
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
