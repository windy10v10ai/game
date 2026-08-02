import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import { applyAwakenMagicImmunity } from './shared/awaken-magic-immunity';
import {
  ElderTitanAwakenFieldState,
  ElderTitanFieldCounts,
  FieldTouchTracker,
  calculateBonusArmorReductionDelta,
  calculateFieldBonuses,
  calculateMagicResistanceTarget,
  isEligibleFieldTarget,
  isEligibleRealHeroTarget,
  resolveAwakenCastMode,
  resolveAwakenFieldState,
  resolveFieldBuffSync,
  resolveFieldMode,
  resolveNaturalOrderOverlap,
  shouldOverrideNaturalOrderRadius,
  shouldRestoreAwakenWrapper,
  shouldTrackPendingSpiritReturn,
} from './elder-titan-awaken-math';

const SCRIPT_PATH = 'abilities/ts_abilities/elder_titan_ancestral_spirit_awaken';
const AWAKEN_ABILITY = 'elder_titan_ancestral_spirit_awaken';
const NATIVE_SPIRIT_ABILITY = 'elder_titan_ancestral_spirit';
const RETURN_SPIRIT_ABILITY = 'elder_titan_return_spirit';
const NATURAL_ORDER_ABILITY = 'elder_titan_natural_order';
const NATIVE_ORDER_ARMOR_DEBUFF = 'modifier_elder_titan_natural_order_armor';
const NATIVE_ORDER_MAGIC_DEBUFF = 'modifier_elder_titan_natural_order_magic_resistance';
const CONTROLLER_MODIFIER = 'modifier_elder_titan_ancestral_spirit_awaken_controller';
const FIELD_MODIFIER = 'modifier_elder_titan_ancestral_spirit_awaken_field';
const BUFF_MODIFIER = 'modifier_elder_titan_ancestral_spirit_awaken_buff';
const ORDER_DEBUFF_MODIFIER = 'modifier_elder_titan_ancestral_spirit_awaken_natural_order';
const NATURAL_ORDER_PHYSICAL_PARTICLE =
  'particles/units/heroes/hero_elder_titan/elder_titan_natural_order_physical.vpcf';
const NATURAL_ORDER_MAGICAL_PARTICLE =
  'particles/units/heroes/hero_elder_titan/elder_titan_natural_order_magical.vpcf';

@registerAbility(AWAKEN_ABILITY)
export class ElderTitanAncestralSpiritAwaken extends BaseAbility {
  private waitingForSpiritReturn = false;

  GetIntrinsicModifierName(): string {
    return CONTROLLER_MODIFIER;
  }

  GetBehavior(): AbilityBehavior {
    if (resolveAwakenCastMode(this.isFieldMode()) === 'no-target') {
      return AbilityBehavior.NO_TARGET + AbilityBehavior.AUTOCAST + AbilityBehavior.IMMEDIATE;
    }
    return AbilityBehavior.POINT + AbilityBehavior.AUTOCAST;
  }

  GetCastPoint(): number {
    if (this.isFieldMode()) return 0;
    return this.GetSpecialValueFor('spirit_cast_point');
  }

  GetCastRange(_location: Vector, _target?: CDOTA_BaseNPC): number {
    if (this.isFieldMode()) return 0;
    return this.GetSpecialValueFor('spirit_cast_range');
  }

  GetAOERadius(): number {
    if (this.isFieldMode()) return this.getFieldRadius();
    return this.GetSpecialValueFor('spirit_radius');
  }

  OnUpgrade(): void {
    if (!IsServer()) return;
    this.ensureNativeSpiritAbility();
  }

  OnOwnerSpawned(): void {
    if (!IsServer()) return;
    this.ensureNativeSpiritAbility();
  }

  OnToggleAutoCast(): void {
    if (!IsServer()) return;
    this.syncReplicatedFieldMode();

    if (!this.GetAutoCastState()) {
      this.GetCaster().RemoveModifierByName(FIELD_MODIFIER);
    }
  }

  OnSpellStart(): void {
    if (!IsServer()) return;

    if (this.GetAutoCastState()) {
      this.startField();
      return;
    }

    this.castNativeSpirit();
  }

  isFieldMode(): boolean {
    if (IsServer()) {
      return resolveFieldMode(true, this.GetAutoCastState(), 0);
    }

    const caster = this.GetCaster();
    return resolveFieldMode(
      false,
      undefined,
      caster.GetModifierStackCount(CONTROLLER_MODIFIER, caster),
    );
  }

