import { PlayerHelper } from '../helper/player-helper';
import {
  advanceTrackingProjectile,
  getRetaliationHealthAfterHit,
  isInsideFountainArea,
} from '../../abilities/ts_abilities/fountain-anti-camp-logic';

const CONFIGURATION_TIMEOUT = 3;
const RETALIATION_PROJECTILE = 'particles/base_attacks/ranged_tower_good.vpcf';
const RETALIATION_HIT_RADIUS = 128;
const RETALIATION_MAX_TRAVEL_TIME = 20;
// Some Tools runtimes omit these DamageFlag Lua globals and crash while loading the module.
// Keep the engine bit values local so ApplyDamage and ModifyHealth receive the intended flags.
const RETALIATION_DAMAGE_FLAGS = (4 + 32 + 512 + 1024 + 4096 + 524288 + 1048576) as DamageFlag;

interface RetaliationProjectile {
  target: CDOTA_BaseNPC_Hero;
  ability: CDOTABaseAbility;
  damage: number;
  speed: number;
  position: { x: number; y: number };
  createdAt: number;
  lastUpdateAt: number;
}

export class FountainAntiCamp {
  private fountain: CDOTA_BaseNPC | undefined;
  private ability: CDOTABaseAbility | undefined;
  private radius = 0;
  private configuredAt = -1;
  private retaliationProjectiles = new Map<ProjectileID, RetaliationProjectile>();

  constructor() {
    ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
  }

  Configure(fountain: CDOTA_BaseNPC, ability: CDOTABaseAbility, radius: number): void {
    if (fountain.IsNull() || ability.IsNull() || radius <= 0) return;

    this.fountain = fountain;
    this.ability = ability;
    this.radius = radius;
    this.configuredAt = GameRules.GetGameTime();
  }

  Disable(fountain: CDOTA_BaseNPC): void {
    if (this.fountain !== fountain) return;

    this.fountain = undefined;
    this.ability = undefined;
    this.radius = 0;
    this.configuredAt = -1;
  }

  private IsUnitInside(unit: CDOTA_BaseNPC): boolean {
    const fountain = this.GetActiveFountain();
    if (!fountain) return false;

    return isInsideFountainArea(unit.GetAbsOrigin(), fountain.GetAbsOrigin(), this.radius);
  }

  private IsProtectedAiHero(unit: CDOTA_BaseNPC | undefined): unit is CDOTA_BaseNPC_Hero {
    const fountain = this.GetActiveFountain();
    return (
      unit !== undefined &&
      !unit.IsNull() &&
      unit.IsRealHero() &&
      PlayerHelper.IsBotPlayerByPlayerId(unit.GetPlayerOwnerID()) &&
      fountain !== undefined &&
      unit.GetTeamNumber() === fountain.GetTeamNumber()
    );
  }

  private OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const victim = this.GetBaseNpc(keys.entindex_killed);
    if (!this.IsProtectedAiHero(victim) || !this.IsUnitInside(victim)) return;

    const attacker = this.GetBaseNpc(keys.entindex_attacker);
    const target = this.ResolveHumanOwnerHero(attacker);
    if (!target || !target.IsAlive()) return;

