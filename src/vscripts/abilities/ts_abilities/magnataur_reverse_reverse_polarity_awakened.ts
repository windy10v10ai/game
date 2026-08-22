import {
  BaseAbility,
  BaseModifier,
  BaseModifierMotionHorizontal,
  registerAbility,
  registerModifier,
} from '../../utils/dota_ts_adapter';
import {
  finishRecastWindow,
  getRadialDestination,
  isTerrainCollision,
  registerCollision,
  RecastFinishReason,
  RecastWindowState,
  shouldRestoreDelayedCooldown,
  startRecastWindow,
} from './magnataur-reverse-reverse-polarity-logic';

const SCRIPT_PATH = 'abilities/ts_abilities/magnataur_reverse_reverse_polarity_awakened';
const FIRST_CAST = 'magnataur_reverse_polarity_awakened';
const RECAST = 'magnataur_reverse_reverse_polarity_awakened';
const RECAST_ICON = 'magnataur_reversed_reverse_polarity';

function applyPolarityEffect(
  caster: CDOTA_BaseNPC,
  target: CDOTA_BaseNPC,
  firstCast: CDOTABaseAbility,
): void {
  ApplyDamage({
    victim: target,
    attacker: caster,
    ability: firstCast,
    damage: firstCast.GetSpecialValueFor('polarity_damage'),
    damage_type: DamageTypes.PURE,
  });
  target.AddNewModifier(caster, firstCast, 'modifier_stunned', {
    duration:
      firstCast.GetSpecialValueFor('hero_stun_duration') * (1 - target.GetStatusResistance()),
  });
}

@registerAbility(RECAST)
export class MagnataurReverseReversePolarityAwakened extends BaseAbility {
  GetIntrinsicModifierName(): string {
    return modifier_magnataur_reverse_reverse_polarity_controller.name;
  }

  GetAOERadius(): number {
    return this.GetSpecialValueFor('push_radius');
  }

