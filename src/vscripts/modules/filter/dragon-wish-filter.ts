export const AEON_DISK_BUFF = 'modifier_item_aeon_disk_buff';
export const IMMORTALITY_MODIFIER = 'modifier_item_helm_of_the_undying_active';
const CULLING_BLADE = 'axe_culling_blade';
const SOLAR_CREST = 'item_solar_crest';

export class DragonWishFilter {
  constructor() {
    GameRules.GetGameModeEntity().SetExecuteOrderFilter((args) => this.filterOrder(args), this);
  }

  private filterOrder(args: ExecuteOrderFilterEvent): boolean {
    if (
      args.order_type !== UnitOrder.CAST_TARGET ||
      !args.entindex_ability ||
      !args.entindex_target
    ) {
      return true;
    }

    const ability = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
    const target = EntIndexToHScript(args.entindex_target) as CDOTA_BaseNPC | undefined;
    if (!ability || !target) return true;

    if (IsSolarCrestOnEnemy(ability, target)) return false;
    if (ability.GetAbilityName() !== CULLING_BLADE) return true;
    return !target.HasModifier(IMMORTALITY_MODIFIER);
  }
}

// 原生 bot 会把炎阳纹章对敌人放，引擎拒绝后每帧重试、打断自己的对线，直接丢掉这类命令
function IsSolarCrestOnEnemy(ability: CDOTABaseAbility, target: CDOTA_BaseNPC): boolean {
  return (
    ability.GetAbilityName() === SOLAR_CREST &&
    target.GetTeamNumber() !== ability.GetCaster().GetTeamNumber()
  );
}
