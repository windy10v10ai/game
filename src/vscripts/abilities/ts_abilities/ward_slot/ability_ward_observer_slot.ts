import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 真眼额外槽位：充能由商店购买真眼经 WardSlot filter 注入，放置时消耗一层充能。 */
@registerAbility('abilities/ts_abilities/ward_slot/ability_ward_observer_slot')
export class AbilityWardObserverSlot extends BaseAbility {
  OnSpellStart(): void {
    const caster = this.GetCaster();
    const point = this.GetCursorPosition();
    const lifetime = this.GetSpecialValueFor('lifetime');

    const ward = CreateUnitByName(
      'npc_dota_observer_wards',
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
