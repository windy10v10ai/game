export const IMMORTALITY_MODIFIER = 'modifier_item_helm_of_the_undying_active';
const CULLING_BLADE = 'axe_culling_blade';
const ENIGMA_AWAKENED = 'enigma_black_hole_awakened';
const ENIGMA_NATIVE = 'enigma_black_hole';

export class DragonWishFilter {
  constructor() {
    GameRules.GetGameModeEntity().SetExecuteOrderFilter((args) => this.filterOrder(args), this);
  }

  private filterOrder(args: ExecuteOrderFilterEvent): boolean {
    if (args.order_type === UnitOrder.CAST_TOGGLE_AUTO && args.entindex_ability) {
      const ability = EntIndexToHScript(args.entindex_ability) as CDOTABaseAbility | undefined;
      if (ability && ability.GetAbilityName() === ENIGMA_AWAKENED && !ability.GetAutoCastState()) {
        const caster = ability.GetCaster();
        const native = caster?.FindAbilityByName(ENIGMA_NATIVE);
        if (
          caster?.IsChanneling() ||
          ability.GetCooldownTimeRemaining() > 0 ||
          (native !== undefined && native.GetCooldownTimeRemaining() > 0)
        ) {
          return false;
        }
      }
      return true;
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
}