    this.LaunchRetaliation(victim, target);
  }

  private LaunchRetaliation(victim: CDOTA_BaseNPC_Hero, target: CDOTA_BaseNPC_Hero): void {
    const fountain = this.GetActiveFountain();
    const ability = this.ability;
    if (!fountain || !ability || ability.IsNull()) return;

    const damagePct = ability.GetSpecialValueFor('retaliation_damage_pct');
    const projectileSpeed = ability.GetSpecialValueFor('retaliation_projectile_speed');
    if (damagePct <= 0 || projectileSpeed <= 0) return;

    const sourceLocation = victim.GetAbsOrigin();
    const createdAt = GameRules.GetGameTime();
    const projectileId = ProjectileManager.CreateTrackingProjectile({
      Target: target,
      Source: fountain,
      Ability: ability,
      EffectName: RETALIATION_PROJECTILE,
      iMoveSpeed: projectileSpeed,
      vSourceLoc: sourceLocation,
      bDodgeable: false,
      bIgnoreObstructions: true,
      bSuppressTargetCheck: true,
    });

    this.retaliationProjectiles.set(projectileId, {
      target,
      ability,
      damage: target.GetMaxHealth() * damagePct * 0.01,
      speed: projectileSpeed,
      position: { x: sourceLocation.x, y: sourceLocation.y },
      createdAt,
      lastUpdateAt: createdAt,
    });
    Timers.CreateTimer(FrameTime(), () => this.TrackRetaliationProjectile(projectileId));
  }

  private TrackRetaliationProjectile(projectileId: ProjectileID): number | void {
    const projectile = this.retaliationProjectiles.get(projectileId);
    if (!projectile) return undefined;

    const target = projectile.target;
    if (target.IsNull() || !target.IsAlive()) {
      this.DestroyRetaliationProjectile(projectileId);
      return undefined;
    }

    const now = GameRules.GetGameTime();
    const targetLocation = target.GetAbsOrigin();
    const step = advanceTrackingProjectile(
      projectile.position,
      { x: targetLocation.x, y: targetLocation.y },
      projectile.speed * Math.max(FrameTime(), now - projectile.lastUpdateAt),
      RETALIATION_HIT_RADIUS,
    );
    projectile.position = step.position;
    projectile.lastUpdateAt = now;

    const timedOut = now - projectile.createdAt >= RETALIATION_MAX_TRAVEL_TIME;
    if (!step.reached && !timedOut) return FrameTime();

    this.DestroyRetaliationProjectile(projectileId);
    this.ApplyRetaliation(target, projectile.damage, projectile.ability);
    return undefined;
  }

  private DestroyRetaliationProjectile(projectileId: ProjectileID): void {
    this.retaliationProjectiles.delete(projectileId);
    ProjectileManager.DestroyTrackingProjectile(projectileId);
  }

  private ApplyRetaliation(
    target: CDOTA_BaseNPC_Hero,
    damage: number,
    ability: CDOTABaseAbility,
  ): void {
    const fountain = this.GetActiveFountain();
    if (!fountain || target.IsNull() || !target.IsAlive() || damage <= 0) return;

    const healthAfterHit = getRetaliationHealthAfterHit(target.GetHealth(), damage);
    ApplyDamage({
      victim: target,
      attacker: fountain,
      damage,
      damage_type: DamageTypes.PURE,
      damage_flags: RETALIATION_DAMAGE_FLAGS,
      ability,
    });

    // 反击伤害是固定值，任何减伤都不应生效，实际扣血不足时直接补齐。
    if (target.IsAlive() && target.GetHealth() > healthAfterHit) {
      target.ModifyHealth(healthAfterHit, ability, true, RETALIATION_DAMAGE_FLAGS);
    }
  }

  private GetActiveFountain(): CDOTA_BaseNPC | undefined {
    const fountain = this.fountain;
    const ability = this.ability;
    if (!fountain || fountain.IsNull() || !ability || ability.IsNull() || this.radius <= 0) {
      return undefined;
    }
    if (GameRules.GetGameTime() - this.configuredAt > CONFIGURATION_TIMEOUT) return undefined;
    return fountain;
  }

  private GetBaseNpc(entityIndex: EntityIndex | undefined): CDOTA_BaseNPC | undefined {
    if (!entityIndex || entityIndex <= 0) return undefined;

    const entity = EntIndexToHScript(entityIndex);
    if (!entity || entity.IsNull() || !entity.IsBaseNPC()) return undefined;
    return entity;
  }

  private ResolveHumanOwnerHero(unit: CDOTA_BaseNPC | undefined): CDOTA_BaseNPC_Hero | undefined {
    const playerId = this.ResolveOwnerPlayerId(unit);
    if (playerId === undefined || !PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
      return undefined;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    return hero && !hero.IsNull() && hero.IsRealHero() ? hero : undefined;
  }

  private ResolveOwnerPlayerId(unit: CDOTA_BaseNPC | undefined): PlayerID | undefined {
    let current: CBaseEntity | undefined = unit;
    const visited = new Set<EntityIndex>();

    for (let depth = 0; current && depth < 8; depth++) {
      if (current.IsNull()) return undefined;

      const entityIndex = current.entindex();
      if (visited.has(entityIndex)) return undefined;
      visited.add(entityIndex);

      if (current.IsBaseNPC()) {
        const playerId = current.GetPlayerOwnerID();
        if (PlayerResource.IsValidPlayerID(playerId) && PlayerResource.IsValidPlayer(playerId)) {
          return playerId;
        }
      }

      const owner = current.GetOwnerEntity();
      if (!owner || owner === current) return undefined;
      current = owner;
    }

    return undefined;
  }
}
