import {
  BaseAbility,
  BaseModifier,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';

const SPIRIT_BREAKER_HERO = 'npc_dota_hero_spirit_breaker';
const GREATER_BASH = 'spirit_breaker_greater_bash';
const CHARGE_PARTICLE = 'particles/units/heroes/hero_spirit_breaker/spirit_breaker_charge.vpcf';
const GREATER_BASH_PARTICLE =
  'particles/units/heroes/hero_spirit_breaker/spirit_breaker_greater_bash.vpcf';

const THINK_INTERVAL = 0.03;
const COLLISION_SCAN_INTERVAL = 0.06;
const MAX_CAST_LIFETIME = 30;
const IMPACT_DISTANCE = 72;
const BODY_STOP_DISTANCE = 96;
const MOTION_START_GRACE = 0.15;
const DEFAULT_HERO_HITBOX = 185;
const DEFAULT_CREEP_HITBOX = 100;

interface ChargeRunner {
  targetIndex: EntityIndex;
  unitIndex: EntityIndex;
  isCaster: boolean;
  chargeParticle: ParticleID;
}

interface KnockbackMotion {
  targetIndex: EntityIndex;
  lastPosition: Vector;
  fallbackDirection: Vector;
  createdAt: number;
  sawMovement: boolean;
}

interface ActiveKnockbackMotion {
  target: CDOTA_BaseNPC;
  position: Vector;
  direction: Vector;
}

interface ChargeCastState {
  id: number;
  caster: CDOTA_BaseNPC_Hero;
  chargeSpeed: number;
  runners: Map<EntityIndex, ChargeRunner>;
  motions: Map<EntityIndex, KnockbackMotion>;
  collidedPairs: Set<string>;
  heroCollisionRadius: number;
  creepCollisionRadius: number;
  nextCollisionScanAt: number;
  expiresAt: number;
}

/** 群魂冲锋：本体与同步其状态的虚影分别冲锋选定范围内的敌人。 */
@registerAbility('spirit_breaker_charge_of_darkness_awaken')
export class SpiritBreakerChargeOfDarknessAwaken extends BaseAbility {
  private nextCastId = 1;
  private activeCasts = new Map<number, ChargeCastState>();

  GetIntrinsicModifierName(): string {
    return modifier_spirit_breaker_charge_of_darkness_awaken.name;
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('echo_radius');
  }

  OnSpellStart(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    if (!this.IsValidCaster(caster)) return;

    const center = this.GetCursorPosition();
    const radius = this.GetSpecialValueFor('echo_radius');
    const targets = FindUnitsInRadius(
      caster.GetTeamNumber(),
      center,
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.FOW_VISIBLE | UnitTargetFlags.NO_INVIS | UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.CLOSEST,
      false,
    ).filter((target) => !target.IsNull() && target.IsAlive());

    if (targets.length <= 0) return;

    const now = GameRules.GetGameTime();
    const castId = this.nextCastId;
    this.nextCastId += 1;
    const chargeSpeed = this.GetCurrentChargeSpeed(caster);
    const heroCollisionRadius = this.GetConfiguredCollisionRadius(true);
    const creepCollisionRadius = this.GetConfiguredCollisionRadius(false);
    const state: ChargeCastState = {
      id: castId,
      caster,
      chargeSpeed,
      runners: new Map<EntityIndex, ChargeRunner>(),
      motions: new Map<EntityIndex, KnockbackMotion>(),
      collidedPairs: new Set<string>(),
      heroCollisionRadius,
      creepCollisionRadius,
      nextCollisionScanAt: now,
      expiresAt: now + MAX_CAST_LIFETIME,
    };
    // FindOrder.CLOSEST 以施法圆心排序：最接近圆心者由本体冲锋，其余目标由分身冲锋。
    const primaryTarget = targets[0];
    const bodyRunner = this.CreateBodyRunner(caster, primaryTarget);
    state.runners.set(bodyRunner.targetIndex, bodyRunner);

    for (let index = 1; index < targets.length; index += 1) {
      const runner = this.CreateShadowRunner(caster, targets[index]);
      if (!runner) continue;
      state.runners.set(runner.targetIndex, runner);
    }

    this.activeCasts.set(castId, state);
    Timers.CreateTimer(0, () => this.TickCast(castId));
  }

  private IsValidCaster(caster: CDOTA_BaseNPC_Hero): boolean {
    return (
      !caster.IsNull() &&
      caster.IsRealHero() &&
      !caster.IsIllusion() &&
      caster.GetUnitName() === SPIRIT_BREAKER_HERO
    );
  }

  private CreateBodyRunner(caster: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC): ChargeRunner {
    caster.AddNewModifier(
      caster,
      this,
      modifier_spirit_breaker_charge_of_darkness_awaken_body.name,
      { duration: MAX_CAST_LIFETIME },
    );
    caster.StartGesture(GameActivity.DOTA_RUN);
    return this.CreateRunner(caster, target, true);
  }

  private CreateShadowRunner(
    caster: CDOTA_BaseNPC_Hero,
    target: CDOTA_BaseNPC,
  ): ChargeRunner | undefined {
    const shadows = CreateIllusions(
      caster,
      caster,
      {
        outgoing_damage: 0,
        incoming_damage: 0,
      },
      1,
      0,
      false,
      false,
    );
    const shadow = shadows[0];
    if (!shadow || shadow.IsNull()) return undefined;

    const casterOrigin = caster.GetAbsOrigin();
    shadow.SetAbsOrigin(Vector(casterOrigin.x, casterOrigin.y, casterOrigin.z));
    this.StripShadowGameplayInstances(shadow);
    shadow.SetDayTimeVisionRange(0);
    shadow.SetNightTimeVisionRange(0);
    shadow.AddNewModifier(
      caster,
      this,
      modifier_spirit_breaker_charge_of_darkness_awaken_shadow.name,
      { duration: MAX_CAST_LIFETIME },
    );
    shadow.StartGesture(GameActivity.DOTA_RUN);
    return this.CreateRunner(shadow, target, false);
  }

  private StripShadowGameplayInstances(shadow: CDOTA_BaseNPC_Hero): void {
    for (let index = 23; index >= 0; index -= 1) {
      const ability = shadow.GetAbilityByIndex(index);
      if (ability && !ability.IsNull()) shadow.RemoveAbility(ability.GetAbilityName());
    }

    const itemSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 24, 26];
    for (const slot of itemSlots) {
      const item = shadow.GetItemInSlot(slot);
      if (!item || item.IsNull()) continue;
      shadow.RemoveItem(item);
      UTIL_Remove(item);
    }
  }

  private CreateRunner(
    unit: CDOTA_BaseNPC,
    target: CDOTA_BaseNPC,
    isCaster: boolean,
  ): ChargeRunner {
    const direction = this.DirectionFromTo(unit.GetAbsOrigin(), target.GetAbsOrigin());
    unit.SetForwardVector(direction);
    const particle = ParticleManager.CreateParticle(
      CHARGE_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      unit,
    );
    return {
      targetIndex: target.GetEntityIndex(),
      unitIndex: unit.GetEntityIndex(),
      isCaster,
      chargeParticle: particle,
    };
  }

  private TickCast(castId: number): number | undefined {
    const state = this.activeCasts.get(castId);
    if (!state) return undefined;

    if (this.IsNull() || state.caster.IsNull() || GameRules.GetGameTime() >= state.expiresAt) {
      this.DestroyCast(state);
      return undefined;
    }

    this.TickRunners(state);
    this.TickKnockbackMotions(state);
    if (state.runners.size <= 0 && state.motions.size <= 0) {
      this.DestroyCast(state);
      return undefined;
    }
    return THINK_INTERVAL;
  }

  private TickRunners(state: ChargeCastState): void {
    const completed: EntityIndex[] = [];
    const currentChargeSpeed = this.GetCurrentChargeSpeed(state.caster);
    state.chargeSpeed = currentChargeSpeed;

    for (const [targetIndex, runner] of state.runners) {
      const target = EntIndexToHScript(targetIndex) as CDOTA_BaseNPC | undefined;
      const runnerUnit = EntIndexToHScript(runner.unitIndex) as CDOTA_BaseNPC | undefined;
      if (
        !target ||
        target.IsNull() ||
        !target.IsAlive() ||
        !runnerUnit ||
        runnerUnit.IsNull() ||
        !runnerUnit.IsAlive()
      ) {
        this.DestroyRunner(runner);
        completed.push(targetIndex);
        continue;
      }

      const runnerPosition = runnerUnit.GetAbsOrigin();
      const targetPosition = target.GetAbsOrigin();
      const direction = this.DirectionFromTo(runnerPosition, targetPosition);
      const distance = this.Distance2D(runnerPosition, targetPosition);
      const step = currentChargeSpeed * THINK_INTERVAL;
      runnerUnit.SetForwardVector(direction);

      if (distance <= Math.max(IMPACT_DISTANCE, step)) {
        if (runner.isCaster) {
          const stopDistance = Math.min(BODY_STOP_DISTANCE, distance);
          runnerUnit.SetAbsOrigin(
            Vector(
              targetPosition.x - direction.x * stopDistance,
              targetPosition.y - direction.y * stopDistance,
              targetPosition.z,
            ),
          );
        }
        this.DestroyRunner(runner);
        completed.push(targetIndex);
        this.ResolveRunnerImpact(state, target, direction);
        continue;
      }

      runnerUnit.SetAbsOrigin(
        Vector(
          runnerPosition.x + direction.x * step,
          runnerPosition.y + direction.y * step,
          targetPosition.z,
        ),
      );
    }

    for (const targetIndex of completed) state.runners.delete(targetIndex);
  }

  private DestroyRunner(runner: ChargeRunner): void {
    ParticleManager.DestroyParticle(runner.chargeParticle, false);
    ParticleManager.ReleaseParticleIndex(runner.chargeParticle);

    const runnerUnit = EntIndexToHScript(runner.unitIndex) as CDOTA_BaseNPC | undefined;
    if (!runnerUnit || runnerUnit.IsNull()) return;

    if (runner.isCaster) {
      runnerUnit.FadeGesture(GameActivity.DOTA_RUN);
      runnerUnit.RemoveModifierByName(modifier_spirit_breaker_charge_of_darkness_awaken_body.name);
      FindClearSpaceForUnit(runnerUnit, runnerUnit.GetAbsOrigin(), true);
    } else {
      runnerUnit.FadeGesture(GameActivity.DOTA_RUN);
      UTIL_Remove(runnerUnit);
    }
  }

  CancelBodyCharge(caster: CDOTA_BaseNPC): void {
    if (!IsServer()) return;

    const casterIndex = caster.GetEntityIndex();
    for (const state of this.activeCasts.values()) {
      for (const [targetIndex, runner] of state.runners) {
        if (!runner.isCaster || runner.unitIndex !== casterIndex) continue;

        this.DestroyRunner(runner);
        state.runners.delete(targetIndex);
        break;
      }
    }
  }

  private ResolveRunnerImpact(
    state: ChargeCastState,
    target: CDOTA_BaseNPC,
    direction: Vector,
  ): void {
    if (!this.ApplyGreaterBash(state, target, true, direction, 100)) return;

    this.AddKnockbackMotion(state, target, direction);
  }

  private AddKnockbackMotion(
    state: ChargeCastState,
    target: CDOTA_BaseNPC,
    fallbackDirection: Vector,
  ): void {
    const targetIndex = target.GetEntityIndex();
    const existing = state.motions.get(targetIndex);
    if (existing) {
      existing.fallbackDirection = fallbackDirection;
      return;
    }

    const origin = target.GetAbsOrigin();
    state.motions.set(targetIndex, {
      targetIndex,
      lastPosition: Vector(origin.x, origin.y, origin.z),
      fallbackDirection,
      createdAt: GameRules.GetGameTime(),
      sawMovement: false,
    });
  }

  private TickKnockbackMotions(state: ChargeCastState): void {
    const finished: EntityIndex[] = [];
    const activeMotions: ActiveKnockbackMotion[] = [];
    const now = GameRules.GetGameTime();

    for (const [targetIndex, motion] of state.motions) {
      const movingTarget = EntIndexToHScript(targetIndex) as CDOTA_BaseNPC | undefined;
      if (!movingTarget || movingTarget.IsNull() || !movingTarget.IsAlive()) {
        finished.push(targetIndex);
        continue;
      }

      const currentPosition = movingTarget.GetAbsOrigin();
      const isMoving =
        movingTarget.HasModifier('modifier_knockback') ||
        movingTarget.IsCurrentlyHorizontalMotionControlled();
      if (!isMoving) {
        motion.lastPosition = Vector(currentPosition.x, currentPosition.y, currentPosition.z);
        if (motion.sawMovement || now - motion.createdAt >= MOTION_START_GRACE) {
          finished.push(targetIndex);
        }
        continue;
      }

      motion.sawMovement = true;
      const movement = Vector(
        currentPosition.x - motion.lastPosition.x,
        currentPosition.y - motion.lastPosition.y,
        0,
      );
      const direction = movement.Length2D() > 0 ? movement.Normalized() : motion.fallbackDirection;
      motion.lastPosition = Vector(currentPosition.x, currentPosition.y, currentPosition.z);
      activeMotions.push({ target: movingTarget, position: currentPosition, direction });
    }

    for (const targetIndex of finished) state.motions.delete(targetIndex);
    if (activeMotions.length <= 0 || now < state.nextCollisionScanAt) return;

    state.nextCollisionScanAt = now + COLLISION_SCAN_INTERVAL;
    const nearby = this.FindCollisionCandidates(state, activeMotions);
    for (const motion of activeMotions) {
      this.ResolveNearbyCollisions(state, motion.target, motion.position, motion.direction, nearby);
    }
  }

  private FindCollisionCandidates(
    state: ChargeCastState,
    motions: ActiveKnockbackMotion[],
  ): CDOTA_BaseNPC[] {
    let minX = motions[0].position.x;
    let maxX = minX;
    let minY = motions[0].position.y;
    let maxY = minY;
    for (let index = 1; index < motions.length; index += 1) {
      const position = motions[index].position;
      minX = Math.min(minX, position.x);
      maxX = Math.max(maxX, position.x);
      minY = Math.min(minY, position.y);
      maxY = Math.max(maxY, position.y);
    }

    const center = Vector((minX + maxX) / 2, (minY + maxY) / 2, motions[0].position.z);
    const maxHitbox = Math.max(state.heroCollisionRadius, state.creepCollisionRadius);
    let radius = maxHitbox;
    for (const motion of motions) {
      radius = Math.max(radius, this.Distance2D(center, motion.position) + maxHitbox);
    }

    return FindUnitsInRadius(
      state.caster.GetTeamNumber(),
      center,
      undefined,
      radius,
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO | UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );
  }

  private ResolveNearbyCollisions(
    state: ChargeCastState,
    movingTarget: CDOTA_BaseNPC,
    currentPosition: Vector,
    direction: Vector,
    nearby: CDOTA_BaseNPC[],
  ): void {
    for (const other of nearby) {
      if (other === movingTarget || other.IsNull() || !other.IsAlive()) continue;

      const movingIndex = movingTarget.GetEntityIndex();
      const otherIndex = other.GetEntityIndex();
      const pairKey = this.PairKey(movingIndex, otherIndex);
      if (state.collidedPairs.has(pairKey)) continue;
      const collisionRadius = other.IsHero()
        ? state.heroCollisionRadius
        : state.creepCollisionRadius;
      if (this.Distance2D(currentPosition, other.GetAbsOrigin()) > collisionRadius) {
        continue;
      }

      state.collidedPairs.add(pairKey);
      const collisionDamagePct = this.GetSpecialValueFor('collision_damage_pct');
      this.ApplyGreaterBash(state, movingTarget, false, direction, collisionDamagePct);
      if (this.ApplyGreaterBash(state, other, true, direction, collisionDamagePct)) {
        this.AddKnockbackMotion(state, other, direction);
      }
    }
  }

  private GetConfiguredCollisionRadius(hero: boolean): number {
    const greaterBash = this.GetGreaterBash();
    const fallback = hero ? DEFAULT_HERO_HITBOX : DEFAULT_CREEP_HITBOX;
    if (!greaterBash) return fallback;

    const configured = greaterBash.GetSpecialValueFor(
      hero ? 'cascading_bashes_hero_hitbox' : 'cascading_bashes_creep_hitbox',
    );
    return configured > 0 ? configured : fallback;
  }

  private PairKey(first: EntityIndex, second: EntityIndex): string {
    return first < second ? `${first}:${second}` : `${second}:${first}`;
  }

  private ApplyGreaterBash(
    state: ChargeCastState,
    target: CDOTA_BaseNPC,
    applyKnockback: boolean,
    direction: Vector,
    effectPct: number,
  ): boolean {
    if (target.IsNull() || !target.IsAlive()) return false;

    const greaterBash = this.GetGreaterBash();
    if (!greaterBash) return false;

    const bashDamagePct = greaterBash.GetSpecialValueFor('damage');
    const damage = (state.chargeSpeed * bashDamagePct * effectPct) / 10000;
    ApplyDamage({
      victim: target,
      attacker: state.caster,
      damage,
      damage_type: greaterBash.GetAbilityDamageType(),
      ability: greaterBash,
    });

    const stunDuration =
      greaterBash.GetSpecialValueFor('duration') * (1 - target.GetStatusResistance());
    if (stunDuration > 0) {
      target.AddNewModifier(state.caster, greaterBash, 'modifier_stunned', {
        duration: stunDuration,
      });
    }

    const particle = ParticleManager.CreateParticle(
      GREATER_BASH_PARTICLE,
      ParticleAttachment.ABSORIGIN_FOLLOW,
      target,
    );
    ParticleManager.ReleaseParticleIndex(particle);
    target.EmitSound('Hero_Spirit_Breaker.GreaterBash');

    if (!applyKnockback || target.IsCurrentlyHorizontalMotionControlled()) return true;

    const targetOrigin = target.GetAbsOrigin();
    const center = Vector(
      targetOrigin.x - direction.x * 100,
      targetOrigin.y - direction.y * 100,
      targetOrigin.z,
    );
    const knockbackDuration = greaterBash.GetSpecialValueFor('knockback_duration');
    target.AddNewModifier(state.caster, greaterBash, 'modifier_knockback', {
      should_stun: 0,
      knockback_duration: knockbackDuration,
      duration: knockbackDuration,
      knockback_distance: greaterBash.GetSpecialValueFor('knockback_distance'),
      knockback_height: greaterBash.GetSpecialValueFor('knockback_height'),
      center_x: center.x,
      center_y: center.y,
      center_z: center.z,
    });
    return true;
  }

  private GetGreaterBash(): CDOTABaseAbility | undefined {
    const greaterBash = this.GetCaster().FindAbilityByName(GREATER_BASH);
    return greaterBash && !greaterBash.IsNull() && greaterBash.GetLevel() > 0
      ? greaterBash
      : undefined;
  }

  private GetCurrentChargeSpeed(caster: CDOTA_BaseNPC_Hero): number {
    return Math.max(caster.GetIdealSpeedNoSlows() + this.GetSpecialValueFor('movement_speed'), 1);
  }

  private DirectionFromTo(from: Vector, to: Vector): Vector {
    const delta = Vector(to.x - from.x, to.y - from.y, 0);
    return delta.Length2D() > 0 ? delta.Normalized() : Vector(1, 0, 0);
  }

  private Distance2D(first: Vector, second: Vector): number {
    const x = second.x - first.x;
    const y = second.y - first.y;
    return Math.sqrt(x * x + y * y);
  }

  private DestroyCast(state: ChargeCastState): void {
    for (const runner of state.runners.values()) this.DestroyRunner(runner);
    state.runners.clear();
    state.motions.clear();
    this.activeCasts.delete(state.id);
  }
}

