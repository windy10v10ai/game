import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  beginCentaurDamageCycle,
  calculateCentaurDoubleEdgeNormalDamage,
  calculateCentaurShieldAmount,
  calculateCentaurStoredDamage,
  canCentaurAccumulateDamage,
  filterRecentCentaurDamage,
  mergeCentaurShieldAmount,
  restoreCancelledCentaurDamageCycle,
  shouldFinishCentaurDamageCycle,
  sumCentaurDamage,
} from './centaur-awaken-math';
import type { CentaurDamageSample } from './centaur-awaken-math';

const DOUBLE_EDGE_ABILITY = 'centaur_double_edge_awakened';
const STORAGE_REFRESH_INTERVAL = 0.1;

interface CentaurShieldParams {
  duration?: number;
  shield?: number;
}

@registerAbility('special_bonus_unique_centaur_upgrade')
export class SpecialBonusUniqueCentaurUpgrade extends BaseAbility {
  OnUpgrade(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    const doubleEdge = caster.FindAbilityByName(DOUBLE_EDGE_ABILITY);
    if (!doubleEdge || doubleEdge.IsNull()) return;

    const existing = caster.FindModifierByName(modifier_special_bonus_unique_centaur_upgrade.name);
    if (existing && !existing.IsNull()) {
      existing.Destroy();
    }

    caster.AddNewModifier(
      caster,
      doubleEdge,
      modifier_special_bonus_unique_centaur_upgrade.name,
      {},
    );
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_centaur_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_centaur_upgrade extends BaseModifier {
  private damageSamples: CentaurDamageSample[] = [];
  private pendingCastSamples: CentaurDamageSample[] = [];
  private castTokenSequence = 0;
  private activeCastToken = 0;
  private activeCastCompleted = false;
  private activeBonusDamage = 0;
  private consumedStoredDamage = 0;
  private hitTargets: Partial<Record<EntityIndex, true>> = {};
  private applyingBonusDamage = false;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetAttributes(): ModifierAttribute {
    return ModifierAttribute.PERMANENT;
  }

  GetTexture(): string {
    return 'centaur_double_edge';
  }

  OnCreated(): void {
    if (!IsServer()) return;
    this.StartIntervalThink(STORAGE_REFRESH_INTERVAL);
    this.updateStoredDamageDisplay();
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;
    this.updateStoredDamageDisplay();
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_ABILITY_START,
      ModifierFunction.ON_ABILITY_FULLY_CAST,
      ModifierFunction.ON_DEATH,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  OnTooltip2(): number {
    return Math.ceil(this.getStoredDamageCap());
  }

  OnAbilityStart(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent || event.ability.GetAbilityName() !== DOUBLE_EDGE_ABILITY) return;

    this.settleActiveCastBeforeNewCast();

    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || !this.hasLearnedDoubleEdge()) return;

    this.pruneDamageSamples();
    const cycle = beginCentaurDamageCycle(
      this.damageSamples,
      GameRules.GetGameTime(),
      ability.GetSpecialValueFor('damage_window'),
    );
    this.pendingCastSamples = cycle.pendingSamples;
    this.damageSamples = cycle.currentSamples;

    this.castTokenSequence += 1;
    const castToken = this.castTokenSequence;
    this.activeCastToken = castToken;
    this.activeCastCompleted = false;
    this.activeBonusDamage = this.getStoredDamageFromSamples(this.pendingCastSamples);
    this.consumedStoredDamage = 0;
    this.hitTargets = {};
    this.updateStoredDamageDisplay();

    const staleContextDelay = Math.max(event.ability.GetCastPoint(), 0) + 1;
    Timers.CreateTimer(staleContextDelay, () => {
      if (this.IsNull() || this.activeCastToken !== castToken) return;

      if (shouldFinishCentaurDamageCycle(this.activeCastCompleted, this.consumedStoredDamage)) {
        this.finishDoubleEdgeCast(castToken);
      } else {
        this.cancelDoubleEdgeCast(castToken);
      }
    });
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent || event.ability.GetAbilityName() !== DOUBLE_EDGE_ABILITY) return;

    const castToken = this.activeCastToken;
    if (castToken <= 0) return;

    this.activeCastCompleted = true;
    Timers.CreateTimer(0, () => {
      if (!this.IsNull() && this.activeCastToken === castToken) {
        this.finishDoubleEdgeCast(castToken);
      }
    });
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    this.recordIncomingDamage(event);
    this.applyStoredDamageToDoubleEdgeTarget(event);
  }

