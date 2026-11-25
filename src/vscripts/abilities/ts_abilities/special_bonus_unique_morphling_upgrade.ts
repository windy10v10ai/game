/** Morphling awakening: borrowed agility, agility-to-spell-amp, and a cooldown shared with Replicate. */
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

@registerAbility('special_bonus_unique_morphling_upgrade')
export class SpecialBonusUniqueMorphlingUpgrade extends BaseAbility {
  GetManaCost(): number {
    return (this.GetCaster().GetMaxMana() * this.GetSpecialValueFor('mana_cost_pct')) / 100;
  }

  GetIntrinsicModifierName(): string {
    return modifier_morphling_awaken.name;
  }

  CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
    if (target === this.GetCaster()) return UnitFilterResult.FAIL_CUSTOM;
    return UnitFilter(
      target,
      UnitTargetTeam.BOTH,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_CREEP_HERO,
      this.GetCaster().GetTeamNumber(),
    );
  }

  GetCustomCastErrorTarget(): string {
    return '#dota_hud_error_cant_cast_on_self';
  }

  OnSpellStart(): void {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    const target = this.GetCursorTarget() as CDOTA_BaseNPC_Hero | undefined;
    if (!target || target === caster || !target.IsHero()) return;
    if (target.GetTeamNumber() !== caster.GetTeamNumber() && target.TriggerSpellAbsorb(this))
      return;

    // Removing the old snapshot also removes any derived attribute scaling from the cap.
    caster.RemoveModifierByName(modifier_morphling_awaken_stats.name);
    caster.CalculateStatBonus(true);
    const targetBuff = target.FindModifierByName(modifier_morphling_awaken_stats.name) as
      | modifier_morphling_awaken_stats
      | undefined;
    // Only agility is granted, so the pool is the target's total of all three attributes.
    const pool =
      target.GetStrength() +
      target.GetAgility() -
      (targetBuff?.agility ?? 0) +
      target.GetIntellect(false);
    const gain = (pool * this.GetSpecialValueFor('inherit_pct')) / 100;
    const cap = caster.HasScepter()
      ? gain
      : (caster.GetAgility() * this.GetSpecialValueFor('cap_pct')) / 100;
    caster.AddNewModifier(caster, this, modifier_morphling_awaken_stats.name, {
      duration: this.GetSpecialValueFor('duration'),
      agility: math.min(gain, cap),
    });
    caster.EmitSound('Hero_Morphling.Replicate');
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_morphling_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_awaken_stats extends BaseModifier {
  agility = 0;

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'morphling_replicate';
  }

  OnCreated(data: { agility: number }): void {
    if (!IsServer()) return;
    this.agility = data.agility;
    this.SetHasCustomTransmitterData(true);
  }

  AddCustomTransmitterData(): { agility: number } {
    return { agility: this.agility };
  }

  HandleCustomTransmitterData(data: { agility: number }): void {
    this.agility = data.agility;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.STATS_AGILITY_BONUS];
  }

  GetModifierBonusStats_Agility(): number {
    return this.agility;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_morphling_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_awaken extends BaseModifier {
  private nativeEnd = 0;
  private awakenEnd = 0;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const native = this.GetParent().FindAbilityByName('morphling_replicate');
    const ability = this.GetAbility();
    if (native && ability) this.copyCooldown(native, ability);
    this.StartIntervalThink(0.1);
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.SPELL_AMPLIFY_PERCENTAGE, ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  GetModifierSpellAmplify_Percentage(): number {
    const ability = this.GetAbility();
    const parent = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (!ability || ability.GetLevel() === 0 || parent.PassivesDisabled() || parent.IsIllusion())
      return 0;
    return parent.GetAgility() * ability.GetSpecialValueFor('agility_spell_amp');
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;
    const ability = this.GetAbility();
    if (!ability || ability.GetLevel() === 0 || event.unit.IsIllusion()) return;
    const name = event.ability.GetAbilityName();
    if (name === 'morphling_replicate' || event.ability === ability) {
      const source = event.ability;
      Timers.CreateTimer(FrameTime(), () => {
        if (this.IsNull() || source.IsNull() || ability.IsNull()) return;
        const other =
          source === ability ? this.GetParent().FindAbilityByName('morphling_replicate') : ability;
        if (other) this.copyCooldown(source, other);
      });
    }
  }

  OnIntervalThink(): void {
    const ability = this.GetAbility();
    const native = this.GetParent().FindAbilityByName('morphling_replicate');
    if (!ability || !native) return;
    const now = GameRules.GetGameTime();
    const nativeEnd = now + native.GetCooldownTimeRemaining();
    const awakenEnd = now + ability.GetCooldownTimeRemaining();
    // Track changes to the deadline, not the natural countdown, so refreshes propagate too.
    if (math.abs(nativeEnd - math.max(now, this.nativeEnd)) > 0.15) {
      this.copyCooldown(native, ability);
    } else if (math.abs(awakenEnd - math.max(now, this.awakenEnd)) > 0.15) {
      this.copyCooldown(ability, native);
    }
  }

  private copyCooldown(source: CDOTABaseAbility, target: CDOTABaseAbility): void {
    const remaining = source.GetCooldownTimeRemaining();
    target.EndCooldown();
    if (remaining > 0) target.StartCooldown(remaining);
    const now = GameRules.GetGameTime();
    this.nativeEnd = now + remaining;
    this.awakenEnd = now + remaining;
  }
}
