import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  RazorStaticLinkAwakenLedger,
  resolveRazorStaticLinkAwakenLevel,
} from './razor-static-link-awaken-logic';

const STATIC_LINK_TEXTURE = 'razor_static_link';
const STATIC_LINK_ABILITY = 'razor_static_link_awakened';
const CONTROLLER_MODIFIER = 'modifier_razor_static_link_awakened_controller';
const SELF_GAIN_MODIFIER = 'modifier_razor_static_link_awakened_gain';
const TARGET_REDUCTION_MODIFIER = 'modifier_razor_static_link_awakened_reduction';

@registerAbility('razor_static_link_awakened_controller')
export class RazorStaticLinkAwakenedController extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return CONTROLLER_MODIFIER;
  }
}

@registerModifier('abilities/ts_abilities/razor_static_link_awakened_controller')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_razor_static_link_awakened_controller extends BaseModifier {
  private readonly ledger = new RazorStaticLinkAwakenLedger<EntityIndex>();
  private readonly targets = new Map<EntityIndex, CDOTA_BaseNPC>();
  private intervalRunning = false;

  IsHidden(): boolean {
    const razor = this.GetParent() as CDOTA_BaseNPC_Hero;
    const staticLink = razor.FindAbilityByName(STATIC_LINK_ABILITY);
    return !staticLink || staticLink.IsNull() || staticLink.GetLevel() <= 0;
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
    return STATIC_LINK_TEXTURE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_TAKEDAMAGE];
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer()) return;

    const razor = this.GetParent() as CDOTA_BaseNPC_Hero;
    const controllerAbility = this.GetAbility();
    const target = event.unit;
    if (
      event.attacker !== razor ||
      !razor.IsRealHero() ||
      razor.IsIllusion() ||
      razor.PassivesDisabled() ||
      !controllerAbility ||
      controllerAbility.IsNull() ||
      !this.isValidTarget(razor, target) ||
      event.damage <= 0
    ) {
      return;
    }

    const trigger = this.resolveAwakenedStaticLink(razor);
    if (trigger === undefined) return;

    const targetIndex = target.GetEntityIndex();
    const targetCurrentAttackDamage = target.GetAverageTrueAttackDamage(undefined);
    const now = GameRules.GetGameTime();
    const transfer = this.ledger.recordDamage(
      targetIndex,
      event.damage,
      now,
      trigger.staticLink.GetSpecialValueFor('awaken_duration'),
      trigger.selfGainCap,
      trigger.staticLink.GetSpecialValueFor('awaken_target_reduction_total_cap'),
      targetCurrentAttackDamage,
      trigger.staticLink.GetSpecialValueFor('awaken_target_reduction_per_instance'),
    );

    this.updateSelfModifier(razor, trigger.staticLink);

    if (transfer.targetReduction > 0 || this.ledger.getTargetTotal(targetIndex) > 0) {
      this.targets.set(targetIndex, target);
      this.updateTargetModifier(razor, trigger.staticLink, targetIndex, target);
    } else {
      this.targets.delete(targetIndex);
      this.destroyTargetModifier(razor, target);
    }

    this.ensureIntervalThink(trigger.staticLink.GetSpecialValueFor('expiry_scan_interval'));
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const razor = this.GetParent() as CDOTA_BaseNPC_Hero;
    const trigger = this.resolveAwakenedStaticLink(razor);
    if (!this.isValidEntity(razor) || trigger === undefined) {
      this.cleanupAllModifiers();
      this.ledger.clear();
      this.targets.clear();
      this.stopIntervalThink();
      return;
    }

    this.ledger.expire(GameRules.GetGameTime());
    this.updateSelfModifier(razor, trigger.staticLink);

    for (const [targetIndex, target] of this.targets) {
      if (!this.isValidEntity(target)) {
        this.ledger.removeTarget(targetIndex);
        this.targets.delete(targetIndex);
        continue;
      }

      if (this.ledger.getTargetTotal(targetIndex) <= 0) {
        this.destroyTargetModifier(razor, target);
        this.targets.delete(targetIndex);
        continue;
      }

      this.updateTargetModifier(razor, trigger.staticLink, targetIndex, target);
    }

    if (!this.ledger.hasRecords()) {
      this.stopIntervalThink();
    }
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.cleanupAllModifiers();
    this.ledger.clear();
    this.targets.clear();
    this.stopIntervalThink();
  }

  private resolveAwakenedStaticLink(
    razor: CDOTA_BaseNPC_Hero,
  ): { staticLink: CDOTABaseAbility; selfGainCap: number } | undefined {
    const staticLink = razor.FindAbilityByName(STATIC_LINK_ABILITY);
    if (!staticLink || staticLink.IsNull()) return undefined;

    const awakenedLevel = resolveRazorStaticLinkAwakenLevel(
      staticLink.GetLevel(),
      staticLink.GetMaxLevel(),
    );
    if (awakenedLevel === undefined) return undefined;

    return {
      staticLink,
      selfGainCap: staticLink.GetSpecialValueFor('awaken_self_gain_cap'),
    };
  }

  private isValidTarget(razor: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): boolean {
    return this.isValidEntity(target) && target.GetTeamNumber() !== razor.GetTeamNumber();
  }

  private isValidEntity(entity: CBaseEntity): boolean {
    return IsValidEntity(entity) && !entity.IsNull();
  }

  private ensureIntervalThink(configuredInterval: number): void {
    if (this.intervalRunning) return;
    this.intervalRunning = true;
    this.StartIntervalThink(Math.max(0.1, configuredInterval));
  }

  private stopIntervalThink(): void {
    if (!this.intervalRunning) return;
    this.intervalRunning = false;
    this.StartIntervalThink(-1);
  }

  private updateSelfModifier(razor: CDOTA_BaseNPC_Hero, ability: CDOTABaseAbility): void {
    const total = this.ledger.getSelfTotal();
    const existing = razor.FindModifierByNameAndCaster(SELF_GAIN_MODIFIER, razor) as
      | modifier_razor_static_link_awakened_gain
      | undefined;

    if (total <= 0) {
      if (existing && !existing.IsNull()) existing.Destroy();
      return;
    }

    const modifier =
      existing && !existing.IsNull()
        ? existing
        : (razor.AddNewModifier(razor, ability, SELF_GAIN_MODIFIER, {}) as
            | modifier_razor_static_link_awakened_gain
            | undefined);
    if (modifier && !modifier.IsNull()) modifier.SetAttackDamage(total);
  }

  private updateTargetModifier(
    razor: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility,
    targetIndex: EntityIndex,
    target: CDOTA_BaseNPC,
  ): void {
    const total = this.ledger.getTargetTotal(targetIndex);
    const existing = target.FindModifierByNameAndCaster(TARGET_REDUCTION_MODIFIER, razor) as
      | modifier_razor_static_link_awakened_reduction
      | undefined;

    if (total <= 0) {
      if (existing && !existing.IsNull()) existing.Destroy();
      return;
    }

    const modifier =
      existing && !existing.IsNull()
        ? existing
        : (target.AddNewModifier(razor, ability, TARGET_REDUCTION_MODIFIER, {}) as
            | modifier_razor_static_link_awakened_reduction
            | undefined);
    if (modifier && !modifier.IsNull()) modifier.SetAttackDamageReduction(total);
  }

  private destroyTargetModifier(razor: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): void {
    const modifier = target.FindModifierByNameAndCaster(TARGET_REDUCTION_MODIFIER, razor);
    if (modifier && !modifier.IsNull()) modifier.Destroy();
  }

  private cleanupAllModifiers(): void {
    const razor = this.GetParent() as CDOTA_BaseNPC_Hero;
    if (this.isValidEntity(razor)) {
      const selfModifier = razor.FindModifierByNameAndCaster(SELF_GAIN_MODIFIER, razor);
      if (selfModifier && !selfModifier.IsNull()) selfModifier.Destroy();

      for (const target of this.targets.values()) {
        if (this.isValidEntity(target)) this.destroyTargetModifier(razor, target);
      }
    }
  }
}

@registerModifier('abilities/ts_abilities/razor_static_link_awakened_controller')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_razor_static_link_awakened_gain extends BaseModifier {
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
    return STATIC_LINK_TEXTURE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.TOOLTIP];
  }

  GetModifierPreAttack_BonusDamage(): number {
    return this.GetStackCount();
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  SetAttackDamage(value: number): void {
    this.SetStackCount(Math.max(0, Math.floor(value + 0.5)));
  }
}

@registerModifier('abilities/ts_abilities/razor_static_link_awakened_controller')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_razor_static_link_awakened_reduction extends BaseModifier {
  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  GetTexture(): string {
    return STATIC_LINK_TEXTURE;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.BASEATTACK_BONUSDAMAGE, ModifierFunction.TOOLTIP];
  }

  GetModifierBaseAttack_BonusDamage(): number {
    return -this.GetStackCount();
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  SetAttackDamageReduction(value: number): void {
    this.SetStackCount(Math.max(0, Math.floor(value + 0.5)));
  }
}
