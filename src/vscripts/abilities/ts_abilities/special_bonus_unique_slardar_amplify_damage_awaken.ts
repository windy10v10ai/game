import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const CORROSIVE_HAZE_ABILITY = 'slardar_amplify_damage';
const CORROSIVE_HAZE_AWAKENED_ABILITY = 'slardar_amplify_damage_awakened';
const CORROSIVE_HAZE_MODIFIER = 'modifier_slardar_amplify_damage';
const SLARDAR_UNDISPELLABLE_HAZE_TALENT = 'special_bonus_unique_slardar_3';
const FIELD_PARTICLE = 'particles/units/heroes/hero_slardar/slardar_crush_puddle.vpcf';
const FIELD_INTERVAL = 0.2;

function hasLearnedTalent(caster: CDOTA_BaseNPC | undefined, talentName: string): boolean {
  if (!caster || caster.IsNull()) return false;
  const talent = caster.FindAbilityByName(talentName);
  return !!talent && !talent.IsNull() && talent.GetLevel() > 0;
}

@registerAbility('special_bonus_unique_slardar_amplify_damage_awaken')
export class SpecialBonusUniqueSlardarAmplifyDamageAwaken extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_slardar_amplify_damage_awaken.name;
  }
}

/** 斯拉达 侵蚀雾霭觉醒。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_slardar_amplify_damage_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_slardar_amplify_damage_awaken extends BaseModifier {
  private fieldParticle?: ParticleID;
  private bonusArmorReduction = 0;

  IsHidden(): boolean {
    return false;
  }

  IsBuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetTexture(): string {
    return CORROSIVE_HAZE_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_DEATH,
      ModifierFunction.ON_ABILITY_FULLY_CAST,
      ModifierFunction.ON_RESPAWN,
      ModifierFunction.TOOLTIP,
    ];
  }

  OnTooltip(): number {
    return this.bonusArmorReduction;
  }

  OnCreated(): void {
    if (!IsServer()) return;

    this.SetHasCustomTransmitterData(true);
    this.updateBonusArmorReduction();
    this.applyField();
    this.StartIntervalThink(FIELD_INTERVAL);
  }

  OnRefresh(): void {
    if (!IsServer()) return;

    this.updateBonusArmorReduction();
    this.applyField();
    this.StartIntervalThink(FIELD_INTERVAL);
  }

  OnIntervalThink(): void {
    this.updateBonusArmorReduction();
    this.applyField();
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;
    this.destroyFieldParticle();
  }

  OnRespawn(event: ModifierUnitEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;
    this.updateBonusArmorReduction();
    this.applyField();
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    const parent = this.GetParent();
    const target = event.target;
    if (!IsServer() || event.unit !== parent || !target || target.IsNull()) return;
    if (!this.isCorrosiveHaze(event.ability)) return;

    const nativeHaze = target.FindModifierByNameAndCaster(CORROSIVE_HAZE_MODIFIER, parent);
    if (!nativeHaze || nativeHaze.IsNull()) return;

    this.applyBonusArmorReduction(target, event.ability, nativeHaze.GetRemainingTime());
  }

  AddCustomTransmitterData(): { bonusArmorReduction: number } {
    return { bonusArmorReduction: this.bonusArmorReduction };
  }

  HandleCustomTransmitterData(data: { bonusArmorReduction: number }): void {
    this.bonusArmorReduction = data.bonusArmorReduction;
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.destroyFieldParticle();
  }

  private getCorrosiveHaze(): CDOTABaseAbility | undefined {
    const parent = this.GetParent();
    if (parent.IsNull()) return undefined;

    const ability =
      parent.FindAbilityByName(CORROSIVE_HAZE_AWAKENED_ABILITY) ??
      parent.FindAbilityByName(CORROSIVE_HAZE_ABILITY);
    if (!ability || ability.IsNull()) return undefined;
    return ability;
  }

  private isCorrosiveHaze(ability: CDOTABaseAbility): boolean {
    const abilityName = ability.GetAbilityName();
    return (
      abilityName === CORROSIVE_HAZE_AWAKENED_ABILITY || abilityName === CORROSIVE_HAZE_ABILITY
    );
  }

  private updateBonusArmorReduction(): void {
    const parent = this.GetParent();
    const corrosiveHaze = this.getCorrosiveHaze();
    const previousValue = this.bonusArmorReduction;
    if (parent.IsNull() || !corrosiveHaze || corrosiveHaze.IsNull()) {
      this.bonusArmorReduction = 0;
    } else {
      const reductionPct = corrosiveHaze.GetSpecialValueFor('caster_armor_reduction_pct');
      this.bonusArmorReduction = parent.PassivesDisabled()
        ? 0
        : Math.round(
            Math.max(0, parent.GetPhysicalArmorValue(false)) *
              Math.max(0, reductionPct / 100) *
              100,
          ) / 100;
    }

    if (this.bonusArmorReduction !== previousValue) {
      this.SendBuffRefreshToClients();
    }
  }

  private isFieldActive(): boolean {
    const parent = this.GetParent();
    if (parent.IsNull() || !parent.IsRealHero() || !parent.IsAlive()) return false;
    if (parent.PassivesDisabled()) return false;

    const corrosiveHaze = this.getCorrosiveHaze();
    return !!corrosiveHaze && corrosiveHaze.GetLevel() > 0;
  }

  private applyField(): void {
    if (!this.isFieldActive()) {
      this.destroyFieldParticle();
      return;
    }

    const parent = this.GetParent();
    const corrosiveHaze = this.getCorrosiveHaze();
    if (!corrosiveHaze) return;

    const radius = corrosiveHaze.GetSpecialValueFor('field_radius');
    if (radius <= 0) return;

    this.ensureFieldParticle(radius);

    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    const baseDuration = corrosiveHaze.GetSpecialValueFor('duration');
    for (const enemy of enemies) {
      const duration = Math.max(0.01, baseDuration * (1 - enemy.GetStatusResistance()));
      const existing = enemy.FindModifierByNameAndCaster(CORROSIVE_HAZE_MODIFIER, parent);
      if (existing && !existing.IsNull()) {
        existing.SetDuration(duration, true);
        existing.ForceRefresh();
      } else {
        enemy.AddNewModifier(parent, corrosiveHaze, CORROSIVE_HAZE_MODIFIER, { duration });
      }

      this.applyBonusArmorReduction(enemy, corrosiveHaze, duration);
    }
  }

  private applyBonusArmorReduction(
    enemy: CDOTA_BaseNPC,
    corrosiveHaze: CDOTABaseAbility,
    duration: number,
  ): void {
    const parent = this.GetParent();
    const modifierName = modifier_slardar_amplify_damage_awakened_bonus.name;
    const existing = enemy.FindModifierByNameAndCaster(modifierName, parent);
    if (existing && !existing.IsNull()) {
      existing.SetDuration(Math.max(0.01, duration), true);
      existing.ForceRefresh();
      return;
    }

    enemy.AddNewModifier(parent, corrosiveHaze, modifierName, {
      duration: Math.max(0.01, duration),
    });
  }

  private ensureFieldParticle(radius: number): void {
    const parent = this.GetParent();
    if (parent.IsNull()) return;

    if (this.fieldParticle === undefined) {
      this.fieldParticle = ParticleManager.CreateParticle(
        FIELD_PARTICLE,
        ParticleAttachment.ABSORIGIN_FOLLOW,
        parent,
      );
    }

    ParticleManager.SetParticleControl(this.fieldParticle, 1, Vector(radius, radius, radius));
  }

  private destroyFieldParticle(): void {
    if (this.fieldParticle === undefined) return;

    ParticleManager.DestroyParticle(this.fieldParticle, false);
    ParticleManager.ReleaseParticleIndex(this.fieldParticle);
    this.fieldParticle = undefined;
  }
}

/** 保持侵蚀雾霭的真实视域与水迹生命周期，仅承载觉醒护甲差值。 */
@registerModifier('abilities/ts_abilities/special_bonus_unique_slardar_amplify_damage_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_slardar_amplify_damage_awakened_bonus extends BaseModifier {
  private armorReduction = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return !hasLearnedTalent(this.GetCaster(), SLARDAR_UNDISPELLABLE_HAZE_TALENT);
  }

  GetTexture(): string {
    return CORROSIVE_HAZE_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  GetModifierPhysicalArmorBonus(): number {
    return -this.armorReduction;
  }

  OnTooltip(): number {
    const ability = this.GetAbility();
    const baseArmorReduction = ability
      ? Math.abs(ability.GetSpecialValueFor('armor_reduction'))
      : 0;
    return baseArmorReduction + this.armorReduction;
  }

  OnTooltip2(): number {
    return this.armorReduction;
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.SetHasCustomTransmitterData(true);
    this.refreshArmorReduction();
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.refreshArmorReduction();
  }

  AddCustomTransmitterData(): { armorReduction: number } {
    return { armorReduction: this.armorReduction };
  }

  HandleCustomTransmitterData(data: { armorReduction: number }): void {
    this.armorReduction = data.armorReduction;
  }

  private refreshArmorReduction(): void {
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    const previousValue = this.armorReduction;
    if (!caster || caster.IsNull() || !ability || ability.IsNull() || caster.PassivesDisabled()) {
      this.armorReduction = 0;
    } else {
      const reductionPct = Math.max(0, ability.GetSpecialValueFor('caster_armor_reduction_pct'));
      this.armorReduction =
        Math.round(Math.max(0, caster.GetPhysicalArmorValue(false)) * (reductionPct / 100) * 100) /
        100;
    }

    if (this.armorReduction !== previousValue) {
      this.SendBuffRefreshToClients();
    }
  }
}
