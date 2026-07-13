import {
  modifier_fountain_attack_percent_damage,
  modifier_fountain_damage_proxy,
  modifier_fountain_damage_statistics,
  modifier_fountain_destructible,
  modifier_fountain_intrusion,
  modifier_fountain_outer_zone,
  modifier_fountain_reward_tracker,
} from '../../modifiers/global/fountain_anti_camp';
import { PlayerHelper } from '../helper/player-helper';

declare global {
  let IsFountainLocked: (this: void, unit: CDOTA_BaseNPC | undefined) => boolean;
}

interface FountainZone {
  fountain: CDOTA_BaseNPC;
  center: Vector;
  innerRadius: number;
  outerRadius: number;
  damageProxy?: CDOTA_BaseNPC;
  hiddenHealth: number;
  lastHealthUpdate: number;
  destroyed: boolean;
}

interface KillRewardContext {
  expiresAt: number;
  multiplier: number;
  killerPlayerId: PlayerID;
}

interface FountainDamageFilterEvent extends DamageFilterEvent {
  damage_flags?: DOTADamageFlag_t;
}

export class FountainAntiCamp {
  private static readonly THINK_TIMER = 'fountain_anti_camp_think';
  private static readonly THINK_INTERVAL = 0.1;
  private static readonly REWARD_CONTEXT_DURATION = 0.25;
  private static readonly FOUNTAIN_MAX_HEALTH = 100000;
  private static readonly FOUNTAIN_HEALTH_REGEN = 1000;
  private static readonly DAMAGE_PROXY_UNIT = 'npc_fountain_damage_proxy';

  private readonly fountains = new Map<DotaTeam, FountainZone>();
  private readonly damageTaken = new Map<PlayerID, number>();
  private readonly rewardContexts: KillRewardContext[] = [];
  private readonly recordedBotDeaths = new Map<number, number>();
  private initialized = false;

  constructor() {
    ListenToGameEvent('game_rules_state_change', () => this.onGameStateChanged(), this);
    ListenToGameEvent('entity_killed', (event) => this.onEntityKilled(event), this);
    GameRules.GetGameModeEntity().SetHealingFilter((event) => this.filterHealing(event), this);
    GameRules.GetGameModeEntity().SetDamageFilter((event) => this.filterDamage(event), this);
    GameRules.GetGameModeEntity().SetExecuteOrderFilter(
      (event) => this.filterExecuteOrder(event),
      this,
    );

    IsFountainLocked = (unit: CDOTA_BaseNPC | undefined): boolean => {
      return this.isUnitFountainLocked(unit);
    };
  }

  IsEnabled(): boolean {
    return GameRules.Option.enableFountainAntiCamp;
  }

  GetDamageTaken(playerId: PlayerID): number {
    return Math.floor(this.damageTaken.get(playerId) ?? 0);
  }

  RecordDamageTaken(victim: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC, damage: number): void {
    if (!this.IsEnabled() || damage <= 0 || !victim.IsRealHero()) return;

    const victimPlayerId = victim.GetPlayerOwnerID();
    if (!PlayerHelper.IsHumanPlayerByPlayerId(victimPlayerId)) return;
    if (this.IsInEnemyFountain(victim)) return;

    const attackerPlayerId = this.getOwningPlayerId(attacker);
    if (attackerPlayerId < 0 || !PlayerResource.IsValidPlayerID(attackerPlayerId)) return;
    if (PlayerResource.GetTeam(attackerPlayerId) === victim.GetTeamNumber()) return;

    this.damageTaken.set(victimPlayerId, (this.damageTaken.get(victimPlayerId) ?? 0) + damage);
  }

  RecordDireBotDeath(victim: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC | undefined): void {
    if (!this.IsEnabled() || !this.isDireBotHero(victim)) return;

    const now = GameRules.GetGameTime();
    const victimEntityIndex = victim.GetEntityIndex();
    const lastRecordedAt = this.recordedBotDeaths.get(victimEntityIndex);
    if (lastRecordedAt !== undefined && now - lastRecordedAt < 0.5) return;
    this.recordedBotDeaths.set(victimEntityIndex, now);

    let multiplier = 1;
    if (this.IsInFountainAttackRange(DotaTeam.BADGUYS, victim)) {
      multiplier = 0;
    }

    if (attacker && IsValidEntity(attacker)) {
      multiplier = Math.min(multiplier, this.getDireZoneMultiplier(attacker.GetAbsOrigin()));

      const ownerHero = this.getOwnerHero(attacker);
      if (ownerHero) {
        multiplier = Math.min(multiplier, this.getDireZoneMultiplier(ownerHero.GetAbsOrigin()));
      }
    }

    if (multiplier >= 1) return;

    this.rewardContexts.push({
      expiresAt: now + FountainAntiCamp.REWARD_CONTEXT_DURATION,
      multiplier,
      killerPlayerId: attacker ? this.getOwningPlayerId(attacker) : (-1 as PlayerID),
    });
    this.pruneRewardContexts(now);
  }