  syncReplicatedFieldMode(): void {
    if (!IsServer()) return;
    const controller = this.GetCaster().FindModifierByName(CONTROLLER_MODIFIER);
    if (!controller) return;

    const nextStack = this.GetAutoCastState() ? 1 : 0;
    if (controller.GetStackCount() === nextStack) return;
    controller.SetStackCount(nextStack);
  }

  getFieldState(): ElderTitanAwakenFieldState {
    const caster = this.GetCaster();
    const naturalOrder = caster.FindAbilityByName(NATURAL_ORDER_ABILITY);
    if (!naturalOrder) return resolveAwakenFieldState(0, 0, 0);

    return resolveAwakenFieldState(
      this.GetSpecialValueFor('awaken_radius'),
      caster.GetCastRangeBonus(),
      naturalOrder.GetLevel(),
    );
  }

  getFieldRadius(): number {
    return this.getFieldState().radius;
  }

  isNaturalOrderEnabled(): boolean {
    return this.getFieldState().naturalOrderEnabled;
  }

  ensureNativeSpiritAbility(): CDOTABaseAbility | undefined {
    const caster = this.GetCaster();
    let nativeSpirit = caster.FindAbilityByName(NATIVE_SPIRIT_ABILITY);
    if (!nativeSpirit) {
      nativeSpirit = caster.AddAbility(NATIVE_SPIRIT_ABILITY);
      if (nativeSpirit !== undefined) nativeSpirit.SetHidden(true);
    }
    if (!nativeSpirit) return undefined;

    if (nativeSpirit.GetLevel() !== this.GetLevel()) {
      nativeSpirit.SetLevel(this.GetLevel());
    }
    return nativeSpirit;
  }

  trackPendingSpiritReturn(): void {
    if (this.waitingForSpiritReturn) return;

    const returnSpirit = this.GetCaster().FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!returnSpirit) return;

