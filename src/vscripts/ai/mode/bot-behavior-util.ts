/**
 * Pure-logic helpers for bot decision-making.
 * No Dota API calls — all inputs are plain numbers so this module is fully unit-testable.
 */
export class BotBehaviorUtil {
  /** Threshold below which a hero is considered a kill target. */
  static readonly KILLABLE_HP_PERCENT = 20;

  /** Threshold below which a creep is worth last-hitting. */
  static readonly LAST_HIT_HP_PERCENT = 15;

  /** Mana fraction below which the bot conserves mana (skips enemy/creep casts). */
  static readonly MANA_CONSERVATION_THRESHOLD = 0.2;

  /** HP percent below which a retreating bot should walk to base for healing. */
  static readonly BASE_HEAL_HP_PERCENT = 40;

  /**
   * HP percent below which a retreating bot treats the situation as an emergency
   * and runs directly to base regardless of ally positions or chase direction.
   * At this threshold the centroid flee is unreliable (allies may be in the lane)
   * and casting spells costs more time than it saves.
   */
  static readonly CRITICAL_RETREAT_HP_PERCENT = 30;

  /**
   * HP drop percentage in a single 0.3s think tick that triggers a dodge step.
   * 8% in 0.3s ≈ 27% HP/s — indicates a hit from a spell or burst, not just creep nibbles.
   */
  static readonly HP_SPIKE_THRESHOLD = 8;

  /**
   * Confidence thresholds for TowerKillConfidence.
   * HIGH   → dive freely (we kill before tower kills us).
   * MEDIUM → cautious follow-up (could go either way; apply lighter suppression).
   * Below MEDIUM → don't follow up under tower.
   */
  static readonly TOWER_KILL_HIGH_CONFIDENCE   = 0.65;
  static readonly TOWER_KILL_MEDIUM_CONFIDENCE = 0.40;

  /**
   * Estimates how confident the bot should be that it can kill a target
   * before tower fire forces a retreat.
   *
   * Models actual time-to-kill vs time-to-die:
   *   timeToKill     = targetHp / attackerDps
   *   timeToDie      = attackerHp / towerDps
   *   survivalRatio  = timeToDie / timeToKill
   *   confidence     = survivalRatio / (survivalRatio + 1)  [0 → 1 smooth curve]
   *
   * A high-damage attacker collapses timeToKill even against a full-HP target,
   * producing high confidence at full health — "I can 100→0 them before the
   * tower does meaningful damage."  A low-damage attacker needs the target
   * to be already wounded.
   *
   * Example values (towerDps = 150):
   *   attackerHp=800, attackerDps=500, targetHp=200 → survivalRatio≈10.7 → 0.91 (HIGH)
   *   attackerHp=800, attackerDps=100, targetHp=200 → survivalRatio≈2.7  → 0.73 (HIGH)
   *   attackerHp=600, attackerDps=100, targetHp=500 → survivalRatio≈0.8  → 0.44 (MEDIUM)
   *   attackerHp=300, attackerDps=80,  targetHp=600 → survivalRatio≈0.27 → 0.21 (LOW)
   *
   * @param attackerHp   Attacker's current HP (absolute).
   * @param attackerDps  Attacker's estimated damage per second (use level×10 as proxy).
   * @param targetHp     Target's remaining HP (absolute).
   * @param towerDps     Tower's estimated damage per second (use 150 as default).
   * @returns Score in [0, 1]. Compare against TOWER_KILL_HIGH/MEDIUM_CONFIDENCE.
   */
  static TowerKillConfidence(
    attackerHp: number,
    attackerDps: number,
    targetHp: number,
    towerDps: number,
  ): number {
    if (targetHp <= 0) return 1;   // already dead — trivially killable
    if (attackerHp <= 0) return 0; // attacker is dead — can't dive
    const timeToKill = targetHp / (attackerDps || 1);
    const timeToDie  = attackerHp / (towerDps  || 1);
    const survivalRatio = timeToDie / timeToKill;
    return survivalRatio / (survivalRatio + 1);
  }

  /**
   * Priority score for a potential attack target.
   * Combines kill-progress (low HP) with target value (high level).
   * Higher score = better target to focus.
   */
  static ScoreAttackTarget(hpPercent: number, level: number): number {
    return (1 - hpPercent / 100) * level;
  }

  /**
   * Returns true when the hero has enough mana remaining to spend on combat abilities.
   * Manaless heroes (maxMana = 0) always return true.
   */
  static HasManaForCombat(mana: number, maxMana: number): boolean {
    if (maxMana === 0) return true;
    return mana / maxMana >= BotBehaviorUtil.MANA_CONSERVATION_THRESHOLD;
  }

  /**
   * Returns true when an enemy hero is low enough to justify a finishing attack.
   */
  static IsEnemyKillable(hpPercent: number): boolean {
    return hpPercent <= BotBehaviorUtil.KILLABLE_HP_PERCENT;
  }

  /**
   * Returns true when a creep is near enough to death to be worth last-hitting.
   */
  static IsCreepLastHittable(hpPercent: number): boolean {
    return hpPercent <= BotBehaviorUtil.LAST_HIT_HP_PERCENT;
  }

