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
   * Macro goal support: positions computed once per second for the whole team.
   *
   * defendTargetByTeam — position of the allied tower with the lowest HP that
   *   is currently below 75% health. Undefined when all towers are healthy.
   *
   * groupTargetByTeam — centroid of the largest cluster of 3+ allied heroes
   *   within 2000 units of each other. Undefined when no cluster exists.
   */
  private defendTargetByTeam: Map<number, Vector | undefined> = new Map();
  /** Entity indices of the (up to 2) closest bots assigned to defend the threatened tower. */
  private defendAssignedByTeam: Map<number, Set<number>> = new Map();
  private groupTargetByTeam: Map<number, Vector | undefined> = new Map();

  /** Maximum number of bots that will rotate to defend a threatened tower. */
  private static readonly MAX_DEFENDERS = 2;

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

  /**
   * Returns the position of an allied tower under attack (HP < 75%) if this
   * specific hero is one of the (up to 2) closest allies assigned to defend it.
   * Returns undefined for all other heroes so only a small rotation occurs.
   */
  GetDefendTarget(team: DOTATeam_t, heroEntityIndex: number): Vector | undefined {
    const assigned = this.defendAssignedByTeam.get(team as unknown as number);
    if (!assigned || !assigned.has(heroEntityIndex)) return undefined;
    return this.defendTargetByTeam.get(team as unknown as number);
  }

  /**
   * Returns the centroid of the largest cluster of 3+ allied heroes within
   * 2000 units of each other, or undefined if no such cluster exists.
   */
  GetGroupTarget(team: DOTATeam_t): Vector | undefined {
    return this.groupTargetByTeam.get(team as unknown as number);
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

    // ---- Macro goal: defend + group targets ----
    // Scan all allied heroes globally once — reused for both defend assignment
    // and group cluster detection.
    const alliedHeroes = FindUnitsInRadius(
      botTeam,
      Vector(0, 0, 128),
      undefined,
      12000,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.HERO,
      UnitTargetFlags.NOT_ILLUSIONS,
      FindOrder.CLOSEST,
      false,
    );

    // Scan all allied buildings globally for the most-threatened tower.
    const alliedBuildings = FindUnitsInRadius(
      botTeam,
      Vector(0, 0, 128),
      undefined,
      12000,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.BUILDING,
      UnitTargetFlags.INVULNERABLE,
      FindOrder.CLOSEST,
      false,
    );
    let defendPos: Vector | undefined;
    let lowestHpPct = 75; // only defend towers below this threshold
    for (const building of alliedBuildings) {
      const name = building.GetUnitName();
      if (!name.includes('tower')) continue;
      const hpPct = building.GetHealthPercent();
      if (hpPct < lowestHpPct) {
        lowestHpPct = hpPct;
        defendPos = building.GetAbsOrigin();
      }
    }
    this.defendTargetByTeam.set(botTeam as unknown as number, defendPos);

    // Assign DEFEND to at most MAX_DEFENDERS bots — the ones closest to the
    // threatened tower. All other bots stay in their lanes.
    const defendAssigned: Set<number> = new Set();
    if (defendPos !== undefined) {
      const towerX = (defendPos as unknown as { x: number }).x;
      const towerY = (defendPos as unknown as { y: number }).y;
      const sorted = [...alliedHeroes].sort((a, b) => {
        const ap = a.GetAbsOrigin();
        const bp = b.GetAbsOrigin();
        return (
          (ap.x - towerX) ** 2 +
          (ap.y - towerY) ** 2 -
          ((bp.x - towerX) ** 2 + (bp.y - towerY) ** 2)
        );
      });
      for (let k = 0; k < Math.min(TeamCommander.MAX_DEFENDERS, sorted.length); k++) {
        defendAssigned.add(sorted[k].GetEntityIndex() as unknown as number);
      }
    }
    this.defendAssignedByTeam.set(botTeam as unknown as number, defendAssigned);

    // ---- Macro goal: group target ----
    // Detect if 3+ allied heroes are clustered within 2000 units of each other.
    let groupPos: Vector | undefined;
    const GROUP_RADIUS = 2000;
    let bestClusterCount = 2; // need at least 3 (self + 2 others)
    for (let i = 0; i < alliedHeroes.length; i++) {
      const pos = alliedHeroes[i].GetAbsOrigin();
      let count = 1;
      let cx = pos.x;
      let cy = pos.y;
      for (let j = 0; j < alliedHeroes.length; j++) {
        if (i === j) continue;
        const opos = alliedHeroes[j].GetAbsOrigin();
        const dx = pos.x - opos.x;
        const dy = pos.y - opos.y;
        if (dx * dx + dy * dy <= GROUP_RADIUS * GROUP_RADIUS) {
          count++;
          cx += opos.x;
          cy += opos.y;
        }
      }
      if (count > bestClusterCount) {
        bestClusterCount = count;
        groupPos = Vector(cx / count, cy / count, pos.z);
      }
    }
    // Reject clusters that are near the team's own base: bots regrouping at the
    // fountain to heal is not a team fight worth joining.
    if (groupPos !== undefined) {
      const teamNum = botTeam as unknown as number;
      const baseX = teamNum === 2 ? -7050 : 6950; // 2 = Radiant
      const baseY = teamNum === 2 ? -6550 : 6320;
      const bdx = (groupPos as unknown as { x: number }).x - baseX;
      const bdy = (groupPos as unknown as { y: number }).y - baseY;
      if (bdx * bdx + bdy * bdy < 3000 * 3000) {
        groupPos = undefined;
      }
    }
    this.groupTargetByTeam.set(botTeam as unknown as number, groupPos);
  }
}