    this.waitingForSpiritReturn = shouldTrackPendingSpiritReturn(returnSpirit.IsHidden());
  }

  restoreWrapperAfterReturn(): void {
    if (!this.waitingForSpiritReturn) return;

    const caster = this.GetCaster();
    const nativeSpirit = caster.FindAbilityByName(NATIVE_SPIRIT_ABILITY);
    const returnSpirit = caster.FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!nativeSpirit || !returnSpirit) return;

    if (
      !shouldRestoreAwakenWrapper({
        waitingForReturn: this.waitingForSpiritReturn,
        returnHidden: returnSpirit.IsHidden(),
      })
    ) {
      return;
    }

    this.waitingForSpiritReturn = false;
    caster.SwapAbilities(NATIVE_SPIRIT_ABILITY, AWAKEN_ABILITY, false, true);
    nativeSpirit.SetHidden(true);
  }

  private castNativeSpirit(): void {
    const caster = this.GetCaster();
    const nativeSpirit = this.ensureNativeSpiritAbility();
    if (!nativeSpirit) return;

    nativeSpirit.SetActivated(true);
    caster.SetCursorPosition(this.GetCursorPosition());
    nativeSpirit.OnSpellStart();

    const returnSpirit = caster.FindAbilityByName(RETURN_SPIRIT_ABILITY);
    if (!returnSpirit) return;

    returnSpirit.SetLevel(Math.max(1, this.GetLevel()));
    this.waitingForSpiritReturn = true;
    caster.SwapAbilities(AWAKEN_ABILITY, RETURN_SPIRIT_ABILITY, false, true);
  }

  private startField(): void {
    const caster = this.GetCaster();
    caster.RemoveModifierByName(FIELD_MODIFIER);
    caster.AddNewModifier(caster, this, FIELD_MODIFIER, {
      duration: this.GetSpecialValueFor('field_duration'),
    });
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_elder_titan_ancestral_spirit_awaken_controller extends BaseModifier {
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
    const ability = this.GetAbility() as ElderTitanAncestralSpiritAwaken;
    ability.ensureNativeSpiritAbility();
    ability.syncReplicatedFieldMode();
    ability.trackPendingSpiritReturn();
    this.StartIntervalThink(0.1);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const ability = this.GetAbility() as ElderTitanAncestralSpiritAwaken;
    const parent = this.GetParent();
    ability.syncReplicatedFieldMode();
    ability.ensureNativeSpiritAbility();
    ability.trackPendingSpiritReturn();

    if (!ability.GetAutoCastState()) {
      parent.RemoveModifierByName(FIELD_MODIFIER);
    }
    ability.restoreWrapperAfterReturn();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    return this.shouldOverrideNaturalOrderRadius(event) ? 1 : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    const eventAbility = event.ability;
    if (!eventAbility || eventAbility.IsNull()) return 0;

    if (!this.shouldOverrideNaturalOrderRadius(event)) {
      return eventAbility.GetLevelSpecialValueNoOverride(
        event.ability_special_value,
        event.ability_special_level,
      );
    }

    const ability = this.GetAbility();
    return ability ? ability.GetSpecialValueFor('awaken_radius') : 0;
  }

  IsAura(): boolean {
    const ability = this.GetAbility();
    return ability !== undefined && (ability as ElderTitanAncestralSpiritAwaken).isFieldMode();
  }

  GetModifierAura(): string {
    return ORDER_DEBUFF_MODIFIER;
  }

  GetAuraRadius(): number {
    return (this.GetAbility() as ElderTitanAncestralSpiritAwaken).getFieldRadius();
  }

  GetAuraSearchTeam(): UnitTargetTeam {
    return UnitTargetTeam.BOTH;
  }

  GetAuraSearchType(): UnitTargetType {
    return UnitTargetType.ALL;
  }

  GetAuraSearchFlags(): UnitTargetFlags {
    return UnitTargetFlags.MAGIC_IMMUNE_ENEMIES;
  }

  GetAuraDuration(): number {
    return 0.2;
  }

  GetAuraEntityReject(target: CDOTA_BaseNPC): boolean {
    const ability = this.GetAbility();
    if (!ability || target.IsNull()) return true;
    const awakenAbility = ability as ElderTitanAncestralSpiritAwaken;
    const caster = awakenAbility.GetCaster();
    return (
      !awakenAbility.isFieldMode() ||
      !awakenAbility.isNaturalOrderEnabled() ||
      !isEligibleFieldTarget({
        isAlive: target.IsAlive(),
        isOpposingTeam: target.IsOpposingTeam(caster.GetTeamNumber()),
        isNeutralUnit: target.IsNeutralUnitType(),
        isBuilding: target.IsBuilding(),
        isWard: target.IsWard(),
        isCourier: target.IsCourier(),
      })
    );
  }

  private shouldOverrideNaturalOrderRadius(event: ModifierOverrideAbilitySpecialEvent): boolean {
    const ability = this.GetAbility();
    const eventAbility = event.ability;
    return (
      ability !== undefined &&
      eventAbility !== undefined &&
      !eventAbility.IsNull() &&
      shouldOverrideNaturalOrderRadius(
        (ability as ElderTitanAncestralSpiritAwaken).isFieldMode(),
        eventAbility.GetAbilityName(),
        event.ability_special_value,
      )
    );
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_elder_titan_ancestral_spirit_awaken_field extends BaseModifier {
  private readonly touched = new FieldTouchTracker();
  private initialBuffSyncPending = true;
  private counts: ElderTitanFieldCounts = { creeps: 0, heroLike: 0, realHeroes: 0 };
  private statBuff?: modifier_elder_titan_ancestral_spirit_awaken_buff;
  private immunity?: CDOTA_Buff;
  private particle?: ParticleID;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'elder_titan_ancestral_spirit';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) {
      this.Destroy();
      return;
    }

    this.statBuff = parent.AddNewModifier(parent, ability, BUFF_MODIFIER, {
      duration: this.GetDuration(),
    }) as modifier_elder_titan_ancestral_spirit_awaken_buff;

    this.particle = ParticleManager.CreateParticle(
      'particles/units/heroes/hero_elder_titan/elder_titan_ancestral_spirit_buff.vpcf',
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    this.AddParticle(this.particle, false, false, -1, false, false);

    this.scanEnemies();
    this.StartIntervalThink(0.1);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    const touchedNewTarget = this.scanEnemies();
    const syncDecision = resolveFieldBuffSync(this.initialBuffSyncPending, touchedNewTarget);
    if (syncDecision.shouldSync) {
      this.statBuff?.setCounts(this.counts);
    }
    this.initialBuffSyncPending = syncDecision.initialSyncPending;
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    if (this.statBuff && !this.statBuff.IsNull()) this.statBuff.Destroy();
    if (this.immunity && !this.immunity.IsNull()) this.immunity.Destroy();
    this.touched.reset();
  }

  private scanEnemies(): boolean {
    const parent = this.GetParent();
    const ability = this.GetAbility() as ElderTitanAncestralSpiritAwaken | undefined;
    if (!ability) return false;

    const enemies = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      ability.getFieldRadius(),
      UnitTargetTeam.BOTH,
      UnitTargetType.ALL,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    let touchedNewTarget = false;
    for (const enemy of enemies) {
      if (
        enemy.IsNull() ||
        !isEligibleFieldTarget({
          isAlive: enemy.IsAlive(),
          isOpposingTeam: enemy.IsOpposingTeam(parent.GetTeamNumber()),
          isNeutralUnit: enemy.IsNeutralUnitType(),
          isBuilding: enemy.IsBuilding(),
          isWard: enemy.IsWard(),
          isCourier: enemy.IsCourier(),
        }) ||
        !this.touched.touch(enemy.entindex())
      ) {
        continue;
      }
      touchedNewTarget = true;
      this.onFirstTouch(enemy, ability);
    }
    return touchedNewTarget;
  }

  private onFirstTouch(enemy: CDOTA_BaseNPC, ability: ElderTitanAncestralSpiritAwaken): void {
    if (enemy.IsHero()) {
      this.counts.heroLike += 1;
    } else {
      this.counts.creeps += 1;
    }

    if (this.isEligibleRealHero(enemy)) {
      this.counts.realHeroes += 1;
      if (this.GetParent().HasScepter()) {
        this.extendScepterImmunity(ability.GetSpecialValueFor('scepter_magic_immune_per_hero'));
      }
    }
  }

  private isEligibleRealHero(unit: CDOTA_BaseNPC): boolean {
    return isEligibleRealHeroTarget({
      isRealHero: unit.IsRealHero() as boolean,
      isIllusion: unit.IsIllusion() as boolean,
      isClone: unit.IsClone() as boolean,
      isTempestDouble: unit.IsTempestDouble() as boolean,
      isCreepHero: unit.IsCreepHero() as boolean,
    });
  }

  private extendScepterImmunity(secondsPerHero: number): void {
    if (secondsPerHero <= 0) return;
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    let duration = secondsPerHero;
    if (this.immunity && !this.immunity.IsNull()) {
      duration += Math.max(0, this.immunity.GetRemainingTime());
      this.immunity.Destroy();
      this.immunity = undefined;
    }

    this.immunity = applyAwakenMagicImmunity(parent, ability, duration);
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_elder_titan_ancestral_spirit_awaken_buff extends BaseModifier {
  private counts: ElderTitanFieldCounts = { creeps: 0, heroLike: 0, realHeroes: 0 };

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'elder_titan_ancestral_spirit';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.SetHasCustomTransmitterData(true);
  }

  AddCustomTransmitterData(): ElderTitanFieldCounts {
    return { ...this.counts };
  }

  HandleCustomTransmitterData(data: ElderTitanFieldCounts): void {
    this.counts = { ...data };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.PREATTACK_BONUS_DAMAGE,
      ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
    ];
  }

  setCounts(counts: ElderTitanFieldCounts): void {
    this.counts = { ...counts };
    this.SendBuffRefreshToClients();
    this.ForceRefresh();
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.getBonuses().attackDamage;
  }

  GetModifierMoveSpeedBonus_Percentage(): number {
    return this.getBonuses().moveSpeedPct;
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return this.getBonuses().attackSpeed;
  }

  private getBonuses() {
    const ability = this.GetAbility();
    if (!ability) return { attackDamage: 0, moveSpeedPct: 0, attackSpeed: 0 };

    return calculateFieldBonuses(this.counts, {
      damagePerCreep: ability.GetSpecialValueFor('damage_creeps'),
      damagePerHero: ability.GetSpecialValueFor('damage_heroes'),
      movePctPerCreep: ability.GetSpecialValueFor('move_pct_creeps'),
      movePctPerHero: ability.GetSpecialValueFor('move_pct_heroes'),
      movePctCap: ability.GetSpecialValueFor('move_pct_cap'),
      attackSpeedPerRealHero: ability.GetSpecialValueFor('attack_speed_per_real_hero'),
      attackSpeedCap: ability.GetSpecialValueFor('attack_speed_cap'),
    });
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_elder_titan_ancestral_spirit_awaken_natural_order extends BaseModifier {
  private refreshingDefense = false;
  private baseArmorReductionPct = 0;
  private bonusArmorReduction = 0;
  private magicResistanceReduction = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'elder_titan_natural_order';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.SetHasCustomTransmitterData(true);

    const parent = this.GetParent();
    const physicalParticle = ParticleManager.CreateParticle(
      NATURAL_ORDER_PHYSICAL_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    this.AddParticle(physicalParticle, false, false, -1, false, false);
    const magicalParticle = ParticleManager.CreateParticle(
      NATURAL_ORDER_MAGICAL_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    this.AddParticle(magicalParticle, false, false, -1, false, false);

    this.refreshDefenseReductions();
    this.StartIntervalThink(0.1);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    this.refreshDefenseReductions();
  }

  AddCustomTransmitterData(): {
    baseArmorReductionPct: number;
    bonusArmorReduction: number;
    magicResistanceReduction: number;
  } {
    return {
      baseArmorReductionPct: this.baseArmorReductionPct,
      bonusArmorReduction: this.bonusArmorReduction,
      magicResistanceReduction: this.magicResistanceReduction,
    };
  }

  HandleCustomTransmitterData(data: {
    baseArmorReductionPct: number;
    bonusArmorReduction: number;
    magicResistanceReduction: number;
  }): void {
    this.baseArmorReductionPct = data.baseArmorReductionPct;
    this.bonusArmorReduction = data.bonusArmorReduction;
    this.magicResistanceReduction = data.magicResistanceReduction;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.PHYSICAL_ARMOR_BASE_PERCENTAGE,
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.MAGICAL_RESISTANCE_DIRECT_MODIFICATION,
    ];
  }

  GetModifierPhysicalArmorBase_Percentage(): number {
    return this.refreshingDefense ? 0 : this.baseArmorReductionPct;
  }

  GetModifierPhysicalArmorBonus(): number {
    return this.refreshingDefense ? 0 : this.bonusArmorReduction;
  }

  GetModifierMagicalResistanceDirectModification(): number {
    return this.refreshingDefense ? 0 : this.magicResistanceReduction;
  }

  private getNativeNaturalOrderOverlap() {
    const parent = this.GetParent();
    return resolveNaturalOrderOverlap(
      parent.HasModifier(NATIVE_ORDER_ARMOR_DEBUFF),
      parent.HasModifier(NATIVE_ORDER_MAGIC_DEBUFF),
    );
  }

  private refreshDefenseReductions(): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability) return;

    this.refreshingDefense = true;
    const baseArmor = parent.GetPhysicalArmorBaseValue();
    const totalArmor = parent.GetPhysicalArmorValue(false);
    const totalResistance = parent.Script_GetMagicalArmorValue(ability) * 100;
    this.refreshingDefense = false;

    const overlap = this.getNativeNaturalOrderOverlap();
    const activeField = this.isActiveField();
    const armorReductionPct = this.getNaturalOrderReduction('armor_reduction_pct');
    const magicResistancePct = this.getNaturalOrderReduction('magic_resistance_pct');
    const nextBaseArmorReductionPct =
      overlap.applyBaseArmorReduction && baseArmor > 0 ? -armorReductionPct : 0;
    const nextBonusArmorReduction = calculateBonusArmorReductionDelta(
      baseArmor,
      totalArmor,
      armorReductionPct,
      activeField,
      !overlap.applyBaseArmorReduction,
    );
    const targetResistance = calculateMagicResistanceTarget(
      totalResistance,
      parent.GetBaseMagicalResistanceValue(),
      magicResistancePct,
      activeField,
      !overlap.applyBaseMagicResistanceReduction,
    );
    const nextMagicResistanceReduction = targetResistance - totalResistance;

    const changed =
      Math.abs(this.baseArmorReductionPct - nextBaseArmorReductionPct) > 0.001 ||
      Math.abs(this.bonusArmorReduction - nextBonusArmorReduction) > 0.001 ||
      Math.abs(this.magicResistanceReduction - nextMagicResistanceReduction) > 0.001;
    this.baseArmorReductionPct = nextBaseArmorReductionPct;
    this.bonusArmorReduction = nextBonusArmorReduction;
    this.magicResistanceReduction = nextMagicResistanceReduction;
    if (changed) this.SendBuffRefreshToClients();
  }

  private getNaturalOrderReduction(specialName: string): number {
    const caster = this.GetCaster();
    if (!caster) return 0;
    const naturalOrder = caster.FindAbilityByName(NATURAL_ORDER_ABILITY);
    if (!naturalOrder || naturalOrder.GetLevel() <= 0) return 0;
    return naturalOrder.GetSpecialValueFor(specialName);
  }

  private isActiveField(): boolean {
    const caster = this.GetCaster();
    return caster ? caster.HasModifier(FIELD_MODIFIER) : false;
  }
}
