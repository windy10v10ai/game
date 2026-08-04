import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { getDoomAwakenedStates, isDoomAwakenedFriendlyTarget } from './doom-awaken-logic';
import {
  DevourAbilityEntry,
  getDevourAbilityHighestDeclaredLevel,
  getUniqueDevourAbilityNames,
  selectTrackedDevourAbilityEntityIndexes,
} from './doom-devour-awaken-logic';

const DOOM_MODIFIER = 'modifier_doom_bringer_doom';
const DOOM_STATES_MODIFIER = 'modifier_doom_bringer_doom_awakened_states';
const CARRIER_MODIFIER = 'modifier_doom_bringer_doom_awakened_carrier';
const DEVOUR_MODIFIER = 'modifier_doom_bringer_doom_awakened_devour';
const DOOM_MUTE_TALENT = 'special_bonus_unique_doom_10';
const DOOM_AURA_PARTICLE = 'particles/units/heroes/hero_doom_bringer/doom_bringer_doom_aura.vpcf';
const AURA_INTERVAL = 0.2;
const AURA_LINGER = 0.5;
const DEVOUR_ABILITY = 'doom_bringer_devour';
const DEVOUR_LEVEL_INTERVAL = 0.1;

function isSameTeam(caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC): boolean {
  return caster.GetTeamNumber() === target.GetTeamNumber();
}

function getEnemyDoomDuration(target: CDOTA_BaseNPC, duration: number): number {
  return Math.max(0, duration * (1 - target.GetStatusResistance()));
}

function hasLearnedTalent(caster: CDOTA_BaseNPC | undefined, talentName: string): boolean {
  if (!caster || caster.IsNull()) return false;
  const talent = caster.FindAbilityByName(talentName);
  return !!talent && !talent.IsNull() && talent.GetLevel() > 0;
}

function applyOrRefreshModifier(
  caster: CDOTA_BaseNPC,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
  modifierName: string,
  duration: number,
): void {
  const existing = target.FindModifierByNameAndCaster(modifierName, caster);
  if (existing && !existing.IsNull()) {
    existing.SetDuration(duration, true);
    existing.ForceRefresh();
    return;
  }

  target.AddNewModifier(caster, ability, modifierName, { duration });
}

function applyOrRefreshDoom(
  caster: CDOTA_BaseNPC,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
  duration: number,
): void {
  applyOrRefreshModifier(caster, ability, target, DOOM_MODIFIER, duration);
  applyOrRefreshModifier(caster, ability, target, DOOM_STATES_MODIFIER, duration);
}

function getUnitAbilityEntries(unit: CDOTA_BaseNPC): DevourAbilityEntry[] {
  const abilities: DevourAbilityEntry[] = [];
  for (let index = 0; index < unit.GetAbilityCount(); index += 1) {
    const ability = unit.GetAbilityByIndex(index);
    if (!ability || ability.IsNull()) continue;

    const name = ability.GetAbilityName();
    if (!name) continue;
    abilities.push({ name, entityIndex: ability.GetEntityIndex() });
  }
  return abilities;
}

function getUnitAbilityNames(unit: CDOTA_BaseNPC): string[] {
  return getUniqueDevourAbilityNames(getUnitAbilityEntries(unit).map((ability) => ability.name));
}

@registerAbility('doom_bringer_doom_awakened')
export class DoomBringerDoomAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return DEVOUR_MODIFIER;
  }

  CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
    const caster = this.GetCaster();
    const sameTeam = isSameTeam(caster, target);

    if (
      isDoomAwakenedFriendlyTarget({
        hasScepter: caster.HasScepter(),
        sameTeam,
        isRealHero: target.IsRealHero(),
      })
    ) {
      return UnitFilterResult.SUCCESS;
    }

    if (sameTeam) return UnitFilterResult.FAIL_FRIENDLY;

    return UnitFilter(
      target,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      caster.GetTeamNumber(),
    );
  }

  GetAOERadius(): number {
    const caster = this.GetCaster();
    if (!caster.HasScepter()) return 0;

    return this.GetSpecialValueFor('scepter_aura_radius');
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const target = this.GetCursorTarget();
    if (!target || target.IsNull()) return;

    const targetIsFriendly = isSameTeam(caster, target);
    if (!targetIsFriendly && target.TriggerSpellAbsorb(this)) return;

    const baseDuration = this.GetSpecialValueFor('duration');
    const effectDuration = targetIsFriendly
      ? baseDuration
      : getEnemyDoomDuration(target, baseDuration);

    if (!targetIsFriendly) {
      applyOrRefreshDoom(caster, this, target, effectDuration);
    }

    if (!caster.HasScepter()) return;

    const radius = this.GetSpecialValueFor('scepter_aura_radius');
    target.AddNewModifier(caster, this, CARRIER_MODIFIER, {
      duration: effectDuration,
      radius,
    });
  }
}

