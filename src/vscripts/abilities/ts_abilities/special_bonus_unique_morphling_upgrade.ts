import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { calculateBorrowedAgility } from './morphling-awaken-math';

const REPLICATE_ABILITY = 'morphling_replicate';
const WAVEFORM_ABILITY = 'morphling_waveform';

/** Morphling awakening: Replicate lends the target's attributes as Agility, Agility feeds spell amp, and Waveform attacks along its path. */
@registerAbility('special_bonus_unique_morphling_upgrade')
export class SpecialBonusUniqueMorphlingUpgrade extends BaseAbility {
  // Intrinsic modifiers only attach once the ability is leveled, and the level follows Morph, so the
  // awakened icon would stay missing until level 6. Starting at level 1 instead would drag Morph to
  // level 1 through the two-way LinkedAbility. Effects still check the level.
  Spawn(): void {
    if (!IsServer()) return;
    this.SetContextThink(
      'attach_awaken_modifier',
      () => {
        const caster = this.GetCaster();
        if (caster && !caster.HasModifier(modifier_special_bonus_unique_morphling_upgrade.name)) {
          caster.AddNewModifier(
            caster,
            this,
            modifier_special_bonus_unique_morphling_upgrade.name,
            {},
          );
        }
        return undefined;
      },
      0,
    );
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
    return REPLICATE_ABILITY;
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
    return [ModifierFunction.STATS_AGILITY_BONUS, ModifierFunction.TOOLTIP];
  }

  GetModifierBonusStats_Agility(): number {
    return this.agility;
  }

  OnTooltip(): number {
    return math.floor(this.agility);
  }
}

/** Skill bar slot is hidden, so this permanent icon is what tells the player the hero is awakened. */
@registerModifier('abilities/ts_abilities/special_bonus_unique_morphling_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_morphling_upgrade extends BaseModifier {
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
    return WAVEFORM_ABILITY;
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
    const parent = this.GetParent();
    if (!IsServer() || event.unit !== parent) return;
    const ability = this.GetAbility();
    if (!ability || ability.GetLevel() === 0 || parent.IsIllusion()) return;
    const name = event.ability.GetAbilityName();
    if (name === REPLICATE_ABILITY) {
      this.borrowAgility(ability, event.target);
    } else if (name === WAVEFORM_ABILITY && !parent.PassivesDisabled()) {
      parent.AddNewModifier(parent, ability, modifier_morphling_awaken_waveform.name, {});
    }
  }

  private borrowAgility(ability: CDOTABaseAbility, target: CDOTA_BaseNPC | undefined): void {
    const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (!target || target === caster || !target.IsHero()) return;
    const hero = target as CDOTA_BaseNPC_Hero;
    // Replacing the old snapshot first keeps recasts from stacking.
    caster.RemoveModifierByName(modifier_morphling_awaken_stats.name);
    caster.CalculateStatBonus(true);
    // Another awakened Morphling's own borrowed Agility is not part of what it can lend.
    const lent = hero.FindModifierByName(modifier_morphling_awaken_stats.name) as
      | modifier_morphling_awaken_stats
      | undefined;
    const agility = calculateBorrowedAgility(
      hero.GetStrength(),
      hero.GetAgility(),
      hero.GetIntellect(false),
      lent?.agility ?? 0,
      ability.GetSpecialValueFor('inherit_pct'),
    );
    caster.AddNewModifier(caster, ability, modifier_morphling_awaken_stats.name, {
      duration: ability.GetSpecialValueFor('duration'),
      agility,
    });
  }
}

/** Vanilla Waveform has no path attack (process_procs only passes attack effects), so the attacks are scripted. */
@registerModifier('abilities/ts_abilities/special_bonus_unique_morphling_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_morphling_awaken_waveform extends BaseModifier {
  private previous!: Vector;
  private hit: EntityIndex[] = [];
  private started = false;
  private expires = 0;
  private radius = 0;
  private attacking = false;
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
    if (event.attacker !== this.GetParent() || !this.attacking) return;
    const pct = this.GetAbility()?.GetSpecialValueFor('waveform_attack_pct') ?? 100;
    this.records[event.record] = pct - 100;
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
    const ability = this.GetAbility();
    const maxTargets = ability?.GetSpecialValueFor('waveform_max_targets') ?? 0;
    if (!parent.PassivesDisabled() && (ability?.GetLevel() ?? 0) > 0) {
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
        if (this.hit.length >= maxTargets) break;
        if (
          !enemy.IsAlive() ||
          enemy.IsBuilding() ||
          enemy.IsInvulnerable() ||
          this.hit.includes(enemy.entindex())
        )
          continue;
        this.hit.push(enemy.entindex());
        this.attacking = true;
        parent.PerformAttack(enemy, true, true, true, false, false, false, false);
        this.attacking = false;
      }
    }
    this.previous = position;
    if (!moving) this.Destroy();
  }
}
