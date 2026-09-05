import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  canClaimWispTetherTargetBenefits,
  getWispTetherMoveSpeedFloor,
  getWispTetherMoveSpeedOverride,
  getWispTetherShareableAttribute,
  getWispTetherSharedAttribute,
  getWispTetherTransferredDamage,
} from './wisp-tether-awaken-logic';

const TETHER_ABILITY = 'wisp_tether';
const SYNC_INTERVAL = 0.25;
const FALLBACK_SEARCH_INTERVAL = 0.5;
const ATTRIBUTE_SYNC_INTERVAL = 0.5;

interface WispTetherAttributeTransmitterData {
  sharedStrength: number;
  sharedAgility: number;
  sharedIntellect: number;
}

/** Wisp Tether awakening: bypass the movement speed limit while native Tether is active. */
@registerAbility('special_bonus_unique_wisp_upgrade')
export class SpecialBonusUniqueWispUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_wisp_upgrade.name;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_wisp_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_wisp_upgrade extends BaseModifier {
  private target?: CDOTA_BaseNPC;
  private nextFallbackSearchTime = 0;
  private untetheredMoveSpeed = 0;

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
    return [
      ModifierFunction.ON_ABILITY_FULLY_CAST,
      ModifierFunction.ON_MODIFIER_ADDED,
      ModifierFunction.ON_MODIFIER_REMOVED,
    ];
  }

  OnCreated(): void {
    if (!IsServer()) return;

    this.rememberUntetheredMoveSpeed();
    this.StartIntervalThink(SYNC_INTERVAL);
    this.syncTether();
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    this.clearTarget();
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (event.unit !== parent) return;
    if (event.ability.GetAbilityName() !== TETHER_ABILITY) return;

    const target = event.target ?? event.ability.GetCursorTarget();
    if (!target || target.IsNull() || target === parent) return;

    this.setTarget(target);
    this.syncTether();
  }

  OnModifierAdded(event: ModifierAddedEvent): void {
    if (!IsServer()) return;
    if (!this.isTrackedUnit(event.unit)) return;

    this.syncTether();
  }

  OnModifierRemoved(event: ModifierAddedEvent): void {
    if (!IsServer()) return;
    if (!this.isTrackedUnit(event.unit)) return;

    this.syncTether();
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    this.syncTether();
  }

  private syncTether(): void {
    const target = this.target;
    if (this.isValidTetherTarget(target)) {
      const synchronizedSpeed = this.updateTetherMoveSpeedFloor(target);
      this.ensureSpeedLimitBypass(this.GetParent(), synchronizedSpeed);
      this.ensureTargetBenefits(target, synchronizedSpeed);
      return;
    }

    const fallbackTarget = this.findCurrentTetherTarget();
    if (fallbackTarget !== undefined) {
      this.setTarget(fallbackTarget);
      if (this.isValidTetherTarget(fallbackTarget)) {
        const synchronizedSpeed = this.updateTetherMoveSpeedFloor(fallbackTarget);
        this.ensureSpeedLimitBypass(this.GetParent(), synchronizedSpeed);
        this.ensureTargetBenefits(fallbackTarget, synchronizedSpeed);
        return;
      }
    }

    this.clearTarget();
    this.rememberUntetheredMoveSpeed();
  }

  private rememberUntetheredMoveSpeed(): void {
    this.untetheredMoveSpeed = this.GetParent().GetIdealSpeed();
  }

  private updateTetherMoveSpeedFloor(target: CDOTA_BaseNPC): number {
    const floor = getWispTetherMoveSpeedFloor(this.untetheredMoveSpeed, target.GetIdealSpeed());
    const synchronizedSpeed = Math.floor(floor);
    this.SetStackCount(synchronizedSpeed);
    return synchronizedSpeed;
  }

  private isValidTetherTarget(target: CDOTA_BaseNPC | undefined): target is CDOTA_BaseNPC {
    if (!target || target.IsNull() || !target.IsAlive()) return false;
    return this.findNativeTetherModifier(target) !== undefined;
  }

  private findNativeTetherModifier(unit: CDOTA_BaseNPC): CDOTA_Buff | undefined {
    const parent = this.GetParent();
    return unit.FindAllModifiers().find((modifier) => {
      if (modifier.IsNull() || modifier.GetCaster() !== parent) return false;

      const ability = modifier.GetAbility();
      return (
        ability !== undefined && !ability.IsNull() && ability.GetAbilityName() === TETHER_ABILITY
      );
    });
  }

  private findCurrentTetherTarget(): CDOTA_BaseNPC | undefined {
    const now = GameRules.GetGameTime();
    if (now < this.nextFallbackSearchTime) return undefined;
    this.nextFallbackSearchTime = now + FALLBACK_SEARCH_INTERVAL;

    const parent = this.GetParent();
    const tether = parent.FindAbilityByName(TETHER_ABILITY);
    if (!tether || tether.IsNull()) return undefined;

    const radius = tether.GetSpecialValueFor('radius');
    if (radius <= 0) return undefined;

    const units = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parent.GetAbsOrigin(),
      undefined,
      radius,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.NONE,
      FindOrder.CLOSEST,
      false,
    );

    for (const unit of units) {
      if (unit === parent || unit.IsNull() || !unit.IsAlive()) continue;
      if (this.findNativeTetherModifier(unit) !== undefined) return unit;
    }

    return undefined;
  }

  private isTrackedUnit(unit: CDOTA_BaseNPC): boolean {
    return unit === this.GetParent() || unit === this.target;
  }

  private setTarget(target: CDOTA_BaseNPC): void {
    if (this.target === target) return;

    const previousTarget = this.target;
    this.target = target;
    if (previousTarget && !previousTarget.IsNull()) {
      this.removeSpeedLimitBypass(previousTarget);
    }
  }

  private clearTarget(): void {
    const parent = this.GetParent();
    const target = this.target;
    this.target = undefined;
    this.SetStackCount(0);

    this.removeSpeedLimitBypass(parent);
    if (target && !target.IsNull()) {
      this.removeSpeedLimitBypass(target);
    }
  }

  private ensureTargetBenefits(target: CDOTA_BaseNPC, synchronizedSpeed: number): void {
    const parent = this.GetParent();
    const providerEntityIndices = target
      .FindAllModifiersByName(modifier_special_bonus_unique_wisp_upgrade_tether.name)
      .filter((modifier) => {
        if (modifier.IsNull()) return false;
        const caster = modifier.GetCaster();
        return caster !== undefined && !caster.IsNull() && caster !== target;
      })
      .map((modifier) => modifier.GetCaster()!.entindex());

    if (!canClaimWispTetherTargetBenefits(providerEntityIndices, parent.entindex())) {
      this.removeSpeedLimitBypass(target);
      return;
    }

    this.ensureSpeedLimitBypass(target, synchronizedSpeed);
  }

  private ensureSpeedLimitBypass(unit: CDOTA_BaseNPC, synchronizedSpeed: number): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    let modifier = unit.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_wisp_upgrade_tether.name,
      parent,
    );
    if (!modifier || modifier.IsNull()) {
      modifier = unit.AddNewModifier(
        parent,
        ability,
        modifier_special_bonus_unique_wisp_upgrade_tether.name,
        {},
      );
    }
    if (modifier && !modifier.IsNull()) modifier.SetStackCount(synchronizedSpeed);
  }

  private removeSpeedLimitBypass(unit: CDOTA_BaseNPC): void {
    const modifier = unit.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_wisp_upgrade_tether.name,
      this.GetParent(),
    );
    if (modifier && !modifier.IsNull()) modifier.Destroy();
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_wisp_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_wisp_upgrade_tether extends BaseModifier {
  private damageSharePct = 0;
  private attributeSharePct = 0;
  private sharedStrength = 0;
  private sharedAgility = 0;
  private sharedIntellect = 0;

  OnCreated(): void {
    this.updateSpecialValues();
    if (!IsServer()) return;

    this.SetHasCustomTransmitterData(true);
    if (this.GetParent() === this.GetCaster()) return;

    this.rememberSharedAttributes();
    this.SendBuffRefreshToClients();
    this.StartIntervalThink(ATTRIBUTE_SYNC_INTERVAL);
  }

  OnRefresh(): void {
    this.updateSpecialValues();
    if (!IsServer() || this.GetParent() === this.GetCaster()) return;

    if (this.rememberSharedAttributes()) {
      this.SendBuffRefreshToClients();
      const parent = this.GetParent();
      if (parent.IsHero()) (parent as CDOTA_BaseNPC_Hero).CalculateStatBonus(true);
    }
  }

  OnIntervalThink(): void {
    const parent = this.GetParent();
    if (!IsServer() || parent === this.GetCaster() || !parent.IsHero()) return;
    if (this.rememberSharedAttributes()) {
      this.SendBuffRefreshToClients();
      (parent as CDOTA_BaseNPC_Hero).CalculateStatBonus(true);
    }
  }

  AddCustomTransmitterData(): WispTetherAttributeTransmitterData {
    return {
      sharedStrength: this.sharedStrength,
      sharedAgility: this.sharedAgility,
      sharedIntellect: this.sharedIntellect,
    };
  }

  HandleCustomTransmitterData(data: WispTetherAttributeTransmitterData): void {
    this.sharedStrength = data.sharedStrength;
    this.sharedAgility = data.sharedAgility;
    this.sharedIntellect = data.sharedIntellect;
  }

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return TETHER_ABILITY;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.IGNORE_MOVESPEED_LIMIT,
      ModifierFunction.MOVESPEED_ABSOLUTE,
      ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
      ModifierFunction.STATS_STRENGTH_BONUS,
      ModifierFunction.STATS_AGILITY_BONUS,
      ModifierFunction.STATS_INTELLECT_BONUS,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  GetModifierMoveSpeed_Absolute(): number {
    const caster = this.GetCaster();
    if (!caster || caster.IsNull()) return 0;

    return getWispTetherMoveSpeedOverride(this.GetParent() === caster, this.GetStackCount());
  }

  GetModifierIgnoreMovespeedLimit(): 0 | 1 {
    return 1;
  }

  GetModifierIncomingDamage_Percentage(): number {
    const caster = this.GetCaster();
    if (!caster || caster.IsNull() || !caster.IsAlive() || this.GetParent() === caster) return 0;
    return -this.damageSharePct;
  }

  GetModifierBonusStats_Strength(): number {
    return this.sharedStrength;
  }

  GetModifierBonusStats_Agility(): number {
    return this.sharedAgility;
  }

  GetModifierBonusStats_Intellect(): number {
    return this.sharedIntellect;
  }

  OnTooltip(): number {
    return this.attributeSharePct;
  }

  OnTooltip2(): number {
    return this.damageSharePct;
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    const attacker = event.attacker;
    if (
      event.unit !== parent ||
      parent === caster ||
      event.damage <= 0 ||
      !caster ||
      caster.IsNull() ||
      !caster.IsAlive() ||
      !ability ||
      ability.IsNull() ||
      !attacker ||
      attacker.IsNull()
    ) {
      return;
    }

    const transferredDamage = getWispTetherTransferredDamage(
      event.damage,
      this.damageSharePct,
      (event.damage_flags & DamageFlag.REFLECTION) === DamageFlag.REFLECTION,
    );
    if (transferredDamage <= 0) return;

    ApplyDamage({
      victim: caster,
      attacker,
      damage: transferredDamage,
      damage_type: event.damage_type,
      damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION,
      ability: event.inflictor ?? ability,
    });
  }

  private updateSpecialValues(): void {
    const caster = this.GetCaster();
    const tether =
      caster && !caster.IsNull() ? caster.FindAbilityByName(TETHER_ABILITY) : undefined;
    if (!tether || tether.IsNull()) {
      this.damageSharePct = 0;
      this.attributeSharePct = 0;
      return;
    }

    this.damageSharePct = tether.GetSpecialValueFor('damage_share_pct');
    this.attributeSharePct = tether.GetSpecialValueFor('attribute_share_pct');
  }

  private getSharedAttribute(attribute: 'strength' | 'agility' | 'intellect'): number {
    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero | undefined;
    const parent = this.GetParent();
    if (!caster || caster.IsNull() || !caster.IsAlive() || parent === caster || !parent.IsHero()) {
      return 0;
    }

    const totalAttribute =
      attribute === 'strength'
        ? caster.GetStrength()
        : attribute === 'agility'
          ? caster.GetAgility()
          : caster.GetIntellect(false);
    let receivedTetherAttribute = 0;
    for (const modifier of caster.FindAllModifiersByName(
      modifier_special_bonus_unique_wisp_upgrade_tether.name,
    )) {
      if (modifier.IsNull()) continue;
      const provider = modifier.GetCaster();
      if (!provider || provider.IsNull() || provider === caster) continue;

      receivedTetherAttribute += (
        modifier as modifier_special_bonus_unique_wisp_upgrade_tether
      ).getCachedSharedAttribute(attribute);
    }

    const shareableAttribute = getWispTetherShareableAttribute(
      totalAttribute,
      receivedTetherAttribute,
    );
    return getWispTetherSharedAttribute(shareableAttribute, this.attributeSharePct);
  }

  private getCachedSharedAttribute(attribute: 'strength' | 'agility' | 'intellect'): number {
    return attribute === 'strength'
      ? this.sharedStrength
      : attribute === 'agility'
        ? this.sharedAgility
        : this.sharedIntellect;
  }

  private rememberSharedAttributes(): boolean {
    const strength = this.getSharedAttribute('strength');
    const agility = this.getSharedAttribute('agility');
    const intellect = this.getSharedAttribute('intellect');
    const changed =
      strength !== this.sharedStrength ||
      agility !== this.sharedAgility ||
      intellect !== this.sharedIntellect;

    this.sharedStrength = strength;
    this.sharedAgility = agility;
    this.sharedIntellect = intellect;
    return changed;
  }
}