@registerModifier('abilities/ts_abilities/spirit_breaker_charge_of_darkness_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_spirit_breaker_charge_of_darkness_awaken extends BaseModifier {
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
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL,
      ModifierFunction.OVERRIDE_ABILITY_SPECIAL_VALUE,
    ];
  }

  GetModifierOverrideAbilitySpecial(event: ModifierOverrideAbilitySpecialEvent): 0 | 1 {
    if (!IsServer()) return 0;
    return event.ability.GetAbilityName() === GREATER_BASH &&
      event.ability_special_value === 'cascading_bashes_damage_multiplier'
      ? 1
      : 0;
  }

  GetModifierOverrideAbilitySpecialValue(event: ModifierOverrideAbilitySpecialEvent): number {
    if (
      event.ability.GetAbilityName() !== GREATER_BASH ||
      event.ability_special_value !== 'cascading_bashes_damage_multiplier'
    ) {
      return event.ability.GetLevelSpecialValueNoOverride(
        event.ability_special_value,
        event.ability_special_level,
      );
    }
    return this.GetAbility()?.GetSpecialValueFor('collision_damage_pct') ?? 100;
  }
}

@registerModifier('abilities/ts_abilities/spirit_breaker_charge_of_darkness_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_spirit_breaker_charge_of_darkness_awaken_body extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ORDER];
  }

  OnOrder(event: ModifierUnitEvent): void {
    if (!IsServer() || event.unit !== this.GetParent()) return;

    switch (event.order_type) {
      case UnitOrder.MOVE_TO_POSITION:
      case UnitOrder.MOVE_TO_TARGET:
      case UnitOrder.MOVE_TO_DIRECTION:
      case UnitOrder.MOVE_RELATIVE:
      case UnitOrder.ATTACK_MOVE:
      case UnitOrder.ATTACK_TARGET:
      case UnitOrder.HOLD_POSITION:
      case UnitOrder.STOP:
      case UnitOrder.PATROL:
      case UnitOrder.PICKUP_ITEM:
      case UnitOrder.PICKUP_RUNE:
        break;
      default:
        return;
    }

    const ability = this.GetAbility() as SpiritBreakerChargeOfDarknessAwaken | undefined;
    ability?.CancelBodyCharge(event.unit);
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: true,
    };
  }
}

@registerModifier('abilities/ts_abilities/spirit_breaker_charge_of_darkness_awaken')
// eslint-disable-next-line @typescript-eslint/naming-convention
export class modifier_spirit_breaker_charge_of_darkness_awaken_shadow extends BaseModifier {
  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.INVULNERABLE]: true,
      [ModifierState.UNSELECTABLE]: true,
      [ModifierState.NO_HEALTH_BAR]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
      [ModifierState.COMMAND_RESTRICTED]: true,
      [ModifierState.DISARMED]: true,
      [ModifierState.SILENCED]: true,
      [ModifierState.MUTED]: true,
      [ModifierState.NOT_ON_MINIMAP]: true,
      [ModifierState.NOT_ON_MINIMAP_FOR_ENEMIES]: true,
      [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: true,
    };
  }

  DeclareFunctions(): ModifierFunction[] {
    return [
      ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
      ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE,
    ];
  }

  GetAbsoluteNoDamageMagical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePhysical(): 0 | 1 {
    return 1;
  }

  GetAbsoluteNoDamagePure(): 0 | 1 {
    return 1;
  }
}