@registerModifier('abilities/ts_abilities/doom_bringer_doom_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_doom_bringer_doom_awakened_states extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    const states = getDoomAwakenedStates({
      hasMuteTalent: hasLearnedTalent(caster, DOOM_MUTE_TALENT),
      doesBreak: !!ability && !ability.IsNull() && ability.GetSpecialValueFor('does_break') > 0,
    });

    return {
      [ModifierState.MUTED]: states.muted,
      [ModifierState.PASSIVES_DISABLED]: states.passivesDisabled,
    };
  }
}

interface DoomCarrierParams {
  radius?: number;
}

@registerModifier('abilities/ts_abilities/doom_bringer_doom_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_doom_bringer_doom_awakened_carrier extends BaseModifier {
  private radius = 0;
  private auraParticle?: ParticleID;

  IsHidden(): boolean {
    const caster = this.GetCaster();
    return !caster || caster.IsNull() || !isSameTeam(caster, this.GetParent());
  }

  IsPurgable(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'doom_bringer_doom';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    return this.radius;
  }

  OnCreated(params: DoomCarrierParams): void {
    this.refreshRadius(params);
    if (!IsServer()) return;

    this.refreshAuraParticle();
    this.applyAuraDoom();
    this.StartIntervalThink(AURA_INTERVAL);
  }

  OnRefresh(params: DoomCarrierParams): void {
    this.refreshRadius(params);
    if (!IsServer()) return;

    this.refreshAuraParticle();
    this.applyAuraDoom();
    this.StartIntervalThink(AURA_INTERVAL);
  }

  OnIntervalThink(): void {
    this.applyAuraDoom();
  }

  private refreshRadius(params: DoomCarrierParams): void {
    this.radius = Math.max(0, params.radius ?? 0);
  }

  private refreshAuraParticle(): void {
    const parent = this.GetParent();
    if (parent.IsNull() || this.radius <= 0) return;

    if (this.auraParticle === undefined) {
      this.auraParticle = ParticleManager.CreateParticle(
        DOOM_AURA_PARTICLE,
        ParticleAttachment.ABSORIGIN_FOLLOW,
        parent,
      );
      this.AddParticle(this.auraParticle, false, false, -1, false, false);
    }

    ParticleManager.SetParticleControl(
      this.auraParticle,
      1,
      Vector(this.radius, this.radius, this.radius),
    );
  }

  private applyAuraDoom(): void {
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    const parent = this.GetParent();
    if (
      !caster ||
      caster.IsNull() ||
      !ability ||
      ability.IsNull() ||
      parent.IsNull() ||
      this.radius <= 0
    ) {
      return;
    }

    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      this.radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    for (const enemy of enemies) {
      applyOrRefreshDoom(caster, ability, enemy, AURA_LINGER);
    }
  }
}

interface PendingDevour {
  ability: CDOTABaseAbility;
  targetAbilityNames: string[];
}

@registerModifier('abilities/ts_abilities/doom_bringer_doom_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_doom_bringer_doom_awakened_devour extends BaseModifier {
  private pendingDevour?: PendingDevour;
  private trackedAbilityNames: string[] = [];

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_START, ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(DEVOUR_LEVEL_INTERVAL);
  }

  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const ability = event.ability;
    if (ability.GetAbilityName() !== DEVOUR_ABILITY) return;

    const target = ability.GetCursorTarget();
    if (!target || target.IsNull()) {
      this.pendingDevour = undefined;
      return;
    }

    this.pendingDevour = {
      ability,
      targetAbilityNames: getUnitAbilityNames(target),
    };
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;

    const pending = this.pendingDevour;
    if (!pending || event.ability !== pending.ability) return;
    this.pendingDevour = undefined;
    this.trackedAbilityNames = pending.targetAbilityNames;
    this.maximizeTrackedAbilities();
  }

  OnIntervalThink(): void {
    this.maximizeTrackedAbilities();
  }

  private maximizeTrackedAbilities(): void {
    if (!IsServer() || this.trackedAbilityNames.length === 0) return;

    const parent = this.GetParent();
    if (parent.IsNull()) return;

    const selectedIndexes = selectTrackedDevourAbilityEntityIndexes(
      this.trackedAbilityNames,
      getUnitAbilityEntries(parent),
    );

    for (let index = 0; index < parent.GetAbilityCount(); index += 1) {
      const grantedAbility = parent.GetAbilityByIndex(index);
      if (!grantedAbility || grantedAbility.IsNull()) continue;
      if (!selectedIndexes.includes(grantedAbility.GetEntityIndex())) continue;

      // Some neutral passives expose a one-level shell while AbilityValues still declares four tiers.
      const maxLevel = Math.max(
        grantedAbility.GetMaxLevel(),
        getDevourAbilityHighestDeclaredLevel(
          GetAbilityKeyValuesByName(grantedAbility.GetAbilityName()),
        ),
      );
      if (grantedAbility.GetLevel() !== maxLevel) {
        grantedAbility.SetLevel(maxLevel);
      }
    }
  }
}
