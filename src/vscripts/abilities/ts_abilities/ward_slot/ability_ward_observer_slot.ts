import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 参考 1x6 abilities/ui/observer.lua */
@registerAbility('ability_ward_observer_slot')
export class AbilityWardObserverSlot extends BaseAbility {
  IsRefreshable(): boolean {
    return false;
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const point = this.GetCursorPosition();
    const lifetime = this.GetSpecialValueFor('lifetime');

    const ward = CreateUnitByName(
      'npc_dota_observer_wards',
      point,
      true,
      caster,
      caster,
      caster.GetTeamNumber(),
    );
    ward.SetControllableByPlayer(caster.GetPlayerOwnerID(), true);
    ward.SetOwner(caster);
    ward.AddNewModifier(caster, undefined, 'modifier_item_buff_ward', {
      duration: lifetime,
    });
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
