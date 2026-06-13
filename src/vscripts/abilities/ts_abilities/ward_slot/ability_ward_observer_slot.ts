import { BaseAbility, registerAbility } from '../../../utils/dota_ts_adapter';
import { isInWardNoCastZone } from './ward-no-cast-zone';

/** 参考 1x6 abilities/ui/observer.lua */
@registerAbility('ability_ward_observer_slot')
export class AbilityWardObserverSlot extends BaseAbility {
  IsRefreshable(): boolean {
    return false;
  }

  // CastFilterResultLocation 返回 UF_FAIL_CUSTOM 时引擎才会取 GetCustomCastErrorLocation 飘字，两者须配套
  CastFilterResultLocation(location: Vector): UnitFilterResult {
    return isInWardNoCastZone(location) ? UnitFilterResult.FAIL_CUSTOM : UnitFilterResult.SUCCESS;
  }

  GetCustomCastErrorLocation(): string {
    return '#dota_hud_error_ward_no_cast_zone';
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