  OnDeath(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;

    this.clearStoredDamage();
  }

  private recordIncomingDamage(event: ModifierInstanceEvent): void {
    const parent = this.GetParent();
    const attacker = event.attacker;
    const doubleEdge = this.getDoubleEdgeAbility();
    if (
      event.unit !== parent ||
      !parent.IsRealHero() ||
      !canCentaurAccumulateDamage(doubleEdge?.GetLevel() ?? 0, parent.PassivesDisabled()) ||
      event.damage <= 0 ||
      !attacker ||
      attacker.IsNull() ||
      attacker.GetTeamNumber() === parent.GetTeamNumber() ||
      (event.damage_flags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS ||
      (event.damage_flags & DamageFlag.REFLECTION) === DamageFlag.REFLECTION
    ) {
      return;
    }

    this.pruneDamageSamples();
    this.damageSamples.push({ time: GameRules.GetGameTime(), damage: event.damage });
    this.updateStoredDamageDisplay();
  }

  private applyStoredDamageToDoubleEdgeTarget(event: ModifierInstanceEvent): void {
    const parent = this.GetParent();
    const inflictor = event.inflictor;
    if (
      this.applyingBonusDamage ||
      this.activeBonusDamage <= 0 ||
      event.damage <= 0 ||
      event.attacker !== parent ||
      event.unit === parent ||
      event.unit.GetTeamNumber() === parent.GetTeamNumber() ||
      !inflictor ||
      inflictor.IsNull() ||
      inflictor.GetAbilityName() !== DOUBLE_EDGE_ABILITY
    ) {
      return;
    }

    const targetIndex = event.unit.GetEntityIndex();
    if (this.hitTargets[targetIndex]) return;
    this.hitTargets[targetIndex] = true;

    if (this.consumedStoredDamage <= 0) {
      this.consumedStoredDamage = this.activeBonusDamage;
    }

    this.applyingBonusDamage = true;
    ApplyDamage({
      attacker: parent,
      victim: event.unit,
      ability: inflictor,
      damage: this.activeBonusDamage,
      damage_type: event.damage_type,
      damage_flags: DamageFlag.NONE,
    });
    this.applyingBonusDamage = false;
  }

  private finishDoubleEdgeCast(castToken: number): void {
    if (castToken !== this.activeCastToken) return;

    const consumedStoredDamage = this.consumedStoredDamage;
    this.pendingCastSamples = [];
    this.clearActiveCastContext();
    this.updateStoredDamageDisplay();

    if (consumedStoredDamage <= 0) return;

    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    const shield = calculateCentaurShieldAmount(
      consumedStoredDamage,
      ability.GetSpecialValueFor('shield_pct'),
    );
    if (shield <= 0) return;

    modifier_special_bonus_unique_centaur_upgrade_shield.apply(
      this.GetParent(),
      this.GetParent(),
      ability,
      {
        duration: ability.GetSpecialValueFor('shield_duration'),
        shield,
      },
    );
  }

  private cancelDoubleEdgeCast(castToken: number): void {
    if (castToken !== this.activeCastToken) return;

    const ability = this.GetAbility();
    if (ability && !ability.IsNull()) {
      this.damageSamples = restoreCancelledCentaurDamageCycle(
        this.pendingCastSamples,
        this.damageSamples,
        GameRules.GetGameTime(),
        ability.GetSpecialValueFor('damage_window'),
      );
    } else {
      this.damageSamples = [...this.pendingCastSamples, ...this.damageSamples];
    }

    this.pendingCastSamples = [];
    this.clearActiveCastContext();
    this.updateStoredDamageDisplay();
  }

  private settleActiveCastBeforeNewCast(): void {
    const castToken = this.activeCastToken;
    if (castToken <= 0) return;

    if (shouldFinishCentaurDamageCycle(this.activeCastCompleted, this.consumedStoredDamage)) {
      this.finishDoubleEdgeCast(castToken);
    } else {
      this.cancelDoubleEdgeCast(castToken);
    }
  }

  private clearActiveCastContext(): void {
    this.activeCastToken = 0;
    this.activeCastCompleted = false;
    this.activeBonusDamage = 0;
    this.consumedStoredDamage = 0;
    this.hitTargets = {};
  }

  private clearStoredDamage(): void {
    this.damageSamples = [];
    this.pendingCastSamples = [];
    this.clearActiveCastContext();
    this.SetStackCount(0);
  }

  private updateStoredDamageDisplay(): void {
    if (!this.hasLearnedDoubleEdge()) {
      this.clearStoredDamage();
      return;
    }

    this.pruneDamageSamples();
    this.SetStackCount(Math.ceil(this.getCurrentStoredDamage()));
  }

  private pruneDamageSamples(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) {
      this.damageSamples = [];
      return;
    }

    this.damageSamples = filterRecentCentaurDamage(
      this.damageSamples,
      GameRules.GetGameTime(),
      ability.GetSpecialValueFor('damage_window'),
    );
  }