  GetActiveRewardMultiplier(playerId: PlayerID): number {
    if (!this.IsEnabled() || !PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return 1;

    const now = GameRules.GetGameTime();
    this.pruneRewardContexts(now);

    let multiplier = 1;
    for (const context of this.rewardContexts) {
      multiplier = Math.min(multiplier, context.multiplier);
    }
    return multiplier;
  }

  ShouldPreserveZeroRewardKillMessage(playerId: PlayerID): boolean {
    if (!this.IsEnabled() || !PlayerHelper.IsHumanPlayerByPlayerId(playerId)) return false;

    const now = GameRules.GetGameTime();
    this.pruneRewardContexts(now);
    return this.rewardContexts.some(
      (context) => context.multiplier === 0 && context.killerPlayerId === playerId,
    );
  }

  IsInEnemyFountain(unit: CDOTA_BaseNPC): boolean {
    const enemyTeam =
      unit.GetTeamNumber() === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS;
    return this.IsInFountainAttackRange(enemyTeam, unit);
  }

  IsInFountainAttackRange(team: DotaTeam, unitOrPosition: CDOTA_BaseNPC | Vector): boolean {
    const zone = this.fountains.get(team);
    if (!zone) return false;

    const position = this.getPosition(unitOrPosition);
    return this.distance2D(position, zone.center) <= zone.innerRadius;
  }

  IsInOuterZone(team: DotaTeam, unitOrPosition: CDOTA_BaseNPC | Vector): boolean {
    const zone = this.fountains.get(team);
    if (!zone) return false;

    const position = this.getPosition(unitOrPosition);
    return this.distance2D(position, zone.center) <= zone.outerRadius;
  }

  IsInDireOuterZone(unitOrPosition: CDOTA_BaseNPC | Vector): boolean {
    return this.IsInOuterZone(DotaTeam.BADGUYS, unitOrPosition);
  }

  IsFountainDestroyed(team: DotaTeam): boolean {
    return this.fountains.get(team)?.destroyed ?? false;
  }

  OnFountainDestroyed(team: DotaTeam): void {
    const zone = this.fountains.get(team);
    if (!zone || zone.destroyed) return;

    zone.destroyed = true;
    zone.hiddenHealth = 0;
    const damageProxy = zone.damageProxy;
    zone.damageProxy = undefined;
    if (damageProxy) {
      Timers.CreateTimer(0, () => {
        if (IsValidEntity(damageProxy)) {
          UTIL_Remove(damageProxy);
        }
      });
    }

    print(`[FountainAntiCamp] fountain destroyed for team ${team}`);

    for (const hero of HeroList.GetAllHeroes()) {
      this.removeFountainProvidedModifiers(hero, zone.fountain);
    }
  }

  IsUnitLocked(unit: CDOTA_BaseNPC | undefined): boolean {
    return this.isUnitFountainLocked(unit);
  }

  private onGameStateChanged(): void {
    if (GameRules.State_Get() !== GameState.PRE_GAME) return;

    Timers.CreateTimer(0.1, () => {
      this.initializeFountains();
      this.startThinkTimer();
    });
  }

  private initializeFountains(): void {
    if (!this.IsEnabled() || this.initialized) return;

    const fountains = Entities.FindAllByClassname('ent_dota_fountain') as CDOTA_BaseNPC[];
    const forts = Entities.FindAllByClassname('npc_dota_fort') as CDOTA_BaseNPC[];

    for (const fountain of fountains) {
      const team = fountain.GetTeamNumber() as DotaTeam;
      const fort = forts.find((candidate) => candidate.GetTeamNumber() === team);
      const center = fountain.GetAbsOrigin();
      const innerRadius = fountain.Script_GetAttackRange();
      const outerRadius = fort ? this.distance2D(center, fort.GetAbsOrigin()) : innerRadius;

      const zone: FountainZone = {
        fountain,
        center,
        innerRadius,
        outerRadius,
        hiddenHealth: FountainAntiCamp.FOUNTAIN_MAX_HEALTH,
        lastHealthUpdate: GameRules.GetGameTime(),
        destroyed: false,
      };
      this.fountains.set(team, zone);

      if (!fountain.HasModifier(modifier_fountain_destructible.name)) {
        fountain.AddNewModifier(fountain, undefined, modifier_fountain_destructible.name, {});
      }

      zone.damageProxy = this.createDamageProxy(zone);

      this.enableFountainCombat(fountain);

      print(
        `[FountainAntiCamp] initialized team=${team} inner=${innerRadius} outer=${Math.floor(outerRadius)}`,
      );
    }

    this.initialized = this.fountains.size > 0;
  }

  private enableFountainCombat(fountain: CDOTA_BaseNPC): void {
    let splitShot = fountain.FindAbilityByName('tower_split_shot');
    if (!splitShot) {
      splitShot = fountain.AddAbility('tower_split_shot');
    }
    if (splitShot !== undefined) {
      splitShot.SetLevel(4);
      if (!splitShot.GetToggleState()) {
        splitShot.ToggleAbility();
      }
    }

    if (!fountain.HasModifier(modifier_fountain_attack_percent_damage.name)) {
      fountain.AddNewModifier(
        fountain,
        splitShot,
        modifier_fountain_attack_percent_damage.name,
        {},
      );
    }
  }

  private startThinkTimer(): void {
    Timers.RemoveTimer(FountainAntiCamp.THINK_TIMER);
    Timers.CreateTimer(FountainAntiCamp.THINK_TIMER, {
      endTime: FountainAntiCamp.THINK_INTERVAL,
      callback: () => {
        this.onThink();
        return FountainAntiCamp.THINK_INTERVAL;
      },
    });
  }

  private onThink(): void {
    if (!this.initialized) {
      this.initializeFountains();
      return;
    }

    const now = GameRules.GetGameTime();
    for (const zone of this.fountains.values()) {
      if (zone.destroyed) {
        this.removeFountainBuffsFromHeroes(zone.fountain);
      } else {
        this.updateHiddenHealth(zone, now);
      }
    }

    if (!this.IsEnabled()) return;

    PlayerHelper.ForEachPlayer((playerId) => {
      const player = PlayerResource.GetPlayer(playerId);
      const hero = player?.GetAssignedHero();
      if (!hero || !hero.IsRealHero()) return;

      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        this.ensureModifier(hero, modifier_fountain_damage_statistics.name);
        this.updateIntrusionModifier(hero);
      } else if (this.isDireBotHero(hero)) {
        this.ensureModifier(hero, modifier_fountain_reward_tracker.name);
      }
    });
  }

