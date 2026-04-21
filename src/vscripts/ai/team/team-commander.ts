import { BotBaseAIModifier } from '../hero/bot-base';

interface GhostEntry {
  /** Combat power at the moment the hero left vision. */
  power: number;
  posX: number;
  posY: number;
  /** GameTime when the hero was last seen before disappearing. */
  seenAt: number;
}

export class TeamCommander {
  private static instance: TeamCommander;

  private missingCountByTeam: Record<number, number> = {};
  private lastUpdateTimeByTeam: Record<number, number> = {};
  private readonly updateInterval: number = 1;

  /**
   * Target reservation: tracks how many bots have claimed each target this
   * second. Cleared every updateInterval to prevent stale penalisation.
   * Key: entity index (number). Value: claim count.
   */
  private targetClaims: Map<number, number> = new Map();

  /**
   * Fog Ghost system: when an enemy transitions from visible → hidden, we store
   * a "ghost" at their last known position with their last known power value.
   * Ghost power decays exponentially so the threat fades over a few seconds,
   * preventing bots from reacting instantly when enemies juke a tree.
   *
   * lastKnownByTeam: heroes currently visible — updated every scan.
   * ghostsByTeam:    heroes that just disappeared — feeds into power calculations.
   */
  private lastKnownByTeam: Map<number, Map<number, { power: number; posX: number; posY: number }>> =
    new Map();
  private ghostsByTeam: Map<number, Map<number, GhostEntry>> = new Map();

  /** Exponential decay rate for ghost threats (λ). Higher = faster fade. */
  private static readonly GHOST_DECAY_LAMBDA = 0.5;
  /** Seconds after which a ghost is considered expired and ignored. */
  private static readonly GHOST_MAX_AGE = 6;

  private constructor() {}

  static getInstance(): TeamCommander {
    if (!TeamCommander.instance) {
      TeamCommander.instance = new TeamCommander();
    }
    return TeamCommander.instance;
  }

  GetEnemyMissingCount(team: DOTATeam_t): number {
    return this.missingCountByTeam[team] ?? 0;
  }

  /**
   * Register that a bot intends to attack a specific target this tick.
   * Call this after selecting a target in FindBestAttackTarget so other bots
   * can see the claim count and deprioritise over-targeted enemies.
   */
  ClaimTarget(entityIndex: number): void {
    this.targetClaims.set(entityIndex, (this.targetClaims.get(entityIndex) ?? 0) + 1);
  }

  /**
   * Returns how many bots have claimed this target in the current second.
   * Used by FindBestAttackTarget to apply a soft penalty to crowded targets.
   */
  GetTargetClaimCount(entityIndex: number): number {
    return this.targetClaims.get(entityIndex) ?? 0;
  }

  /**
   * Returns the total decayed ghost power for recently-disappeared enemies
   * within a given radius of a position.
   *
   * Used by ModeAttack and ModeRetreat to remain cautious near juke spots
   * and prevent abrupt mode flipping when an enemy steps behind a tree.
   *
   * Ghost power = lastKnownPower × e^(−λ × elapsed), capped at GHOST_MAX_AGE.
   */
  GetGhostEnemyPower(
    team: DOTATeam_t,
    cx: number,
    cy: number,
    radius: number,
    currentTime: number,
  ): number {
    const ghosts = this.ghostsByTeam.get(team as unknown as number);
    if (!ghosts || ghosts.size === 0) return 0;
    let total = 0;
    for (const ghost of ghosts.values()) {
      const elapsed = currentTime - ghost.seenAt;
      if (elapsed > TeamCommander.GHOST_MAX_AGE) continue;
      const dx = ghost.posX - cx;
      const dy = ghost.posY - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        total += ghost.power * Math.exp(-TeamCommander.GHOST_DECAY_LAMBDA * elapsed);
      }
    }
    return total;
  }

  UpdateGameState(allHeroes: BotBaseAIModifier[]): void {
    if (allHeroes.length === 0) return;

    const botTeam = allHeroes[0].GetHero().GetTeamNumber();
    const gameTime = GameRules.GetDOTATime(false, true);
    const lastUpdate = this.lastUpdateTimeByTeam[botTeam] ?? -999;

    if (gameTime - lastUpdate < this.updateInterval) {
      return;
    }
    this.lastUpdateTimeByTeam[botTeam] = gameTime;
    // Reset target claims each second so stale reservations don't persist.
    this.targetClaims.clear();

    const lastKnown =
      this.lastKnownByTeam.get(botTeam as unknown as number) ??
      new Map<number, { power: number; posX: number; posY: number }>();
    const ghosts =
      this.ghostsByTeam.get(botTeam as unknown as number) ?? new Map<number, GhostEntry>();

    let missingCount = 0;
    for (let playerId = 0; playerId < 24; playerId++) {
      if (!PlayerResource.IsValidPlayerID(playerId)) continue;
      if (PlayerResource.GetTeam(playerId) === botTeam) continue;

      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero || !hero.IsAlive()) {
        // Dead or gone: clear all tracking for this hero
        lastKnown.delete(playerId);
        ghosts.delete(playerId);
        continue;
      }

      const heroPos = hero.GetAbsOrigin();
      if (IsLocationVisible(botTeam, heroPos)) {
        // Visible: refresh last-known entry and clear any ghost
        lastKnown.set(playerId, {
          power: (hero.GetHealthPercent() / 100) * hero.GetLevel(),
          posX: heroPos.x,
          posY: heroPos.y,
        });
        ghosts.delete(playerId);
      } else {
        missingCount++;
        // Just disappeared: create ghost from last-known data
        if (lastKnown.has(playerId)) {
          const lk = lastKnown.get(playerId)!;
          ghosts.set(playerId, { power: lk.power, posX: lk.posX, posY: lk.posY, seenAt: gameTime });
          lastKnown.delete(playerId);
        }
        // else: already a ghost or never seen — leave ghost as-is
      }
    }

    this.missingCountByTeam[botTeam] = missingCount;
    this.lastKnownByTeam.set(botTeam as unknown as number, lastKnown);
    this.ghostsByTeam.set(botTeam as unknown as number, ghosts);
  }
}