  OnSpellStart(): void {
    if (!IsServer()) return;

    const caster = this.GetCaster();
    const window = modifier_magnataur_reverse_reverse_polarity_window.find_on(caster);
    if (window !== undefined) window.finish('cast');

    const center = caster.GetAbsOrigin();
    const enemies = FindUnitsInRadius(
      caster.GetTeamNumber(),
      center,
      undefined,
      this.GetSpecialValueFor('push_radius'),
      UnitTargetTeam.ENEMY,
      UnitTargetType.HERO + UnitTargetType.BASIC,
      UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );

    EmitSoundOn('Hero_Magnataur.ReversePolarity.Cast', caster);
    const particle = ParticleManager.CreateParticle(
      'particles/units/heroes/hero_magnataur/magnataur_reverse_polarity_push.vpcf',
      ParticleAttachment.WORLDORIGIN,
      caster,
    );
    ParticleManager.SetParticleControl(particle, 0, center);
    ParticleManager.ReleaseParticleIndex(particle);

    const firstCast = caster.FindAbilityByName(FIRST_CAST);
    for (const enemy of enemies) {
      if (firstCast) applyPolarityEffect(caster, enemy, firstCast);
      modifier_magnataur_reverse_reverse_polarity_motion.apply(enemy, caster, this, {
        center_x: center.x,
        center_y: center.y,
        center_z: center.z,
        duration: this.GetSpecialValueFor('push_duration'),
      });
    }
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_magnataur_reverse_reverse_polarity_controller extends BaseModifier {
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
    this.GetAbility()?.SetHidden(true);
  }

  DeclareFunctions(): ModifierFunction[] {
    return [ModifierFunction.ON_ABILITY_FULLY_CAST];
  }

  OnAbilityFullyCast(event: ModifierAbilityEvent): void {
    if (!IsServer()) return;
    const caster = this.GetParent();
    if (event.unit !== caster || event.ability?.GetAbilityName() !== FIRST_CAST) return;

    const firstCast = event.ability;
    const delayedCooldown = firstCast.GetEffectiveCooldown(firstCast.GetLevel() - 1);
    modifier_magnataur_reverse_reverse_polarity_window.apply(caster, caster, this.GetAbility(), {
      cooldown: delayedCooldown,
      duration: this.GetAbility()?.GetSpecialValueFor('recast_window') ?? 3,
    });
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_magnataur_reverse_reverse_polarity_window extends BaseModifier {
  private state: RecastWindowState = startRecastWindow();
  private delayedCooldown = 0;

  IsHidden(): boolean {
    return false;
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return true;
  }

  GetTexture(): string {
    return RECAST_ICON;
  }

  OnCreated(params: { cooldown?: number }): void {
    if (!IsServer()) return;
    this.delayedCooldown = params.cooldown ?? 0;
    const caster = this.GetParent();
    const firstCast = caster.FindAbilityByName(FIRST_CAST);
    const recast = caster.FindAbilityByName(RECAST);
    if (!firstCast || !recast) {
      this.Destroy();
      return;
    }

    recast.SetLevel(firstCast.GetLevel());
    recast.SetHidden(false);
    caster.SwapAbilities(FIRST_CAST, RECAST, false, true);
  }

  finish(reason: RecastFinishReason): void {
    if (this.state.cooldownStarted) return;
    this.state = finishRecastWindow(this.state, reason);
    this.Destroy();
  }

  OnDestroy(): void {
    if (!IsServer()) return;

    const caster = this.GetParent();
    if (!this.state.cooldownStarted) {
      this.state = finishRecastWindow(this.state, caster.IsAlive() ? 'expired' : 'death');
    }
    const firstCast = caster.FindAbilityByName(FIRST_CAST);
    const recast = caster.FindAbilityByName(RECAST);
    if (firstCast && recast) {
      const shouldRestoreCooldown = shouldRestoreDelayedCooldown(
        firstCast.GetCooldownTimeRemaining(),
      );
      caster.SwapAbilities(RECAST, FIRST_CAST, false, true);
      recast.SetHidden(true);
      if (shouldRestoreCooldown) {
        firstCast.EndCooldown();
        const cooldown =
          this.delayedCooldown > 0
            ? this.delayedCooldown
            : firstCast.GetEffectiveCooldown(firstCast.GetLevel() - 1);
        firstCast.StartCooldown(cooldown);
      }
    }
  }
}

@registerModifier(SCRIPT_PATH)
export class modifier_magnataur_reverse_reverse_polarity_motion extends BaseModifierMotionHorizontal {
  private center = Vector(0, 0, 0);
  private destination = Vector(0, 0, 0);
  private speed = 0;
  private collisionRadius = 0;
  private collided = false;

  IsHidden(): boolean {
    return true;
  }

  IsPurgable(): boolean {
    return false;
  }

  GetPriority(): ModifierPriority {
    return ModifierPriority.HIGH;
  }

  CheckState(): Partial<Record<ModifierState, boolean>> {
    return {
      [ModifierState.STUNNED]: true,
      [ModifierState.NO_UNIT_COLLISION]: true,
    };
  }

  OnCreated(params: { center_x?: number; center_y?: number; center_z?: number }): void {
    if (!IsServer()) return;
    const ability = this.GetAbility();
    const caster = this.GetCaster();
    if (!ability || !caster) {
      this.Destroy();
      return;
    }

    this.center = Vector(params.center_x ?? 0, params.center_y ?? 0, params.center_z ?? 0);
    const origin = this.GetParent().GetAbsOrigin();
    const forward = caster.GetForwardVector();
    const destination = getRadialDestination(
      { x: this.center.x, y: this.center.y },
      { x: origin.x, y: origin.y },
      ability.GetSpecialValueFor('push_distance'),
      { x: forward.x, y: forward.y },
    );
    this.destination = GetGroundPosition(
      Vector(destination.x, destination.y, origin.z),
      this.GetParent(),
    );
    this.speed =
      this.distance2D(origin, this.destination) / ability.GetSpecialValueFor('push_duration');
    this.collisionRadius = ability.GetSpecialValueFor('collision_radius');

    if (!this.ApplyHorizontalMotionController()) this.Destroy();
  }

  UpdateHorizontalMotion(parent: CDOTA_BaseNPC, dt: number): void {
    const origin = parent.GetAbsOrigin();
    const deltaX = this.destination.x - origin.x;
    const deltaY = this.destination.y - origin.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance <= this.speed * dt) {
      if (this.hitsObstacleAlong(origin, this.destination)) {
        this.settleCollision();
      } else {
        parent.SetAbsOrigin(this.destination);
      }
      this.Destroy();
      return;
    }

    const step = this.speed * dt;
    const next = GetGroundPosition(
      Vector(
        origin.x + (deltaX / distance) * step,
        origin.y + (deltaY / distance) * step,
        origin.z,
      ),
      parent,
    );
    if (this.hitsObstacleAlong(origin, next)) {
      this.settleCollision();
      this.Destroy();
      return;
    }

    parent.SetAbsOrigin(next);
  }

  OnHorizontalMotionInterrupted(): void {
    if (!IsServer()) return;
    this.Destroy();
  }

  OnDestroy(): void {
    if (!IsServer()) return;
    const parent = this.GetParent();
    parent.RemoveHorizontalMotionController(this);
    ResolveNPCPositions(parent.GetAbsOrigin(), this.collisionRadius);
  }

  private hitsObstacle(position: Vector): boolean {
    const parent = this.GetParent();
    if (
      isTerrainCollision(
        GridNav.IsTraversable(position),
        GridNav.IsBlocked(position),
        GridNav.IsNearbyTree(position, this.collisionRadius, true),
        position.z - parent.GetAbsOrigin().z,
        32,
      )
    ) {
      return true;
    }

    const caster = this.GetCaster();
    const units = FindUnitsInRadius(
      parent.GetTeamNumber(),
      position,
      undefined,
      this.collisionRadius,
      UnitTargetTeam.BOTH,
      UnitTargetType.ALL,
      UnitTargetFlags.INVULNERABLE + UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
      FindOrder.ANY,
      false,
    );
    return units.some(
      (unit) =>
        unit !== parent &&
        unit !== caster &&
        !unit.HasModifier(modifier_magnataur_reverse_reverse_polarity_motion.name),
    );
  }

  private hitsObstacleAlong(origin: Vector, destination: Vector): boolean {
    const distance = this.distance2D(origin, destination);
    const sampleStep = Math.max(24, this.collisionRadius * 0.5);
    const samples = Math.max(1, Math.ceil(distance / sampleStep));
    for (let index = 1; index <= samples; index++) {
      const progress = index / samples;
      const sample = GetGroundPosition(
        Vector(
          origin.x + (destination.x - origin.x) * progress,
          origin.y + (destination.y - origin.y) * progress,
          origin.z,
        ),
        this.GetParent(),
      );
      if (this.hitsObstacle(sample)) return true;
    }
    return false;
  }

  private settleCollision(): void {
    const collision = registerCollision(this.collided);
    this.collided = collision.collided;
    if (!collision.shouldSettle) return;

    const parent = this.GetParent();
    const caster = this.GetCaster();
    const firstCast = caster?.FindAbilityByName(FIRST_CAST);
    if (!caster || !firstCast) return;

    applyPolarityEffect(caster, parent, firstCast);

    const particle = ParticleManager.CreateParticle(
      'particles/units/heroes/hero_magnataur/magnataur_reverse_polarity_push.vpcf',
      ParticleAttachment.ABSORIGIN,
      parent,
    );
    ParticleManager.ReleaseParticleIndex(particle);
    EmitSoundOn('Hero_Magnataur.ReversePolarity.Stun', parent);
  }

  private distance2D(a: Vector, b: Vector): number {
    const x = b.x - a.x;
    const y = b.y - a.y;
    return Math.sqrt(x * x + y * y);
  }
}
