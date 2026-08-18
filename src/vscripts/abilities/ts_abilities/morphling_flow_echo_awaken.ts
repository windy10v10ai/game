import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateMorphlingFlowCooldownSpeedBonus,
  calculateMorphlingFlowSpellAmplification,
  roundMorphlingFlowTooltipValue,
} from './morphling-flow-echo-math';

const SCRIPT_PATH = 'abilities/ts_abilities/morphling_flow_echo_awaken';
const MODIFIER_NAME = 'modifier_morphling_flow_echo_awaken';

@registerAbility('morphling_flow_echo_awaken')
export class MorphlingFlowEchoAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return MODIFIER_NAME;
  }
}

@registerModifier(SCRIPT_PATH)
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_flow_echo_awaken extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  AllowIllusionDuplicate(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'morphling_ebb_and_flow';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.COOLDOWN_PERCENTAGE,
      ModifierFunction.COOLDOWN_PERCENTAGE_ONGOING,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  GetModifierSpellAmplify_Percentage(): number {
    return this.isActiveForParent() ? this.getSpellAmplification() : 0;
  }

  GetModifierPercentageCooldown(event: ModifierAbilityEvent): number {
    return this.getCooldownSpeedBonusForAbility(event);
  }

  GetModifierPercentageCooldownOngoing(event: ModifierAbilityEvent): number {
    return this.getCooldownSpeedBonusForAbility(event);
  }

  OnTooltip(): number {
    return this.isActiveForParent()
      ? roundMorphlingFlowTooltipValue(this.getSpellAmplification())
      : 0;
  }

  OnTooltip2(): number {
    return this.isActiveForParent()
      ? roundMorphlingFlowTooltipValue(this.getCooldownSpeedBonus())
      : 0;
  }

  private isActiveForParent(): boolean {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    return (
      !parent.IsIllusion() &&
      !parent.PassivesDisabled() &&
      !!ability &&
      !ability.IsNull() &&
      ability.GetLevel() > 0
    );
  }

  private getSpellAmplification(): number {
    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    const ability = this.GetAbility();
    if (!ability) return 0;

    return calculateMorphlingFlowSpellAmplification(
      parent.GetAgility(),
      ability.GetSpecialValueFor('agility_per_spell_amp'),
    );
  }

  private getCooldownSpeedBonusForAbility(event: ModifierAbilityEvent): number {
    if (!this.isActiveForParent() || !event.ability || event.ability.IsNull()) return 0;
    return this.getCooldownSpeedBonus();
  }

  private getCooldownSpeedBonus(): number {
    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    const ability = this.GetAbility();
    if (!ability) return 0;

    return calculateMorphlingFlowCooldownSpeedBonus(
      parent.GetAgility(),
      parent.GetStrength(),
      ability.GetSpecialValueFor('min_strength_agility_ratio'),
      ability.GetSpecialValueFor('max_strength_agility_ratio'),
      ability.GetSpecialValueFor('max_cooldown_speed_bonus'),
    );
  }
}
