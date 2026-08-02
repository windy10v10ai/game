import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const SHALLOW_GRAVE_ABILITY = 'dazzle_shallow_grave';
const BKB_EFFECT_PARTICLE = 'particles/items_fx/black_king_bar_avatar.vpcf';
const BKB_ACTIVATE_SOUND = 'DOTA_Item.BlackKingBar.Activate';

/** 戴泽觉醒：薄葬期间为目标附加减益免疫与魔法抗性。 */
@registerAbility('special_bonus_unique_dazzle_upgrade')
export class SpecialBonusUniqueDazzleUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_dazzle_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dazzle_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dazzle_upgrade extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return SHALLOW_GRAVE_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const ability = event.ability;
    if (event.unit !== parent || ability.GetAbilityName() !== SHALLOW_GRAVE_ABILITY) return;

    const target = ability.GetCursorTarget();
    if (!target || target.IsNull() || !target.IsAlive()) return;
    if (target.GetTeamNumber() !== parent.GetTeamNumber()) return;

    const awakenAbility = this.GetAbility();
    if (!awakenAbility || awakenAbility.IsNull() || awakenAbility.GetLevel() <= 0) return;

    const duration = ability.GetSpecialValueFor('duration');
    if (duration <= 0) return;

    target.AddNewModifier(
      parent,
      awakenAbility,
      modifier_special_bonus_unique_dazzle_upgrade_shallow_grave.name,
      { duration },
    );
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dazzle_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dazzle_upgrade_shallow_grave extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsDebuff(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return SHALLOW_GRAVE_ABILITY;
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const particle = ParticleManager.CreateParticle(
      BKB_EFFECT_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    this.AddParticle(particle, false, false, -1, false, false);
    parent.EmitSound(BKB_ACTIVATE_SOUND);
  }

  OnRefresh(): void {
    if (!IsServer()) return;

    this.GetParent().EmitSound(BKB_ACTIVATE_SOUND);
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.DEBUFF_IMMUNE]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
  }

  GetModifierMagicalResistanceBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('magic_resistance') ?? 0;
  }
}
