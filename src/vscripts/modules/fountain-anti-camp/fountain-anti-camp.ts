import { PlayerHelper } from '../helper/player-helper';
import {
  advanceTrackingProjectile,
  captureLatestRewardValues,
  clampExcludedDamage,
  FountainRewardValues,
  getRetaliationHealthAfterHit,
  isInsideFountainArea,
  shouldArmRewardSuppression,
} from '../../abilities/ts_abilities/fountain-anti-camp-logic';

const REWARD_SCAN_INTERVAL = 0.1;
const REWARD_SUPPRESSION_DURATION = 0.5;
const CONFIGURATION_TIMEOUT = 3;
const RETALIATION_PROJECTILE = 'particles/base_attacks/ranged_tower_good.vpcf';
const RETALIATION_HIT_RADIUS = 128;
const RETALIATION_MAX_TRAVEL_TIME = 20;
// Some Tools runtimes omit these DamageFlag Lua globals and crash while loading the module.
// Keep the engine bit values local so ApplyDamage and ModifyHealth receive the intended flags.
const RETALIATION_DAMAGE_FLAGS = (4 + 32 + 512 + 1024 + 4096 + 524288 + 1048576) as DamageFlag;

interface ProtectedHeroRewards {
  hero: CDOTA_BaseNPC_Hero;
  saved: FountainRewardValues;
}

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
  private protectedHeroRewards = new Map<EntityIndex, ProtectedHeroRewards>();
  private rewardSuppressionCandidates = new Map<EntityIndex, number>();
  private retaliationProjectiles = new Map<ProjectileID, RetaliationProjectile>();
  private excludedHeroDamage = new Map<PlayerID, number>();
  private excludedDamageTaken = new Map<PlayerID, number>();

  constructor() {
    GameRules.GetGameModeEntity().SetDamageFilter((args) => this.FilterDamage(args), this);
    ListenToGameEvent('entity_hurt', (keys) => this.OnEntityHurt(keys), this);
    ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
    Timers.CreateTimer(() => this.ScanProtectedHeroes());
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
    this.RestoreAllHeroRewards();
  }

  IsUnitInside(unit: CDOTA_BaseNPC): boolean {
    const fountain = this.GetActiveFountain();
    if (!fountain) return false;

    return isInsideFountainArea(unit.GetAbsOrigin(), fountain.GetAbsOrigin(), this.radius);
  }

  IsProtectedAiHero(unit: CDOTA_BaseNPC | undefined): unit is CDOTA_BaseNPC_Hero {
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

  ShouldSuppressRewardsForVictim(victim: CDOTA_BaseNPC | undefined): victim is CDOTA_BaseNPC_Hero {
    return this.IsProtectedAiHero(victim) && this.IsUnitInside(victim);
  }

  ShouldSuppressGoldReward(playerId: PlayerID, reason: ModifyGoldReason): boolean {
    if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return false;
    if (reason !== ModifyGoldReason.HERO_KILL && reason !== ModifyGoldReason.SHARED_GOLD) {
      return false;
    }
    return this.HasActiveRewardSuppression();
  }

  ShouldSuppressExperienceReward(playerId: PlayerID, reason: ModifyXpReason): boolean {
    if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return false;
    if (reason !== ModifyXpReason.HERO_KILL) return false;
    return this.HasActiveRewardSuppression();
  }

  GetFinalHeroDamage(playerId: PlayerID, engineDamage: number): number {
    return clampExcludedDamage(engineDamage, this.excludedHeroDamage.get(playerId) ?? 0);
  }

  GetFinalDamageTaken(playerId: PlayerID, engineDamage: number): number {
    return clampExcludedDamage(engineDamage, this.excludedDamageTaken.get(playerId) ?? 0);
  }

  private FilterDamage(args: DamageFilterEvent): boolean {
    const victim = this.GetBaseNpc(args.entindex_victim_const);
    if (this.ShouldSuppressRewardsForVictim(victim)) {
      this.ProtectHeroRewards(victim);
      if (shouldArmRewardSuppression(victim.GetHealth(), args.damage)) {
        this.ArmRewardSuppression(victim);
      }
    }
    return true;
  }

  private OnEntityHurt(keys: GameEventProvidedProperties & EntityHurtEvent): void {
    const victim = this.GetBaseNpc(keys.entindex_killed);
    const attacker = this.GetBaseNpc(keys.entindex_attacker);
    if (!victim || keys.damage <= 0) return;

    if (this.ShouldSuppressRewardsForVictim(victim)) {
      this.ProtectHeroRewards(victim);

      const ownerHero = this.ResolveHumanOwnerHero(attacker);
      if (ownerHero) {
        this.AddExcludedHeroDamage(ownerHero.GetPlayerOwnerID(), keys.damage);
      }
    }

    if (!victim.IsRealHero() || !PlayerHelper.IsHumanPlayer(victim)) return;
    if (!this.IsUnitInside(victim) || !attacker) return;
    if (attacker.GetTeamNumber() === victim.GetTeamNumber()) return;

    const ability = this.ability;
    if (ability && keys.entindex_inflictor === ability.entindex()) return;

    const attackerPlayerId = this.ResolveOwnerPlayerId(attacker);
    if (attackerPlayerId === undefined) return;
    if (PlayerHelper.IsHumanPlayerByPlayerId(attackerPlayerId)) return;

    this.AddExcludedDamageTaken(victim.GetPlayerOwnerID(), keys.damage);
  }

  private OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const victim = this.GetBaseNpc(keys.entindex_killed);
    if (!this.ShouldSuppressRewardsForVictim(victim)) return;

    this.ProtectHeroRewards(victim);
    this.ArmRewardSuppression(victim);
    const attacker = this.GetBaseNpc(keys.entindex_attacker);
    const target = this.ResolveHumanOwnerHero(attacker);
    if (!target || !target.IsAlive()) return;

    this.LaunchRetaliation(victim, target);
  }

  private ScanProtectedHeroes(): number {
    if (!this.GetActiveFountain()) {
      this.RestoreAllHeroRewards();
      return REWARD_SCAN_INTERVAL;
    }

    const seen = new Set<EntityIndex>();
    for (const hero of HeroList.GetAllHeroes()) {
      if (!this.IsProtectedAiHero(hero)) continue;

      const entityIndex = hero.entindex();
      seen.add(entityIndex);
      if (this.IsUnitInside(hero)) {
        this.ProtectHeroRewards(hero);
      } else {
        this.RestoreHeroRewards(entityIndex);
      }
    }

    for (const [entityIndex, state] of this.protectedHeroRewards) {
      if (state.hero.IsNull() || !seen.has(entityIndex)) {
        this.protectedHeroRewards.delete(entityIndex);
      }
    }

    return REWARD_SCAN_INTERVAL;
  }

  private ArmRewardSuppression(victim: CDOTA_BaseNPC_Hero): void {
    this.rewardSuppressionCandidates.set(
      victim.entindex(),
      GameRules.GetGameTime() + REWARD_SUPPRESSION_DURATION,
    );
  }

  private HasActiveRewardSuppression(): boolean {
    const now = GameRules.GetGameTime();
    let active = false;
    for (const [entityIndex, expiresAt] of this.rewardSuppressionCandidates) {
      if (expiresAt < now) {
        this.rewardSuppressionCandidates.delete(entityIndex);
      } else {
        active = true;
      }
    }
    return active;
  }

  private ProtectHeroRewards(hero: CDOTA_BaseNPC_Hero): void {
    const entityIndex = hero.entindex();
    const current = this.ReadHeroRewards(hero);
    const existing = this.protectedHeroRewards.get(entityIndex);
    const saved = existing ? captureLatestRewardValues(existing.saved, current) : current;

    this.protectedHeroRewards.set(entityIndex, { hero, saved });
    if (current.minimumGold !== 0) hero.SetMinimumGoldBounty(0);
    if (current.maximumGold !== 0) hero.SetMaximumGoldBounty(0);
    if (current.deathXp !== 0) hero.SetCustomDeathXP(0);
  }

  private RestoreHeroRewards(entityIndex: EntityIndex): void {
    const state = this.protectedHeroRewards.get(entityIndex);
    if (!state) return;

    this.protectedHeroRewards.delete(entityIndex);
    const hero = state.hero;
    if (hero.IsNull()) return;

    const saved = captureLatestRewardValues(state.saved, this.ReadHeroRewards(hero));
    hero.SetMinimumGoldBounty(saved.minimumGold);
    hero.SetMaximumGoldBounty(saved.maximumGold);
    hero.SetCustomDeathXP(saved.deathXp);
  }

  private RestoreAllHeroRewards(): void {
    const entityIndexes: EntityIndex[] = [];
    for (const [entityIndex] of this.protectedHeroRewards) {
      entityIndexes.push(entityIndex);
    }
    for (const entityIndex of entityIndexes) {
      this.RestoreHeroRewards(entityIndex);
    }
  }

  private ReadHeroRewards(hero: CDOTA_BaseNPC_Hero): FountainRewardValues {
    return {
      minimumGold: hero.GetMinimumGoldBounty(),
      maximumGold: hero.GetMaximumGoldBounty(),
      deathXp: hero.GetDeathXP(),
    };
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

    const healthBeforeHit = target.GetHealth();
    const healthAfterHit = getRetaliationHealthAfterHit(healthBeforeHit, damage);
    ApplyDamage({
      victim: target,
      attacker: fountain,
      damage,
      damage_type: DamageTypes.PURE,
      damage_flags: RETALIATION_DAMAGE_FLAGS,
      ability,
    });

    if (target.IsAlive() && target.GetHealth() > healthAfterHit) {
      target.ModifyHealth(healthAfterHit, ability, true, RETALIATION_DAMAGE_FLAGS);
    }

    const remainingHealth = target.IsAlive() ? target.GetHealth() : 0;
    this.AddExcludedDamageTaken(
      target.GetPlayerOwnerID(),
      Math.max(0, healthBeforeHit - remainingHealth),
    );
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

  private AddExcludedHeroDamage(playerId: PlayerID, damage: number): void {
    if (!PlayerResource.IsValidPlayerID(playerId) || damage <= 0) return;
    this.excludedHeroDamage.set(playerId, (this.excludedHeroDamage.get(playerId) ?? 0) + damage);
  }

  private AddExcludedDamageTaken(playerId: PlayerID, damage: number): void {
    if (!PlayerResource.IsValidPlayerID(playerId) || damage <= 0) return;
    this.excludedDamageTaken.set(playerId, (this.excludedDamageTaken.get(playerId) ?? 0) + damage);
  }
}