  private updateIntrusionModifier(hero: CDOTA_BaseNPC_Hero): void {
    const enemyTeam =
      hero.GetTeamNumber() === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS;
    const enemyFountain = this.fountains.get(enemyTeam);
    const isInOuterZone =
      enemyFountain !== undefined &&
      !enemyFountain.destroyed &&
      hero.IsAlive() &&
      this.IsInOuterZone(enemyTeam, hero);
    const isInFountain = isInOuterZone && this.IsInFountainAttackRange(enemyTeam, hero);

    if (isInFountain) {
      hero.RemoveModifierByName(modifier_fountain_outer_zone.name);
      this.ensureModifier(
        hero,
        modifier_fountain_intrusion.name,
        enemyFountain.fountain,
        enemyFountain.fountain.FindAbilityByName('fountain_hp_aura'),
      );
    } else if (isInOuterZone) {
      hero.RemoveModifierByName(modifier_fountain_intrusion.name);
      this.ensureModifier(
        hero,
        modifier_fountain_outer_zone.name,
        enemyFountain.fountain,
        enemyFountain.fountain.FindAbilityByName('fountain_hp_aura'),
      );
    } else {
      hero.RemoveModifierByName(modifier_fountain_intrusion.name);
      hero.RemoveModifierByName(modifier_fountain_outer_zone.name);
    }
  }

  private ensureModifier(
    unit: CDOTA_BaseNPC,
    modifierName: string,
    caster: CDOTA_BaseNPC = unit,
    ability?: CDOTABaseAbility,
  ): void {
    if (!unit.HasModifier(modifierName)) {
      unit.AddNewModifier(caster, ability, modifierName, {});
    }
  }

  private filterHealing(event: HealingFilterEvent): boolean {
    const target = EntIndexToHScript(event.entindex_target_const) as CDOTA_BaseNPC | undefined;
    if (target && this.getZoneByDamageProxy(target)) {
      event.heal = 0;
      return true;
    }

    if (this.IsEnabled() && target && this.isUnitFountainLocked(target)) {
      event.heal = 0;
    }
    return true;
  }

