import { ChallengeMetric } from '../../../common/dto/daily-challenge';
import {
  DailyChallengeMetricAccumulator,
  dailyChallengeMetricAccumulator,
} from './daily-challenge-accumulator';
import {
  DailyChallengeDamageEvent,
  DailyChallengeDamageEventListener,
  setDailyChallengeDamageEventListener,
} from './daily-challenge-damage-event';
import {
  DailyChallengeDurationMetric,
  DailyChallengeModifierClassifierConstants,
  classifyDailyChallengeModifier,
} from './daily-challenge-modifier-classifier';
import {
  DailyChallengeOwnedEntity,
  DailyChallengeOwnershipDependencies,
  resolveDailyChallengeHumanPlayerId,
} from './daily-challenge-ownership';

const SCAN_INTERVAL_SECONDS = 0.25;
const MAX_SCAN_DELTA_SECONDS = 1;

export interface DailyChallengeTelemetryEntity extends DailyChallengeOwnedEntity {
  GetEntityIndex: () => EntityIndex;
  GetTeamNumber?: () => DOTATeam_t;
  IsRealHero?: () => boolean;
  IsIllusion?: () => boolean;
  IsAlive?: () => boolean;
  IsReincarnating?: () => boolean;
  GetUnitName?: () => string;
  FindAllModifiers?: () => CDOTA_Buff[];
}

type DailyChallengeTelemetryEventName = 'entity_killed' | 'game_rules_state_change';

type DailyChallengeTelemetryEvent = Record<string, number>;

export interface DailyChallengeTelemetryDependencies extends DailyChallengeOwnershipDependencies {
  register: (
    eventName: DailyChallengeTelemetryEventName,
    listener: (event: DailyChallengeTelemetryEvent) => void,
  ) => void;
  registerDamageObserver: (listener: DailyChallengeDamageEventListener) => void;
  schedule: (seconds: number, callback: () => number | void) => void;
  getGameTime: () => number;
  getGameState: () => number;
  entityFromIndex: (index: number) => DailyChallengeTelemetryEntity | undefined;
  getBotHeroes: () => DailyChallengeTelemetryEntity[];
  getPlayerTeam: (playerId: PlayerID) => DOTATeam_t;
}

function createDefaultDependencies(): DailyChallengeTelemetryDependencies {
  return {
    register: (eventName, listener) => {
      ListenToGameEvent(
        eventName,
        (event) => listener(event as DailyChallengeTelemetryEvent),
        undefined,
      );
    },
    registerDamageObserver: (listener) => setDailyChallengeDamageEventListener(listener),
    schedule: (seconds, callback) => Timers.CreateTimer(seconds, callback),
    getGameTime: () => GameRules.GetGameTime(),
    getGameState: () => GameRules.State_Get(),
    entityFromIndex: (index) =>
      EntIndexToHScript(index as EntityIndex) as DailyChallengeTelemetryEntity | undefined,
    getBotHeroes: () => {
      const heroes: DailyChallengeTelemetryEntity[] = [];
      for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
        if (!PlayerResource.IsValidPlayerID(playerId) || !PlayerResource.IsFakeClient(playerId)) {
          continue;
        }
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero) heroes.push(hero as DailyChallengeTelemetryEntity);
      }
      return heroes;
    },
    isValidPlayerId: (playerId): playerId is PlayerID => PlayerResource.IsValidPlayerID(playerId),
    isFakeClient: (playerId) => PlayerResource.IsFakeClient(playerId),
    getSteamAccountId: (playerId) => PlayerResource.GetSteamAccountID(playerId),
    getPlayerTeam: (playerId) => PlayerResource.GetTeam(playerId),
  };
}

function isDurationMetric(metric: ChallengeMetric): metric is DailyChallengeDurationMetric {
  return metric.endsWith('_duration_ms');
}

