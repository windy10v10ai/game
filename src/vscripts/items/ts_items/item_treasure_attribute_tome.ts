import { PlayerHelper } from '../../modules/helper/player-helper';
import { BaseItem, registerAbility } from '../../utils/dota_ts_adapter';

@registerAbility('item_treasure_attribute_tome')
export class ItemTreasureAttributeTome extends BaseItem {
  private canCast(caster: CDOTA_BaseNPC | undefined): caster is CDOTA_BaseNPC {
    if (!caster || !caster.IsRealHero()) return false;

    const playerId = caster.GetPlayerOwnerID();
    if (playerId < 0) return false;

    return (
      !IsServer() ||
      (PlayerHelper.IsHumanPlayerByPlayerId(playerId) &&
        PlayerResource.GetSelectedHeroEntity(playerId) === caster)
    );
  }

  CastFilterResult(): UnitFilterResult {
    return this.canCast(this.GetCaster()) ? UnitFilterResult.SUCCESS : UnitFilterResult.FAIL_CUSTOM;
  }

  GetCustomCastError(): string {
    return '#dota_hud_error_treasure_attribute_tome_invalid_caster';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    if (this.canCast(caster)) {
      GameRules.Lottery.Item.onAttributeTomeUsed(caster.GetPlayerOwnerID());
      UTIL_Remove(this);
    }
  }
}