  private filterExecuteOrder(event: ExecuteOrderFilterEvent): boolean {
    if (!this.IsEnabled() || !this.isAbilityUseOrder(event.order_type)) return true;

    if (event.entindex_ability > 0) {
      const ability = EntIndexToHScript(event.entindex_ability) as CDOTABaseAbility | undefined;
      const caster = ability?.GetCaster();
      if (caster && this.isUnitOrOwnerLocked(caster)) return false;
    }

    for (const [, entityIndex] of pairs(event.units)) {
      const unit = EntIndexToHScript(entityIndex) as CDOTA_BaseNPC | undefined;
      if (unit && this.isUnitOrOwnerLocked(unit)) return false;
    }

    return true;
  }

  private filterDamage(event: FountainDamageFilterEvent): boolean {
    const victim = EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC | undefined;
    const attacker = EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC | undefined;

    if (attacker && this.shouldBlockLockedUnitDamage(event, attacker)) {
      return false;
    }

    if (
      this.IsEnabled() &&
      victim &&
      this.isDireBotHero(victim) &&
      event.damage > 0 &&
      event.damage >= victim.GetHealth()
    ) {
      this.RecordDireBotDeath(victim, attacker);
    }

    const zone = victim ? this.getZoneByDamageProxy(victim) : undefined;
    if (!zone) return true;
    if (zone.destroyed) return false;

    if (!attacker || attacker.GetTeamNumber() === zone.fountain.GetTeamNumber()) return false;

    this.updateHiddenHealth(zone, GameRules.GetGameTime());
    zone.hiddenHealth = Math.max(0, zone.hiddenHealth - Math.max(0, event.damage));
    if (zone.hiddenHealth <= 0) {
      const modifier = zone.fountain.FindModifierByName(modifier_fountain_destructible.name) as
        | modifier_fountain_destructible
        | undefined;
      modifier?.DestroyFountain();
    }

    return false;
  }

  private createDamageProxy(zone: FountainZone): CDOTA_BaseNPC | undefined {
    const proxy = CreateUnitByName(
      FountainAntiCamp.DAMAGE_PROXY_UNIT,
      zone.center,
      false,
      zone.fountain,
      zone.fountain,
      zone.fountain.GetTeamNumber(),
    );
    if (!proxy) {
      print(
        `[FountainAntiCamp] failed to create damage proxy for team ${zone.fountain.GetTeamNumber()}`,
      );
      return undefined;
    }

    proxy.AddNoDraw();
    proxy.SetIdleAcquire(false);
    proxy.SetAcquisitionRange(0);
    proxy.SetAttackCapability(UnitAttackCapability.NO_ATTACK);
    proxy.AddNewModifier(proxy, undefined, modifier_fountain_damage_proxy.name, {});
    return proxy;
  }

  private getZoneByDamageProxy(unit: CDOTA_BaseNPC): FountainZone | undefined {
    for (const zone of this.fountains.values()) {
      if (zone.damageProxy === unit) return zone;
    }
    return undefined;
  }

  private updateHiddenHealth(zone: FountainZone, now: number): void {
    const elapsed = Math.max(0, now - zone.lastHealthUpdate);
    zone.lastHealthUpdate = now;
    zone.hiddenHealth = Math.min(
      FountainAntiCamp.FOUNTAIN_MAX_HEALTH,
      zone.hiddenHealth + elapsed * FountainAntiCamp.FOUNTAIN_HEALTH_REGEN,
    );
  }

  private onEntityKilled(event: EntityKilledEvent): void {
    if (!this.IsEnabled()) return;

    const victim = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!victim || !this.isDireBotHero(victim)) return;