function isLiveEntity(
  entity: DailyChallengeTelemetryEntity | undefined,
): entity is DailyChallengeTelemetryEntity {
  return !!entity && (!entity.IsNull || !entity.IsNull());
}

function isActiveModifier(modifier: CDOTA_Buff): boolean {
  const duration = modifier.GetDuration();
  return duration <= 0 || modifier.GetRemainingTime() > 0;
}

export class DailyChallengeTelemetry {
  private running = false;
  private scanScheduled = false;
  private lastScanGameTime = 0;
  private readonly ignoredActiveModifiersByPlayerAndMetric = new Map<string, Set<CDOTA_Buff>>();

  constructor(
    private readonly accumulator: DailyChallengeMetricAccumulator = dailyChallengeMetricAccumulator,
    private readonly deps: DailyChallengeTelemetryDependencies = createDefaultDependencies(),
    private readonly classifierConstants?: DailyChallengeModifierClassifierConstants,
  ) {
    this.deps.registerDamageObserver((event) => this.onTakeDamage(event));
    this.deps.register('entity_killed', (event) => this.onEntityKilled(event));
    this.deps.register('game_rules_state_change', () => this.onGameRulesStateChange());
  }

  startMatch(): void {
    if (this.running) {
      return;
    }
    this.accumulator.reset();
    this.ignoredActiveModifiersByPlayerAndMetric.clear();
    this.lastScanGameTime = this.deps.getGameTime();
    this.running = true;
    this.scheduleModifierScan();
  }

  stopMatch(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
  }

  ignoreCurrentlyActiveEffectsForMetric(playerId: PlayerID, metric: ChallengeMetric): void {
    if (!isDurationMetric(metric)) {
      return;
    }

    const key = this.activeModifierIgnoreKey(playerId, metric);
    const activeModifiers = new Set<CDOTA_Buff>();
    for (const target of this.deps.getBotHeroes()) {
      if (!this.isEnemyBotRealHero(target) || target.IsAlive?.() === false) {
        continue;
      }
      for (const modifier of target.FindAllModifiers?.() ?? []) {
        if (modifier.IsNull() || !isActiveModifier(modifier)) continue;
        const caster = modifier.GetCaster() as DailyChallengeTelemetryEntity | undefined;
        const auraOwner = modifier.GetAuraOwner() as DailyChallengeTelemetryEntity | undefined;
        const ownerPlayerId = resolveDailyChallengeHumanPlayerId(caster, auraOwner, this.deps);
        if (ownerPlayerId !== playerId || !this.isEnemyTeam(playerId, target)) {
          continue;
        }
        if (classifyDailyChallengeModifier(modifier, this.classifierConstants).has(metric)) {
          activeModifiers.add(modifier);
        }
      }
    }

    if (activeModifiers.size > 0) {
      this.ignoredActiveModifiersByPlayerAndMetric.set(key, activeModifiers);
    } else {
      this.ignoredActiveModifiersByPlayerAndMetric.delete(key);
    }
  }

  private scheduleModifierScan(): void {
    if (this.scanScheduled) {
      return;
    }
    this.scanScheduled = true;
    this.deps.schedule(SCAN_INTERVAL_SECONDS, () => {
      const nextScan = this.scanActiveModifiers();
      if (nextScan === undefined) {
        this.scanScheduled = false;
      }
      return nextScan;
    });
  }

  private onGameRulesStateChange(): void {
    const state = this.deps.getGameState();
    if (state === GameState.GAME_IN_PROGRESS) {
      this.startMatch();
    } else if (state >= GameState.POST_GAME) {
      this.stopMatch();
    }
  }

