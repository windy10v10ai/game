import {
  BaseAbility,
  BaseModifier,
  BaseModifierMotionHorizontal,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  calculateLethalDamageConstant,
  isWithinTrueDragonPresence,
  updateRoarHealthLossState,
} from './dragon-knight-true-dragon-math';

const ELDER_DRAGON_FORM_MODIFIER = 'modifier_dragon_knight_dragon_form';
const TRUE_DRAGON_ICON = 'dragon_knight/dk_persona/dragon_knight_elder_dragon_form_persona1';
const TRUE_DRAGON_BODY_ARCS_PARTICLE =
  'particles/econ/items/zeus/zeus_immortal_2021/zeus_immortal_2021_static_field_gold_body_arcs.vpcf';
const TRUE_DRAGON_AMBIENT_SPARKLES_PARTICLE =
  'particles/econ/courier/courier_dragon_2024_gold/courier_dragon_2024_gold_ambient_sparkles.vpcf';
const TRUE_DRAGON_AMBIENT_TWINKLE_PARTICLE =
  'particles/econ/courier/courier_dragon_2024_gold/courier_dragon_2024_gold_ambient_gold_twinkle.vpcf';
const TRUE_DRAGON_GROUND_TRAIL_PARTICLE =
  'particles/custom/dragon_knight/true_dragon_ground_trail.vpcf';

const FORM_CHECK_INTERVAL = 0.1;
const AURA_LINGER_DURATION = 3;
const PRESENCE_CASTER_CHECK_INTERVAL = 0.25;
const TRUE_DRAGON_BODY_ARC_INTERVAL = 0.45;
const TRUE_DRAGON_GROUND_TRAIL_SPACING = 56;
const TRUE_DRAGON_GROUND_TRAIL_TELEPORT_DISTANCE = 600;
const TRUE_DRAGON_GROUND_TRAIL_MAX_MARKS_PER_TICK = 4;
const ATTACK_RANGE_SEARCH_PADDING = 512;
const ATTACK_RANGE_EDGE_TOLERANCE = 32;
const TRUE_DRAGON_ROAR_SOUND = 'Hero_DragonKnight.BreathFire';
const FEAR_MIN_MOVE_SPEED = 300;
const FEAR_FALLBACK_MOVE_INTERVAL = 0.03;
const FEAR_DIRECTION_OFFSETS = [0, 30, -30, 60, -60, 90, -90, 135, -135, 180];
const CORROSIVE_TICK_INTERVAL = 1;

