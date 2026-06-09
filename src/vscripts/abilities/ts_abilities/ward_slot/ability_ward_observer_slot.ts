import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';

/** 参考 1x6 abilities/ui/observer.lua */
@registerAbility('abilities/ts_abilities/ward_slot/ability_ward_observer_slot')
export class AbilityWardObserverSlot extends BaseAbility {
  OnSpellStart(): void {
    print('[ward-slot] observer OnSpellStart');
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
    print('[ward-slot] observer ward: ' + (ward ? ward.GetClassname() : 'nil'));
    ward.AddNewModifier(caster, this, 'modifier_kill', { duration: lifetime });
  }
}