  private onTakeDamage(event: DailyChallengeDamageEvent): void {
    if (!this.running) return;
    const target = event.unit as DailyChallengeTelemetryEntity | undefined;
    const attacker = event.attacker as DailyChallengeTelemetryEntity | undefined;
    if (!this.isEnemyBotRealHero(target) || !isLiveEntity(attacker)) {
      return;
    }
    const inflictorCaster = event.inflictor?.GetCaster() as
      | DailyChallengeTelemetryEntity
      | undefined;
    const playerId = resolveDailyChallengeHumanPlayerId(attacker, inflictorCaster, this.deps);
    if (playerId === undefined || !this.isEnemyTeam(playerId, target)) {
      return;
    }
    const metric = this.classifyDamageMetric(event.damage_type);
    if (!metric) return;
    this.accumulator.add(playerId, metric, event.damage);
  }

  private onEntityKilled(event: DailyChallengeTelemetryEvent): void {
    if (!this.running) return;
    const killed = this.deps.entityFromIndex(event.entindex_killed);
    const attacker = this.deps.entityFromIndex(event.entindex_attacker);
    if (!isLiveEntity(killed) || !isLiveEntity(attacker)) {
      return;
    }
    const playerId = resolveDailyChallengeHumanPlayerId(attacker, undefined, this.deps);
    if (playerId === undefined) {
      return;
    }

    if (killed.GetUnitName?.() === 'npc_dota_roshan') {
      this.accumulator.add(playerId, 'roshan_kills', 1);
      return;
    }
    if (
      this.isEnemyBotRealHero(killed) &&
      !killed.IsReincarnating?.() &&
      this.isEnemyTeam(playerId, killed)
    ) {
      this.accumulator.add(playerId, 'bot_kills', 1);
    }
  }

  private scanActiveModifiers(): number | void {
    if (!this.running) {
      return undefined;
    }
    const deltaMs = this.getActiveModifierScanDeltaMs();
    if (deltaMs === undefined) {
      return SCAN_INTERVAL_SECONDS;
    }
    const activeByPlayerAndTarget = new Map<string, Set<ChallengeMetric>>();
    const observedIgnoredModifiers = new Map<string, Set<CDOTA_Buff>>();
    for (const target of this.deps.getBotHeroes()) {
      this.collectTargetActiveModifierMetrics(
        target,
        activeByPlayerAndTarget,
        observedIgnoredModifiers,
      );
    }
    this.replaceIgnoredActiveModifiers(observedIgnoredModifiers);
    this.applyActiveModifierMetrics(activeByPlayerAndTarget, deltaMs);
    return SCAN_INTERVAL_SECONDS;
  }

  private getActiveModifierScanDeltaMs(): number | undefined {
    const now = this.deps.getGameTime();
    const rawDelta = Math.max(0, now - this.lastScanGameTime);
    this.lastScanGameTime = now;
    return rawDelta > 0 ? Math.min(rawDelta, MAX_SCAN_DELTA_SECONDS) * 1000 : undefined;
  }

  private collectTargetActiveModifierMetrics(
    target: DailyChallengeTelemetryEntity,
    activeByPlayerAndTarget: Map<string, Set<ChallengeMetric>>,
    observedIgnoredModifiers: Map<string, Set<CDOTA_Buff>>,
  ): void {
    if (!this.isEnemyBotRealHero(target) || target.IsAlive?.() === false) return;
    const targetPlayerId = target.GetPlayerOwnerID?.();
    if (targetPlayerId === undefined) return;
    for (const modifier of target.FindAllModifiers?.() ?? []) {
      this.collectActiveModifierMetrics(
        target,
        targetPlayerId,
        modifier,
        activeByPlayerAndTarget,
        observedIgnoredModifiers,
      );
    }
  }

