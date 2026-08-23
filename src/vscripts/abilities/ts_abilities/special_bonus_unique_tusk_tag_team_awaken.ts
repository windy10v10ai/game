import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { addTagTeamStoredDamage, calculateTagTeamExtraDamage } from './tusk-tag-team-awaken-math';

const TAG_TEAM_ABILITY = 'tusk_tag_team';
// Native caster modifier: owns Tag Team's duration, refreshes and removal lifecycle.
const TAG_TEAM_AURA_MODIFIER = 'modifier_tusk_tag_team_aura';
// Native enemy aura effect: its presence is the authoritative in-range/target check.
const TAG_TEAM_DAMAGE_MODIFIER = 'modifier_tusk_tag_team';
const NATIVE_AURA_CHECK_INTERVAL = 0.1;

/** 巨牙海民 摔角行家觉醒 */
@registerAbility('special_bonus_unique_tusk_tag_team_awaken')
export class SpecialBonusUniqueTuskTagTeamAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_tusk_tag_team_awaken.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_tusk_tag_team_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_tusk_tag_team_awaken extends BaseModifier {
  private conversionPct = 0;
  private storedDamage = 0;
  private resolvingBonusDamage = false;
  private nativeAuraCheckRunning = false;

  OnCreated(): void {
    this.refreshValues();
    if (IsServer()) this.clearStoredDamage();
  }

  OnRefresh(): void {
    this.refreshValues();
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

  IsBuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return TAG_TEAM_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_ABILITY_START,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_MODIFIER_REMOVED,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent || event.ability.GetAbilityName() !== TAG_TEAM_ABILITY) return;

    // Ability-start runs before the native aura is applied. Preserve the pool only when the
    // previous native activation is genuinely still active.
    if (!this.hasNativeTagTeamAura()) this.clearStoredDamage();
  }

  OnModifierRemoved(event: ModifierAddedEvent): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    if (event.unit !== parent || event.added_buff.GetName() !== TAG_TEAM_AURA_MODIFIER) return;
    this.clearStoredDamage();
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    if (!this.hasNativeTagTeamAura()) this.clearStoredDamage();
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || this.resolvingBonusDamage || !this.hasNativeTagTeamAura()) return;
    if (this.hasExcludedDamageFlag(event.damage_flags ?? 0)) return;

    const parent = this.GetParent();
    const target = event.unit;
    if (!target || target.IsNull()) return;

    if (target === parent) {
      this.storeDamageTaken(event);
      return;
    }

    if (event.damage <= 0) return;

    const attacker = event.attacker;
    if (!attacker || attacker.IsNull() || attacker.GetTeamNumber() !== parent.GetTeamNumber())
      return;
    if (target.GetTeamNumber() === parent.GetTeamNumber() || !target.IsAlive()) return;

    const nativeTagTeamModifier = this.findNativeTagTeamDamageModifier(target);
    const nativeTagTeamAbility = nativeTagTeamModifier?.GetAbility();
    if (!nativeTagTeamAbility || nativeTagTeamAbility.GetAbilityName() !== TAG_TEAM_ABILITY) return;

    const extraDamage = calculateTagTeamExtraDamage(
      nativeTagTeamAbility.GetSpecialValueFor('bonus_damage'),
      this.storedDamage,
      event.damage_category === DamageCategory.ATTACK,
    );
    const ability = this.GetAbility();
    if (!ability || extraDamage <= 0) return;

    this.resolvingBonusDamage = true;
    ApplyDamage({
      victim: target,
      attacker,
      damage: extraDamage,
      damage_type: event.damage_type,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION,
      ability,
    });
    this.resolvingBonusDamage = false;
  }

  OnTooltip(): number {
    return this.conversionPct;
  }

  OnTooltip2(): number {
    return this.GetStackCount();
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability) return;
    this.conversionPct = ability.GetSpecialValueFor('damage_taken_to_bonus_pct');
  }

  private clearStoredDamage(): void {
    this.storedDamage = 0;
    this.SetStackCount(0);
    this.SendBuffRefreshToClients();
    if (this.nativeAuraCheckRunning) {
      this.nativeAuraCheckRunning = false;
      this.StartIntervalThink(-1);
    }
  }

  private hasNativeTagTeamAura(): boolean {
    const parent = this.GetParent();
    return (
      !parent.IsIllusion() &&
      parent.IsAlive() &&
      parent
        .FindAllModifiersByName(TAG_TEAM_AURA_MODIFIER)
        .some((modifier) => modifier.GetAbility()?.GetAbilityName() === TAG_TEAM_ABILITY)
    );
  }

  private findNativeTagTeamDamageModifier(target: CDOTA_BaseNPC): CDOTA_Buff | undefined {
    const parent = this.GetParent();
    return target.FindAllModifiersByName(TAG_TEAM_DAMAGE_MODIFIER).find((modifier) => {
      const nativeAbility = modifier.GetAbility();
      if (!nativeAbility || nativeAbility.GetAbilityName() !== TAG_TEAM_ABILITY) return false;

      // Aura recipients are owned by the native aura emitter. GetCaster() is not the
      // authoritative association for native aura effects and can miss valid edge targets.
      return modifier.GetAuraOwner() === parent || modifier.GetCaster() === parent;
    });
  }

  private storeDamageTaken(event: ModifierInstanceEvent): void {
    const parent = this.GetParent();
    const attacker = event.attacker;
    if (!attacker || attacker.IsNull() || attacker.GetTeamNumber() === parent.GetTeamNumber())
      return;

    this.storedDamage = addTagTeamStoredDamage(this.storedDamage, event.damage, this.conversionPct);
    this.SetStackCount(Math.floor(this.storedDamage));
    if (this.storedDamage > 0 && !this.nativeAuraCheckRunning) {
      this.nativeAuraCheckRunning = true;
      this.StartIntervalThink(NATIVE_AURA_CHECK_INTERVAL);
    }
  }

  private hasExcludedDamageFlag(damageFlags: number): boolean {
    return (
      (damageFlags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS ||
      (damageFlags & DamageFlag.REFLECTION) === DamageFlag.REFLECTION
    );
  }
}
