import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const BASE_GUARDIAN_ANGEL = 'omniknight_guardian_angel';
const AWAKENED_GUARDIAN_ANGEL = 'omniknight_guardian_angel_awakened';
const GUARDIAN_ANGEL_PARTICLE =
  'particles/units/heroes/hero_omniknight/omniknight_guardian_angel_ally.vpcf';
const GUARDIAN_ANGEL_STATUS_EFFECT = 'particles/status_fx/status_effect_guardian_angel.vpcf';

abstract class OmniknightGuardianAngelBase extends BaseAbility {
  protected abstract GetAppliedModifierName(): string;

  OnUpgrade(): void {
    if (!IsServer()) return;

    const linkedAbilityName =
      this.GetAbilityName() === BASE_GUARDIAN_ANGEL ? AWAKENED_GUARDIAN_ANGEL : BASE_GUARDIAN_ANGEL;
    const linkedAbility = this.GetCaster().FindAbilityByName(linkedAbilityName);
    if (linkedAbility && linkedAbility.GetLevel() !== this.GetLevel()) {
      linkedAbility.SetLevel(Math.min(this.GetLevel(), linkedAbility.GetMaxLevel()));
    }
  }

  OnSpellStart(): void {
    const caster = this.GetCaster();
    const isGlobal = this.GetSpecialValueFor('is_global') > 0;
    const affectsBuildings = this.GetSpecialValueFor('affects_buildings') > 0;
    const targets = FindUnitsInRadius(
      caster.GetTeamNumber(),
      caster.GetAbsOrigin(),
      undefined,
      isGlobal ? FIND_UNITS_EVERYWHERE : this.GetSpecialValueFor('radius'),
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO + UnitTargetType.BASIC + (affectsBuildings ? UnitTargetType.BUILDING : 0),
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    const duration = this.GetSpecialValueFor('duration');

    caster.EmitSound('Hero_Omniknight.GuardianAngel.Cast');
    for (const target of targets) {
      target.AddNewModifier(caster, this, this.GetAppliedModifierName(), { duration });
    }
  }
}

@registerAbility(BASE_GUARDIAN_ANGEL)
export class OmniknightGuardianAngel extends OmniknightGuardianAngelBase {
  protected GetAppliedModifierName(): string {
    return modifier_omniknight_guardian_angel_custom.name;
  }
}

@registerAbility(AWAKENED_GUARDIAN_ANGEL)
export class OmniknightGuardianAngelAwakened extends OmniknightGuardianAngelBase {
  protected GetAppliedModifierName(): string {
    return modifier_omniknight_guardian_angel_awakened.name;
  }
}

abstract class ModifierOmniknightGuardianAngelBase extends BaseModifier {
  protected healAndRegenAmp = 0;
  protected modelScale = 0;

  IsHidden(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  IsDebuff(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return BASE_GUARDIAN_ANGEL;
  }

  GetEffectName(): string {
    return GUARDIAN_ANGEL_PARTICLE;
  }

  GetEffectAttachType(): ParticleAttachment {
    return ParticleAttachment.ABSORIGIN_FOLLOW;
  }

  GetStatusEffectName(): string {
    return GUARDIAN_ANGEL_STATUS_EFFECT;
  }

  StatusEffectPriority(): modifierpriority {
    return ModifierPriority.HIGH;
  }

  OnCreated(): void {
    this.ReadValues();
  }

  OnRefresh(): void {
    this.ReadValues();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_TARGET,
      ModifierFunction.MODEL_SCALE,
    ];
  }

  GetAbsoluteNoDamagePhysical(): 0 | 1 {
    return 1;
  }

  GetModifierHPRegenAmplify_Percentage(): number {
    return this.healAndRegenAmp;
  }

  GetModifierHealAmplify_PercentageTarget(): number {
    return this.healAndRegenAmp;
  }

  GetModifierModelScale(): number {
    return this.modelScale;
  }

  protected ReadValues(): void {
    const ability = this.GetAbility();
    this.healAndRegenAmp = ability?.GetSpecialValueFor('heal_and_regen_amp') ?? 0;
    this.modelScale = ability?.GetSpecialValueFor('model_scale') ?? 0;
  }
}

@registerModifier('abilities/ts_abilities/omniknight_guardian_angel_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_omniknight_guardian_angel_custom extends ModifierOmniknightGuardianAngelBase {
  IsPurgable(): boolean {
    return true;
  }

  IsPurgeException(): boolean {
    return false;
  }
}

@registerModifier('abilities/ts_abilities/omniknight_guardian_angel_awakened')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_omniknight_guardian_angel_awakened extends ModifierOmniknightGuardianAngelBase {
  IsPurgable(): boolean {
    return false;
  }

  IsPurgeException(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_TARGET,
      ModifierFunction.MODEL_SCALE,
      ModifierFunction.MAGICAL_RESISTANCE_BONUS,
      ModifierFunction.STATUS_RESISTANCE_STACKING,
    ];
  }

  GetModifierMagicalResistanceBonus(): number {
    return this.GetAbility()?.GetSpecialValueFor('magic_resistance') ?? 0;
  }

  GetModifierStatusResistanceStacking(): number {
    return this.GetAbility()?.GetSpecialValueFor('status_resistance') ?? 0;
  }
}