  private collectActiveModifierMetrics(
    target: DailyChallengeTelemetryEntity,
    targetPlayerId: PlayerID,
    modifier: CDOTA_Buff,
    activeByPlayerAndTarget: Map<string, Set<ChallengeMetric>>,
    observedIgnoredModifiers: Map<string, Set<CDOTA_Buff>>,
  ): void {
    if (modifier.IsNull() || !isActiveModifier(modifier)) return;
    const caster = modifier.GetCaster() as DailyChallengeTelemetryEntity | undefined;
    const auraOwner = modifier.GetAuraOwner() as DailyChallengeTelemetryEntity | undefined;
    const playerId = resolveDailyChallengeHumanPlayerId(caster, auraOwner, this.deps);
    if (playerId === undefined || !this.isEnemyTeam(playerId, target)) return;
    const key = `${playerId}:${targetPlayerId}`;
    const activeMetrics = activeByPlayerAndTarget.get(key) ?? new Set<ChallengeMetric>();
    for (const metric of classifyDailyChallengeModifier(modifier, this.classifierConstants)) {
      if (this.shouldIgnoreActiveModifier(playerId, metric, modifier, observedIgnoredModifiers)) {
        continue;
      }
      activeMetrics.add(metric);
    }
    activeByPlayerAndTarget.set(key, activeMetrics);
  }

  private shouldIgnoreActiveModifier(
    playerId: PlayerID,
    metric: ChallengeMetric,
    modifier: CDOTA_Buff,
    observedIgnoredModifiers: Map<string, Set<CDOTA_Buff>>,
  ): boolean {
    const ignoreKey = this.activeModifierIgnoreKey(playerId, metric);
    const ignoredModifiers = this.ignoredActiveModifiersByPlayerAndMetric.get(ignoreKey);
    if (!ignoredModifiers?.has(modifier)) return false;
    const observed = observedIgnoredModifiers.get(ignoreKey) ?? new Set<CDOTA_Buff>();
    observed.add(modifier);
    observedIgnoredModifiers.set(ignoreKey, observed);
    return true;
  }

  private replaceIgnoredActiveModifiers(
    observedIgnoredModifiers: Map<string, Set<CDOTA_Buff>>,
  ): void {
    this.ignoredActiveModifiersByPlayerAndMetric.clear();
    for (const [key, modifiers] of observedIgnoredModifiers) {
      this.ignoredActiveModifiersByPlayerAndMetric.set(key, modifiers);
    }
  }

  private applyActiveModifierMetrics(
    activeByPlayerAndTarget: Map<string, Set<ChallengeMetric>>,
    deltaMs: number,
  ): void {
    for (const [key, metrics] of activeByPlayerAndTarget) {
      const playerId = Number(key.substring(0, key.indexOf(':')));
      if (!Number.isFinite(playerId) || !this.deps.isValidPlayerId(playerId)) continue;
      for (const metric of metrics) {
        this.accumulator.add(playerId, metric, deltaMs);
      }
    }
  }

  private activeModifierIgnoreKey(playerId: PlayerID, metric: ChallengeMetric): string {
    return `${playerId}:${metric}`;
  }

  private classifyDamageMetric(damageType: DAMAGE_TYPES): ChallengeMetric | undefined {
    if (damageType === DamageTypes.PURE) return 'pure_damage';
    if (damageType === DamageTypes.MAGICAL) return 'magical_damage';
    if (damageType === DamageTypes.PHYSICAL) return 'physical_damage';
    return undefined;
  }

  private isEnemyBotRealHero(
    entity: DailyChallengeTelemetryEntity | undefined,
  ): entity is DailyChallengeTelemetryEntity {
    if (!isLiveEntity(entity) || entity.IsRealHero?.() !== true || entity.IsIllusion?.() === true) {
      return false;
    }
    const playerId = entity.GetPlayerOwnerID?.();
    return (
      playerId !== undefined &&
      this.deps.isValidPlayerId(playerId) &&
      this.deps.isFakeClient(playerId)
    );
  }

  private isEnemyTeam(playerId: PlayerID, target: DailyChallengeTelemetryEntity): boolean {
    const targetTeam = target.GetTeamNumber?.();
    return targetTeam !== undefined && this.deps.getPlayerTeam(playerId) !== targetTeam;
  }
}
