/** Morphling awakening keeps attribute snapshots separate from the native transformation. */
import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

@registerAbility('morphling_replicat_steal_all')
export class MorphlingReplicatStealAll extends BaseAbility {
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
    const fraction = this.GetSpecialValueFor('inherit_pct') / 100;
    const cap = this.GetSpecialValueFor('cap_pct') / 100;
    const uncapped = caster.HasScepter();
    const gain = (value: number, own: number): number =>
      uncapped ? value * fraction : math.min(value * fraction, own * cap);
    caster.AddNewModifier(caster, this, modifier_morphling_awaken_stats.name, {
      duration: this.GetSpecialValueFor('duration'),
      strength: gain(target.GetStrength() - (targetBuff?.strength ?? 0), caster.GetStrength()),
      agility: gain(target.GetAgility() - (targetBuff?.agility ?? 0), caster.GetAgility()),
      intellect: gain(
        target.GetIntellect(false) - (targetBuff?.intellect ?? 0),
        caster.GetIntellect(false),
      ),
    });
    caster.EmitSound('Hero_Morphling.Replicate');
  }
}

interface AttributeSnapshot {
  strength: number;
  agility: number;
  intellect: number;
}

@registerModifier('abilities/ts_abilities/morphling_replicat_steal_all')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_awaken_stats extends BaseModifier {
  strength = 0;
  agility = 0;
  intellect = 0;

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'morphling_replicate';
  }

  OnCreated(data: AttributeSnapshot): void {
    if (!IsServer()) return;
    this.strength = data.strength;
    this.agility = data.agility;
    this.intellect = data.intellect;
    this.SetHasCustomTransmitterData(true);
  }

  AddCustomTransmitterData(): AttributeSnapshot {
    return { strength: this.strength, agility: this.agility, intellect: this.intellect };
  }

  HandleCustomTransmitterData(data: AttributeSnapshot): void {
    this.strength = data.strength;
    this.agility = data.agility;
    this.intellect = data.intellect;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
    ];
  }

  GetModifierBonusStats_Strength(): number {
    return this.strength;
  }

  GetModifierBonusStats_Agility(): number {
    return this.agility;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.intellect;
  }
}

@registerModifier('abilities/ts_abilities/morphling_replicat_steal_all')
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
    return [
      ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
      ModifierFunction.ON_ABILITY_FULLY_CAST,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    return IsServer() &&
      (this.GetAbility()?.GetLevel() ?? 0) > 0 &&
      !this.GetParent().PassivesDisabled() &&
      !this.GetParent().IsIllusion() &&
      event.ability.GetAbilityName() === 'morphling_waveform' &&
      event.ability_special_value === 'process_procs'
      ? 1
      : 0;
  }

  GetModifierOverrideAbilitySpecialValue(): number {
    // The awakened attack already processes attack effects once per target.
    return 0;
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
    if (name === 'morphling_waveform' && !event.unit.PassivesDisabled()) {
      event.unit.AddNewModifier(event.unit, ability, modifier_morphling_awaken_waveform.name, {});
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

@registerModifier('abilities/ts_abilities/morphling_replicat_steal_all')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_awaken_waveform extends BaseModifier {
  private previous!: Vector;
  private hit: EntityIndex[] = [];
  private started = false;
  private expires = 0;
  private radius = 0;
  private attacking = false;
  private attackAmp = 0;
  private records: Record<number, number> = {};

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.begin();
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.begin();
  }

  private begin(): void {
    const parent = this.GetParent();
    this.previous = parent.GetAbsOrigin();
    this.hit = [];
    this.started = false;
    this.expires = GameRules.GetGameTime() + 0.2;
    this.radius = parent.FindAbilityByName('morphling_waveform')?.GetSpecialValueFor('width') ?? 0;
    this.StartIntervalThink(FrameTime());
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.DAMAGEOUTGOING_PERCENTAGE,
      ModifierFunction.ON_ATTACK_RECORD,
      ModifierFunction.ON_ATTACK_RECORD_DESTROY,
    ];
  }

  OnAttackRecord(event: ModifierAttackEvent): void {
    if (event.attacker === this.GetParent() && this.attacking)
      this.records[event.record] = this.attackAmp;
  }

  OnAttackRecordDestroy(event: ModifierAttackEvent): void {
    delete this.records[event.record];
  }

  GetModifierDamageOutgoing_Percentage(event: ModifierAttackEvent): number {
    return this.records[event.record] ?? 0;
  }

  OnIntervalThink(): void {
    const parent = this.GetParent();
    if (!parent.IsAlive()) {
      this.Destroy();
      return;
    }
    const moving = parent.HasModifier('modifier_morphling_waveform');
    if (!moving && !this.started) {
      if (GameRules.GetGameTime() >= this.expires) this.Destroy();
      return;
    }
    this.started = true;
    const position = parent.GetAbsOrigin();
    if (!parent.PassivesDisabled() && (this.GetAbility()?.GetLevel() ?? 0) > 0) {
      const enemies = FindUnitsInLine(
        parent.GetTeamNumber(),
        this.previous,
        position,
        undefined,
        this.radius,
        UnitTargetTeam.ENEMY,
        UnitTargetType.HERO + UnitTargetType.BASIC,
        UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      );
      for (const enemy of enemies) {
        if (
          !enemy.IsAlive() ||
          enemy.IsBuilding() ||
          enemy.IsInvulnerable() ||
          this.hit.includes(enemy.entindex())
        )
          continue;
        this.hit.push(enemy.entindex());
        this.attackAmp = parent.GetSpellAmplification(false) * 100;
        this.attacking = true;
        parent.PerformAttack(enemy, true, true, true, false, false, false, false);
        this.attacking = false;
      }
    }
    this.previous = position;
    if (!moving) this.Destroy();
  }
}