  private getCurrentStoredDamage(): number {
    return this.getStoredDamageFromSamples(this.damageSamples);
  }

  private getStoredDamageFromSamples(samples: readonly CentaurDamageSample[]): number {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return 0;

    return calculateCentaurStoredDamage(
      sumCentaurDamage(samples),
      ability.GetSpecialValueFor('damage_conversion_pct'),
      this.getNormalDoubleEdgeDamage(),
      ability.GetSpecialValueFor('stored_damage_cap_pct'),
    );
  }

  private getStoredDamageCap(): number {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return 0;

    return (
      (this.getNormalDoubleEdgeDamage() * ability.GetSpecialValueFor('stored_damage_cap_pct')) / 100
    );
  }

  private getNormalDoubleEdgeDamage(): number {
    const parent = this.GetParent();
    const doubleEdge = this.getDoubleEdgeAbility();
    if (!doubleEdge || doubleEdge.IsNull() || doubleEdge.GetLevel() <= 0 || !parent.IsRealHero()) {
      return 0;
    }

    return calculateCentaurDoubleEdgeNormalDamage(
      doubleEdge.GetSpecialValueFor('edge_damage'),
      (parent as CDOTA_BaseNPC_Hero).GetStrength(),
      doubleEdge.GetSpecialValueFor('strength_damage'),
    );
  }

  private hasLearnedDoubleEdge(): boolean {
    const doubleEdge = this.getDoubleEdgeAbility();
    return !!doubleEdge && !doubleEdge.IsNull() && doubleEdge.GetLevel() > 0;
  }

  private getDoubleEdgeAbility() {
    return this.GetParent().FindAbilityByName(DOUBLE_EDGE_ABILITY);
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_centaur_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_centaur_upgrade_shield extends BaseModifier {
  private remainingShield = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetTexture(): string {
    return 'centaur_return';
  }

  OnCreated(params: CentaurShieldParams): void {
    this.refreshShield(params);
  }

  OnRefresh(params: CentaurShieldParams): void {
    this.refreshShield(params);
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.INCOMING_DAMAGE_CONSTANT, ModifierFunction.TOOLTIP];
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
    if (!IsServer()) return this.GetStackCount();
    if (event.damage <= 0 || (event.damage_flags & DamageFlag.HPLOSS) === DamageFlag.HPLOSS) {
      return 0;
    }

    const blockedDamage = Math.min(event.damage, this.remainingShield);
    this.remainingShield -= blockedDamage;
    this.SetStackCount(Math.ceil(this.remainingShield));

    if (this.remainingShield <= 0) {
      Timers.CreateTimer(0, () => {
        if (!this.IsNull()) this.Destroy();
      });
    }

    return -blockedDamage;
  }

  private refreshShield(params: CentaurShieldParams): void {
    const newShield = params.shield ?? 0;
    if (!IsServer()) return;

    this.remainingShield = mergeCentaurShieldAmount(this.remainingShield, newShield);
    this.SetStackCount(Math.ceil(this.remainingShield));
  }
}