@registerAbility('special_bonus_unique_dragon_knight_upgrade')
export class SpecialBonusUniqueDragonKnightUpgrade extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_special_bonus_unique_dragon_knight_upgrade.name;
  }

  OnUpgrade(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    if (caster.IsNull()) return;

    const trueDragonModifier = caster.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_dragon_knight_upgrade_true_dragon.name,
      caster,
    );
    if (trueDragonModifier) trueDragonModifier.ForceRefresh();
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade extends BaseModifier {
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

    const parent = this.GetParent();
    if (!parent.IsRealHero() || parent.IsIllusion()) return;

    this.syncTrueDragonForm();
    this.StartIntervalThink(FORM_CHECK_INTERVAL);
  }

  OnRefresh(): void {
    if (!IsServer()) return;
    this.syncTrueDragonForm();
  }

  OnIntervalThink(): void {
    this.syncTrueDragonForm();
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (!parent.IsNull()) {
      parent.RemoveModifierByNameAndCaster(
        modifier_special_bonus_unique_dragon_knight_upgrade_true_dragon.name,
        parent,
      );
    }
  }

  private syncTrueDragonForm(): void {
    const parent = this.GetParent();
    if (parent.IsNull() || !parent.IsRealHero() || parent.IsIllusion()) return;

    const trueDragonModifier = parent.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_dragon_knight_upgrade_true_dragon.name,
      parent,
    );
    if (trueDragonModifier) return;

    parent.AddNewModifier(
      parent,
      this.GetAbility(),
      modifier_special_bonus_unique_dragon_knight_upgrade_true_dragon.name,
      {},
    );
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade_true_dragon extends BaseModifier {
  private presenceDamageReductionPercent = 0;
  private roarTriggerMaximumHealthPercent = 0;
  private fearDuration = 0;
  private roarCooldown = 0;
  private accumulatedRoarHealthLoss = 0;
  private lastObservedHealth = 0;
  private roarCooldownEndTime = 0;
  private lethalProtectionAvailable = true;
  private wasAlive = true;
  private wasInElderDragonForm = false;
  private nextBodyArcTime = 0;
  private lastGroundTrailPosition?: Vector;
  private trueDragonParticleHandles: ParticleID[] = [];

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  GetPriority(): ModifierPriority {
    return ModifierPriority.SUPER_ULTRA;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.INCOMING_DAMAGE_PERCENTAGE,
      ModifierFunction.INCOMING_DAMAGE_CONSTANT,
      ModifierFunction.ON_TAKEDAMAGE,
      ModifierFunction.ON_HEALTH_GAINED,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnCreated(): void {
    this.refreshValues();
    if (!IsServer()) return;

    const parent = this.GetParent();
    this.accumulatedRoarHealthLoss = 0;
    this.lastObservedHealth = parent.GetHealth();
    this.lethalProtectionAvailable = true;
    this.wasAlive = parent.IsAlive();
    this.wasInElderDragonForm = parent.HasModifier(ELDER_DRAGON_FORM_MODIFIER);
    this.syncPresenceDebuffs();
    this.syncTrueDragonVisuals();
    this.StartIntervalThink(FORM_CHECK_INTERVAL);
  }

  OnRefresh(): void {
    this.refreshValues();
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (parent.IsNull()) return;
    if (!parent.IsAlive()) {
      this.wasAlive = false;
      this.accumulatedRoarHealthLoss = 0;
      this.lastObservedHealth = 0;
      this.destroyTrueDragonVisuals();
      return;
    }
    if (!this.wasAlive) {
      this.wasAlive = true;
      this.lethalProtectionAvailable = true;
      this.accumulatedRoarHealthLoss = 0;
      this.lastObservedHealth = parent.GetHealth();
    }

    const isInElderDragonForm = parent.HasModifier(ELDER_DRAGON_FORM_MODIFIER);
    if (isInElderDragonForm !== this.wasInElderDragonForm) {
      if (isInElderDragonForm) this.lethalProtectionAvailable = true;
      this.lastGroundTrailPosition = GetGroundPosition(parent.GetAbsOrigin(), parent);
    }
    this.wasInElderDragonForm = isInElderDragonForm;

    const currentHealth = parent.GetHealth();
    if (!this.isRoarCooldownReady()) this.accumulatedRoarHealthLoss = 0;
    this.lastObservedHealth = currentHealth;

    this.syncPresenceDebuffs();
    this.syncTrueDragonVisuals();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    this.destroyTrueDragonVisuals();
  }

  GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
    if (!this.isEnemyDamageEvent(event)) return 0;

    const parent = this.GetParent();
    const attacker = event.attacker;
    const presenceModifier = attacker.FindModifierByNameAndCaster(
      modifier_special_bonus_unique_dragon_knight_upgrade_presence.name,
      parent,
    );
    return presenceModifier ? -this.presenceDamageReductionPercent : 0;
  }

  GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
    if (
      !IsServer() ||
      !this.lethalProtectionAvailable ||
      !this.isRoarCooldownReady() ||
      !this.isEnemyDamageEvent(event)
    ) {
      return 0;
    }
    if (this.isHealthRemovalDamage(event)) return 0;

    const parent = this.GetParent();
    const damageConstant = calculateLethalDamageConstant(event.damage, parent.GetHealth());
    if (damageConstant === 0) return 0;

    this.lethalProtectionAvailable = false;
    Timers.CreateTimer(0, () => {
      if (!this.IsNull() && parent.IsAlive()) this.triggerRoar();
    });
    return damageConstant;
  }

  OnTakeDamage(event: ModifierInstanceEvent): void {
    if (!IsServer() || event.unit !== this.GetParent() || !this.isEnemyDamageEvent(event)) return;

    const parent = this.GetParent();
    const healthLossState = updateRoarHealthLossState(
      this.lastObservedHealth,
      parent.GetHealth(),
      this.accumulatedRoarHealthLoss,
      parent.GetMaxHealth(),
      this.roarTriggerMaximumHealthPercent,
      GameRules.GetGameTime(),
      this.roarCooldownEndTime,
      this.roarCooldown,
    );
    this.lastObservedHealth = healthLossState.observedHealth;
    this.accumulatedRoarHealthLoss = healthLossState.accumulatedHealthLoss;
    this.roarCooldownEndTime = healthLossState.cooldownEndTime;
    if (healthLossState.shouldTrigger) this.executeRoar();
  }

  OnHealthGained(event: ModifierHealEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;
    this.lastObservedHealth = this.GetParent().GetHealth();
  }

  OnTooltip(): number {
    return this.presenceDamageReductionPercent;
  }

  OnTooltip2(): number {
    return this.roarTriggerMaximumHealthPercent;
  }

  GetTexture(): string {
    return TRUE_DRAGON_ICON;
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;

    this.presenceDamageReductionPercent = ability.GetSpecialValueFor(
      'presence_damage_reduction_pct',
    );
    this.roarTriggerMaximumHealthPercent = ability.GetSpecialValueFor(
      'roar_trigger_max_health_pct',
    );
    this.fearDuration = ability.GetSpecialValueFor('fear_duration');
    this.roarCooldown = ability.GetSpecialValueFor('roar_cooldown');
  }

  private triggerRoar(): void {
    if (!this.isRoarCooldownReady()) {
      this.accumulatedRoarHealthLoss = 0;
      this.lastObservedHealth = this.GetParent().GetHealth();
      return;
    }

    this.roarCooldownEndTime = GameRules.GetGameTime() + Math.max(this.roarCooldown, 0);
    this.executeRoar();
  }

  private executeRoar(): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || parent.IsNull() || !parent.IsAlive()) return;

    const enemies = this.findEnemiesWithinCurrentAttackRange();
    this.accumulatedRoarHealthLoss = 0;
    this.lastObservedHealth = parent.GetHealth();
    parent.Purge(false, true, false, true, true);
    this.emitRoarSound();

    for (const enemy of enemies) {
      if (!enemy.IsAlive() || enemy.IsBuilding() || enemy.IsOther() || enemy.IsInvulnerable()) {
        continue;
      }
      enemy.AddNewModifier(
        parent,
        ability,
        modifier_special_bonus_unique_dragon_knight_upgrade_fear.name,
        { duration: this.fearDuration },
      );
    }
  }

  private syncPresenceDebuffs(): void {
    const parent = this.GetParent();
    const ability = this.GetAbility();
    if (!ability || ability.IsNull() || parent.IsNull() || !parent.IsAlive()) return;

    for (const enemy of this.findEnemiesWithinCurrentAttackRange()) {
      enemy.AddNewModifier(
        parent,
        ability,
        modifier_special_bonus_unique_dragon_knight_upgrade_presence.name,
        { duration: AURA_LINGER_DURATION },
      );
    }
  }

  private findEnemiesWithinCurrentAttackRange(): CDOTA_BaseNPC[] {
    const parent = this.GetParent();
    if (parent.IsNull() || !parent.IsAlive()) return [];

    const parentOrigin = parent.GetAbsOrigin();
    const attackRange = parent.Script_GetAttackRange();
    const candidates = FindUnitsInRadius(
      parent.GetTeamNumber(),
      parentOrigin,
      undefined,
      attackRange +
        parent.GetHullRadius() +
        ATTACK_RANGE_EDGE_TOLERANCE +
        ATTACK_RANGE_SEARCH_PADDING,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    return candidates.filter((enemy) => {
      if (!enemy.IsAlive() || enemy.IsBuilding() || enemy.IsOther() || enemy.IsInvulnerable()) {
        return false;
      }

      const enemyOrigin = enemy.GetAbsOrigin();
      return isWithinTrueDragonPresence(
        parentOrigin.x,
        parentOrigin.y,
        enemyOrigin.x,
        enemyOrigin.y,
        attackRange + ATTACK_RANGE_EDGE_TOLERANCE,
        parent.GetHullRadius(),
        enemy.GetHullRadius(),
      );
    });
  }

  private emitRoarSound(): void {
    const parent = this.GetParent();
    if (parent.IsNull()) return;
    EmitSoundOn(TRUE_DRAGON_ROAR_SOUND, parent);
  }

  private createReleasedParticle(particleName: string, parent: CDOTA_BaseNPC): void {
    const particle = ParticleManager.CreateParticle(
      particleName,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      parent,
    );
    ParticleManager.ReleaseParticleIndex(particle);
  }

  private syncTrueDragonVisuals(): void {
    const parent = this.GetParent();
    if (parent.IsNull() || !parent.IsAlive()) {
      this.destroyTrueDragonVisuals();
      return;
    }

    if (this.trueDragonParticleHandles.length === 0) {
      for (const particleName of [
        TRUE_DRAGON_AMBIENT_SPARKLES_PARTICLE,
        TRUE_DRAGON_AMBIENT_TWINKLE_PARTICLE,
      ]) {
        this.trueDragonParticleHandles.push(
          ParticleManager.CreateParticle(particleName, ParticleAttachment.ABSORIGIN_FOLLOW, parent),
        );
      }
    }

    this.syncGroundTrail(parent);

    const currentTime = GameRules.GetGameTime();
    if (currentTime >= this.nextBodyArcTime) {
      this.createReleasedParticle(TRUE_DRAGON_BODY_ARCS_PARTICLE, parent);
      this.nextBodyArcTime = currentTime + TRUE_DRAGON_BODY_ARC_INTERVAL;
    }
  }

  private destroyTrueDragonVisuals(): void {
    for (const particle of this.trueDragonParticleHandles) {
      ParticleManager.DestroyParticle(particle, false);
      ParticleManager.ReleaseParticleIndex(particle);
    }
    this.nextBodyArcTime = 0;
    this.lastGroundTrailPosition = undefined;
    this.trueDragonParticleHandles = [];
  }

  private syncGroundTrail(parent: CDOTA_BaseNPC): void {
    const currentPosition = GetGroundPosition(parent.GetAbsOrigin(), parent);
    const lastPosition = this.lastGroundTrailPosition;
    if (!lastPosition) {
      this.lastGroundTrailPosition = currentPosition;
      return;
    }

    const displacement = currentPosition.__sub(lastPosition);
    const distance = displacement.Length2D();
    if (distance > TRUE_DRAGON_GROUND_TRAIL_TELEPORT_DISTANCE) {
      this.lastGroundTrailPosition = currentPosition;
      return;
    }
    if (distance < TRUE_DRAGON_GROUND_TRAIL_SPACING) return;

    const direction = Vector(displacement.x / distance, displacement.y / distance, 0);
    const markCount = Math.min(
      Math.floor(distance / TRUE_DRAGON_GROUND_TRAIL_SPACING),
      TRUE_DRAGON_GROUND_TRAIL_MAX_MARKS_PER_TICK,
    );
    for (let index = 1; index <= markCount; index++) {
      const markPosition = GetGroundPosition(
        lastPosition.__add(direction.__mul(TRUE_DRAGON_GROUND_TRAIL_SPACING * index)),
        parent,
      );
      const particle = ParticleManager.CreateParticle(
        TRUE_DRAGON_GROUND_TRAIL_PARTICLE,
        ParticleAttachment.WORLDORIGIN,
        parent,
      );
      ParticleManager.SetParticleControl(particle, 0, markPosition.__add(Vector(0, 0, 4)));
      ParticleManager.ReleaseParticleIndex(particle);
    }

    this.lastGroundTrailPosition =
      markCount === TRUE_DRAGON_GROUND_TRAIL_MAX_MARKS_PER_TICK
        ? currentPosition
        : lastPosition.__add(direction.__mul(TRUE_DRAGON_GROUND_TRAIL_SPACING * markCount));
  }

  private isRoarCooldownReady(): boolean {
    return GameRules.GetGameTime() >= this.roarCooldownEndTime;
  }

  private isEnemyDamageEvent(event: ModifierAttackEvent | ModifierInstanceEvent): boolean {
    const parent = this.GetParent();
    const attacker = event.attacker;
    return (
      event.damage > 0 &&
      attacker !== undefined &&
      !attacker.IsNull() &&
      attacker !== parent &&
      attacker.GetTeamNumber() !== parent.GetTeamNumber()
    );
  }

  private isHealthRemovalDamage(event: ModifierAttackEvent | ModifierInstanceEvent): boolean {
    return (event.damage_flags & DamageFlag.HPLOSS) !== 0;
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade_presence extends BaseModifier {
  private damageReductionPercent = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.TOOLTIP];
  }

  OnCreated(): void {
    this.refreshValues();
    if (IsServer()) this.StartIntervalThink(PRESENCE_CASTER_CHECK_INTERVAL);
  }

  OnRefresh(): void {
    this.refreshValues();
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    if (!caster || caster.IsNull() || !caster.IsAlive()) this.Destroy();
  }

  OnTooltip(): number {
    return this.damageReductionPercent;
  }

  GetTexture(): string {
    return TRUE_DRAGON_ICON;
  }

  private refreshValues(): void {
    const ability = this.GetAbility();
    if (!ability || ability.IsNull()) return;
    this.damageReductionPercent = ability.GetSpecialValueFor('presence_damage_reduction_pct');
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade_corrosive extends BaseModifier {
  private additionalDamage = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'dragon_knight_elder_dragon_form';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.PHYSICAL_ARMOR_BONUS,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnCreated(params: { additionalDamage?: number; armorReduction?: number }): void {
    this.refreshValues(params);
    if (IsServer()) this.StartIntervalThink(CORROSIVE_TICK_INTERVAL);
  }

  OnRefresh(params: { additionalDamage?: number; armorReduction?: number }): void {
    this.refreshValues(params);
  }

  OnIntervalThink(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    const caster = this.GetCaster();
    const ability = this.GetAbility();
    if (
      parent.IsNull() ||
      !parent.IsAlive() ||
      !caster ||
      caster.IsNull() ||
      !ability ||
      ability.IsNull() ||
      this.additionalDamage <= 0
    ) {
      return;
    }

    ApplyDamage({
      victim: parent,
      attacker: caster,
      damage: this.additionalDamage,
      damage_type: DamageTypes.MAGICAL,
      damage_flags: DamageFlag.NONE,
      ability,
    });
  }

  GetModifierPhysicalArmorBonus(): number {
    return -this.GetStackCount();
  }

  OnTooltip(): number {
    return this.GetStackCount();
  }

  OnTooltip2(): number {
    return this.additionalDamage;
  }

  private refreshValues(params: { additionalDamage?: number; armorReduction?: number }): void {
    this.additionalDamage = Math.max(params.additionalDamage ?? this.additionalDamage, 0);
    if (IsServer()) {
      this.SetStackCount(Math.max(Math.floor(params.armorReduction ?? this.GetStackCount()), 0));
    }
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade_frost extends BaseModifier {
  private movementSlow = 0;
  private attackSpeedSlow = 0;
  private healingReduction = 0;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return true;
  }

  GetTexture(): string {
    return 'dragon_knight_elder_dragon_form';
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
      ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
      ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE,
      ModifierFunction.HEAL_AMPLIFY_PERCENTAGE_TARGET,
      ModifierFunction.TOOLTIP,
      ModifierFunction.TOOLTIP2,
    ];
  }

  OnCreated(params: {
    movementSlow?: number;
    attackSpeedSlow?: number;
    healingReduction?: number;
  }): void {
    this.refreshValues(params);
  }

  OnRefresh(params: {
    movementSlow?: number;
    attackSpeedSlow?: number;
    healingReduction?: number;
  }): void {
    this.refreshValues(params);
  }

  GetModifierMoveSpeedBonus_Percentage(): number {
    return -this.movementSlow;
  }

  GetModifierAttackSpeedBonus_Constant(): number {
    return -this.attackSpeedSlow;
  }

  GetModifierHPRegenAmplify_Percentage(): number {
    return -this.healingReduction;
  }

  GetModifierHealAmplify_PercentageTarget(): number {
    return -this.healingReduction;
  }

  OnTooltip(): number {
    return this.movementSlow;
  }

  OnTooltip2(): number {
    return this.attackSpeedSlow;
  }

  private refreshValues(params: {
    movementSlow?: number;
    attackSpeedSlow?: number;
    healingReduction?: number;
  }): void {
    this.movementSlow = Math.max(params.movementSlow ?? this.movementSlow, 0);
    this.attackSpeedSlow = Math.max(params.attackSpeedSlow ?? this.attackSpeedSlow, 0);
    this.healingReduction = Math.max(params.healingReduction ?? this.healingReduction, 0);
  }
}

@registerModifier('abilities/ts_abilities/special_bonus_unique_dragon_knight_upgrade')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_special_bonus_unique_dragon_knight_upgrade_fear extends BaseModifierMotionHorizontal {
  private hasHorizontalMotionController = false;

  IsHidden(): boolean {
    return false;
  }

  IsDebuff(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  IgnoreTenacity(): boolean {
    return true;
  }

  GetTexture(): string {
    return TRUE_DRAGON_ICON;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.OVERRIDE_ANIMATION];
  }

  OnCreated(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    parent.SetForceAttackTarget(undefined);
    parent.Stop();
    parent.Interrupt();
    this.hasHorizontalMotionController = this.ApplyHorizontalMotionController();
    if (!this.hasHorizontalMotionController) {
      this.StartIntervalThink(FEAR_FALLBACK_MOVE_INTERVAL);
    }
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    const parent = this.GetParent();
    if (parent.IsNull()) return;
    if (this.hasHorizontalMotionController) parent.RemoveHorizontalMotionController(this);
    FindClearSpaceForUnit(parent, parent.GetAbsOrigin(), false);
  }

  OnHorizontalMotionInterrupted(): void {
    if (!IsServer()) return;

    this.hasHorizontalMotionController = false;
    this.StartIntervalThink(FEAR_FALLBACK_MOVE_INTERVAL);
  }

  OnIntervalThink(): void {
    const parent = this.GetParent();
    if (parent.IsNull() || !parent.IsAlive()) {
      this.Destroy();
      return;
    }
    if (parent.IsCurrentlyHorizontalMotionControlled()) return;

    this.moveParentAway(parent, FEAR_FALLBACK_MOVE_INTERVAL);
  }

  UpdateHorizontalMotion(parent: CDOTA_BaseNPC, dt: number): void {
    this.moveParentAway(parent, dt);
  }

  private moveParentAway(parent: CDOTA_BaseNPC, dt: number): void {
    const caster = this.GetCaster();
    if (parent.IsNull() || !parent.IsAlive() || !caster || caster.IsNull()) {
      this.Destroy();
      return;
    }

    const parentOrigin = parent.GetAbsOrigin();
    const delta = parentOrigin.__sub(caster.GetAbsOrigin());
    const length = delta.Length2D();
    const awayDirection =
      length > 0.01
        ? Vector(delta.x / length, delta.y / length, 0)
        : caster.GetForwardVector().__mul(-1);
    const moveSpeed = Math.max(parent.GetIdealSpeed(), FEAR_MIN_MOVE_SPEED);
    const movementDirection = this.findTraversableDirection(
      parentOrigin,
      awayDirection,
      moveSpeed * dt,
      parent,
    );

    parent.SetForwardVector(movementDirection ?? awayDirection);
    if (!movementDirection) return;

    parent.SetAbsOrigin(
      GetGroundPosition(parentOrigin.__add(movementDirection.__mul(moveSpeed * dt)), parent),
    );
  }

  GetOverrideAnimation(): GameActivity {
    return GameActivity.DOTA_RUN;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.FEARED]: true,
      [ModifierState.DISARMED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.MUTED]: true,
    };
  }

  private findTraversableDirection(
    origin: Vector,
    awayDirection: Vector,
    stepDistance: number,
    parent: CDOTA_BaseNPC,
  ): Vector | undefined {
    for (const angle of FEAR_DIRECTION_OFFSETS) {
      const radians = (angle * Math.PI) / 180;
      const direction = Vector(
        awayDirection.x * Math.cos(radians) - awayDirection.y * Math.sin(radians),
        awayDirection.x * Math.sin(radians) + awayDirection.y * Math.cos(radians),
        0,
      );
      const nextPosition = GetGroundPosition(origin.__add(direction.__mul(stepDistance)), parent);
      if (GridNav.IsTraversable(nextPosition)) return direction;
    }

    return undefined;
  }
}