  /**
   * Calculates a normalised flee direction for a hero retreating from an enemy.
   *
   * When an ally position is provided the direction blends 60% "toward ally" and
   * 40% "away from enemy", so the bot runs toward its team rather than into open
   * terrain.  Without an ally it returns pure "away from enemy" and the caller is
   * expected to move toward base instead.
   *
   * All coordinates are 2-D (x, y); callers strip the z component before calling.
   *
   * @returns Normalised direction vector {x, y} (length ≈ 1).
   */
  static CalculateFleeDirection(
    heroX: number,
    heroY: number,
    enemyX: number,
    enemyY: number,
    allyX?: number,
    allyY?: number,
  ): { x: number; y: number } {
    const awayDx = heroX - enemyX;
    const awayDy = heroY - enemyY;
    const awayLen = Math.sqrt(awayDx * awayDx + awayDy * awayDy);
    // Degenerate: hero exactly on top of enemy — flee along +x by convention
    if (awayLen < 0.0001) return { x: 1, y: 0 };
    const normAwayX = awayDx / awayLen;
    const normAwayY = awayDy / awayLen;

    if (allyX !== undefined && allyY !== undefined) {
      const toAllyDx = allyX - heroX;
      const toAllyDy = allyY - heroY;
      const toAllyLen = Math.sqrt(toAllyDx * toAllyDx + toAllyDy * toAllyDy) || 1;
      const normToAllyX = toAllyDx / toAllyLen;
      const normToAllyY = toAllyDy / toAllyLen;

      const blendedX = normToAllyX * 0.6 + normAwayX * 0.4;
      const blendedY = normToAllyY * 0.6 + normAwayY * 0.4;
      const blendedLen = Math.sqrt(blendedX * blendedX + blendedY * blendedY) || 1;
      return { x: blendedX / blendedLen, y: blendedY / blendedLen };
    }

    return { x: normAwayX, y: normAwayY };
  }

  /**
   * Returns true when a ranged hero (attackRange > 200) is close enough to a
   * target that they should step back to maintain optimal kiting distance.
   *
   * @param dist        Current distance to the target
   * @param attackRange Hero's attack range
   */
  static ShouldOrbWalkBack(dist: number, attackRange: number): boolean {
    if (attackRange <= 200) return false; // melee hero — never kite
    return dist < attackRange - 150;
  }

  /**
   * Calculates a normalised flee direction using the centroid of all nearby
   * allies and enemies rather than a single nearest unit.
   *
   * This prevents the bot from running into a cluster of enemies that happens
   * to lie in the same direction as the nearest ally.
   *
   * - Non-empty allyPositions: blends 60% toward ally centroid + 40% away from
   *   enemy centroid.
   * - Empty allyPositions: flees directly away from enemy centroid.
   * - Empty enemyPositions or fully degenerate inputs: returns {x:1, y:0}.
   *
   * All coordinates are 2-D (x, y).
   * @returns Normalised direction vector {x, y} (length ≈ 1).
   */
  static CalculateFleeCentroidDirection(
    heroX: number,
    heroY: number,
    enemyPositions: Array<{ x: number; y: number }>,
    allyPositions: Array<{ x: number; y: number }>,
  ): { x: number; y: number } {
    if (enemyPositions.length === 0) return { x: 1, y: 0 };

    // Enemy centroid
    let enemyCx = 0;
    let enemyCy = 0;
    for (const p of enemyPositions) {
      enemyCx += p.x;
      enemyCy += p.y;
    }
    enemyCx /= enemyPositions.length;
    enemyCy /= enemyPositions.length;

    const awayDx = heroX - enemyCx;
    const awayDy = heroY - enemyCy;
    const awayLen = Math.sqrt(awayDx * awayDx + awayDy * awayDy);
    if (awayLen < 0.0001) return { x: 1, y: 0 };
    const normAwayX = awayDx / awayLen;
    const normAwayY = awayDy / awayLen;

    if (allyPositions.length > 0) {
      // Ally centroid
      let allyCx = 0;
      let allyCy = 0;
      for (const p of allyPositions) {
        allyCx += p.x;
        allyCy += p.y;
      }
      allyCx /= allyPositions.length;
      allyCy /= allyPositions.length;

      const toAllyDx = allyCx - heroX;
      const toAllyDy = allyCy - heroY;
      const toAllyLen = Math.sqrt(toAllyDx * toAllyDx + toAllyDy * toAllyDy) || 1;
      const normToAllyX = toAllyDx / toAllyLen;
      const normToAllyY = toAllyDy / toAllyLen;

      const blendedX = normToAllyX * 0.6 + normAwayX * 0.4;
      const blendedY = normToAllyY * 0.6 + normAwayY * 0.4;
      const blendedLen = Math.sqrt(blendedX * blendedX + blendedY * blendedY) || 1;
      return { x: blendedX / blendedLen, y: blendedY / blendedLen };
    }

    return { x: normAwayX, y: normAwayY };
  }
}
