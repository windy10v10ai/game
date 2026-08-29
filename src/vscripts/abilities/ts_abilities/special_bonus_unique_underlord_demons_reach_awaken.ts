import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const ATROPHY_ABILITY = 'abyssal_underlord_atrophy_aura';
const ATROPHY_DAMAGE_COUNTER = 'modifier_abyssal_underlord_atrophy_aura_dmg_buff_counter';
const ATROPHY_ICON = 'abyssal_underlord_atrophy_aura';

@registerAbility('special_bonus_unique_underlord_demons_reach_awaken')
export class SpecialBonusUniqueUnderlordDemonsReachAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_underlord_demons_reach_awaken.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_underlord_demons_reach_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_underlord_demons_reach_awaken extends BaseModifier {
  OnCreated(): void {
    if (!IsServer()) return;

    this.updateCleaveDistance();
    this.StartIntervalThink(0.5);
  }

  OnIntervalThink(): void {
    this.updateCleaveDistance();
  }

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return ATROPHY_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  private updateCleaveDistance(): void {
    const parent = this.GetParent();
    const atrophyAura = parent.FindAbilityByName(ATROPHY_ABILITY);
    const damageCounter = parent.FindModifierByName(ATROPHY_DAMAGE_COUNTER);
    const bonusDamage =
      damageCounter && !damageCounter.IsNull() ? damageCounter.GetStackCount() : 0;
    const cleaveDistance =
      atrophyAura && !atrophyAura.IsNull() && bonusDamage > 0
        ? atrophyAura.GetSpecialValueFor('cleave_distance_base') +
          atrophyAura.GetSpecialValueFor('cleave_distance_per_stack') * bonusDamage
        : 0;

    if (cleaveDistance !== this.GetStackCount()) {
      this.SetStackCount(cleaveDistance);
    }
  }
}