    const attacker = EntIndexToHScript(event.entindex_attacker) as CDOTA_BaseNPC | undefined;
    this.RecordDireBotDeath(victim, attacker);
  }

  private isAbilityUseOrder(orderType: dotaunitorder_t): boolean {
    switch (orderType) {
      case UnitOrder.CAST_POSITION:
      case UnitOrder.CAST_TARGET:
      case UnitOrder.CAST_TARGET_TREE:
      case UnitOrder.CAST_NO_TARGET:
      case UnitOrder.CAST_TOGGLE:
      case UnitOrder.CAST_TOGGLE_AUTO:
      case UnitOrder.CAST_RUNE:
      case UnitOrder.VECTOR_TARGET_POSITION:
      case UnitOrder.CAST_TOGGLE_ALT:
      case UnitOrder.CONSUME_ITEM:
        return true;
      default:
        return false;
    }
  }

  private shouldBlockLockedUnitDamage(
    event: FountainDamageFilterEvent,
    attacker: CDOTA_BaseNPC,
  ): boolean {
    if (!this.IsEnabled() || event.damage <= 0 || !this.isUnitOrOwnerLocked(attacker)) {
      return false;
    }

    if (event.entindex_inflictor_const !== undefined && event.entindex_inflictor_const > 0) {
      return true;
    }

    const damageFlags = event.damage_flags ?? DamageFlag.NONE;
    return (
      (damageFlags & DamageFlag.REFLECTION) === DamageFlag.REFLECTION ||
      (damageFlags & DamageFlag.SECONDARY_PROJECTILE_ATTACK) ===
        DamageFlag.SECONDARY_PROJECTILE_ATTACK
    );
  }

  private isUnitOrOwnerLocked(unit: CDOTA_BaseNPC): boolean {
    if (this.isUnitFountainLocked(unit)) return true;
    return this.isUnitFountainLocked(this.getOwnerHero(unit));
  }

  private isDireBotHero(unit: CDOTA_BaseNPC | undefined): unit is CDOTA_BaseNPC_Hero {
    return (
      unit !== undefined &&
      unit.IsRealHero() &&
      unit.GetTeamNumber() === DotaTeam.BADGUYS &&
      PlayerHelper.IsBotPlayer(unit)
    );
  }

  private isUnitFountainLocked(unit: CDOTA_BaseNPC | undefined): boolean {
    if (!this.IsEnabled() || !unit || !unit.HasModifier(modifier_fountain_intrusion.name)) {
      return false;
    }

    const modifier = unit.FindModifierByName(modifier_fountain_intrusion.name) as
      | modifier_fountain_intrusion
      | undefined;
    return modifier !== undefined && modifier.GetElapsedTime() >= 5;
  }

  private getDireZoneMultiplier(position: Vector): number {
    if (this.IsInFountainAttackRange(DotaTeam.BADGUYS, position)) return 0;
    if (this.IsInDireOuterZone(position)) return 0.1;
    return 1;
  }

  private getOwningPlayerId(unit: CDOTA_BaseNPC): PlayerID {
    const directPlayerId = unit.GetPlayerOwnerID();
    if (directPlayerId >= 0) return directPlayerId;

    const ownerHero = this.getOwnerHero(unit);
    return ownerHero?.GetPlayerOwnerID() ?? (-1 as PlayerID);
  }

  private getOwnerHero(unit: CDOTA_BaseNPC): CDOTA_BaseNPC_Hero | undefined {
    if (unit.IsRealHero()) return unit as CDOTA_BaseNPC_Hero;

    const owner = unit.GetOwnerEntity();
    if (owner?.IsBaseNPC() && owner.IsRealHero()) return owner as CDOTA_BaseNPC_Hero;

    const playerId = unit.GetPlayerOwnerID();
    if (playerId >= 0) {
      return PlayerResource.GetSelectedHeroEntity(playerId) ?? undefined;
    }
    return undefined;
  }

  private removeFountainBuffsFromHeroes(fountain: CDOTA_BaseNPC): void {
    for (const hero of HeroList.GetAllHeroes()) {
      this.removeFountainProvidedModifiers(hero, fountain);
    }
  }

  private removeFountainProvidedModifiers(unit: CDOTA_BaseNPC, fountain: CDOTA_BaseNPC): void {
    for (const modifier of unit.FindAllModifiers()) {
      if (modifier.GetCaster() === fountain) {
        unit.RemoveModifierByNameAndCaster(modifier.GetName(), fountain);
      }
    }
  }

  private pruneRewardContexts(now: number): void {
    for (let i = this.rewardContexts.length - 1; i >= 0; i--) {
      if (this.rewardContexts[i].expiresAt < now) {
        this.rewardContexts.splice(i, 1);
      }
    }
  }

  private getPosition(unitOrPosition: CDOTA_BaseNPC | Vector): Vector {
    const possiblePosition = unitOrPosition as Vector;
    if (possiblePosition.x !== undefined && possiblePosition.y !== undefined) {
      return possiblePosition;
    }
    return (unitOrPosition as CDOTA_BaseNPC).GetAbsOrigin();
  }

  private distance2D(first: Vector, second: Vector): number {
    const dx = first.x - second.x;
    const dy = first.y - second.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
