import {
  LONE_DRUID_INHERITABLE_ABILITY_NAMES,
  LONE_DRUID_BEAR_INHERITANCE_MODIFIER,
  isLoneDruidSpiritBearUnitName,
} from '../../abilities/ts_abilities/lone-druid-bear-inheritance';

export const IMMORTALITY_MODIFIER = 'modifier_item_helm_of_the_undying_active';
const CULLING_BLADE = 'axe_culling_blade';

export class DragonWishFilter {
  constructor() {
    GameRules.GetGameModeEntity().SetExecuteOrderFilter((args) => this.filterOrder(args), this);
  }

  private filterOrder(args: ExecuteOrderFilterEvent): boolean {
    if (args.order_type === UnitOrder.TRAIN_ABILITY && args.entindex_ability) {
      return this.redirectSpiritBearAbilityTraining(args);
    }

    if (
      args.order_type !== UnitOrder.CAST_TARGET ||
      !args.entindex_ability ||
      !args.entindex_target
    ) {
      return true;
    }

    const ability = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
    if (!ability || ability.GetAbilityName() !== CULLING_BLADE) {
      return true;
    }

    const target = EntIndexToHScript(args.entindex_target) as CDOTA_BaseNPC | undefined;
    if (!target) return true;

    return !target.HasModifier(IMMORTALITY_MODIFIER);
  }

  private redirectSpiritBearAbilityTraining(args: ExecuteOrderFilterEvent): boolean {
    const bearAbility = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
    if (!bearAbility) return true;

    const abilityName = bearAbility.GetAbilityName();
    if (!LONE_DRUID_INHERITABLE_ABILITY_NAMES.has(abilityName)) return true;

    const bear = bearAbility.GetCaster();
    if (
      !bear ||
      !PlayerResource.IsValidPlayerID(args.issuer_player_id_const) ||
      bear.GetPlayerOwnerID() !== args.issuer_player_id_const ||
      !isLoneDruidSpiritBearUnitName(bear.GetUnitName()) ||
      !bear.HasModifier(LONE_DRUID_BEAR_INHERITANCE_MODIFIER)
    ) {
      return true;
    }

    const druid = PlayerResource.GetSelectedHeroEntity(args.issuer_player_id_const);
    if (!druid) return false;

    const druidAbility = druid.FindAbilityByName(abilityName);
    if (!druidAbility) return false;

    const previousLevel = druidAbility.GetLevel();
    druid.UpgradeAbility(druidAbility);
    const level = druidAbility.GetLevel();
    if (level !== previousLevel) bearAbility.SetLevel(level);
    return false;
  }
}
