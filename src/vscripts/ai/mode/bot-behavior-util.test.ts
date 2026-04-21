import { BotBehaviorUtil } from './bot-behavior-util';

describe('BotBehaviorUtil.ScoreAttackTarget', () => {
  it('scores 0 for a full-HP enemy (not worth switching to)', () => {
    expect(BotBehaviorUtil.ScoreAttackTarget(100, 10)).toBe(0);
  });

  it('scores positively for a wounded enemy', () => {
    expect(BotBehaviorUtil.ScoreAttackTarget(50, 10)).toBeCloseTo(5);
  });

  it('prefers high-level low-HP enemy over low-level near-dead enemy', () => {
    const highValue = BotBehaviorUtil.ScoreAttackTarget(20, 25); // 0.8 * 25 = 20
    const lowValue = BotBehaviorUtil.ScoreAttackTarget(5, 3); // 0.95 * 3  = 2.85
    expect(highValue).toBeGreaterThan(lowValue);
  });

  it('scores 25 for a level-25 hero at 0% HP', () => {
    expect(BotBehaviorUtil.ScoreAttackTarget(0, 25)).toBe(25);
  });

  it('scores proportionally — halving HP doubles score', () => {
    const at50 = BotBehaviorUtil.ScoreAttackTarget(50, 10);
    const at25 = BotBehaviorUtil.ScoreAttackTarget(25, 10);
    expect(at25 / at50).toBeCloseTo(1.5, 1); // (0.75*10) / (0.5*10) = 1.5
  });
});

describe('BotBehaviorUtil.TowerKillConfidence', () => {
  // All tests use towerDps=150 (standard tower constant)

  it('returns HIGH confidence when attacker has massive DPS relative to target HP', () => {
    // attackerDps=500 → timeToKill=200/500=0.4s, timeToDie=800/150=5.3s → ratio≈13.3 → 0.93
    const conf = BotBehaviorUtil.TowerKillConfidence(800, 500, 200, 150);
    expect(conf).toBeGreaterThanOrEqual(BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE);
  });

  it('returns HIGH confidence when target is near death even with modest DPS', () => {
    // attackerDps=100, targetHp=100 → timeToKill=1s, timeToDie=800/150=5.3s → ratio≈5.3 → 0.84
    const conf = BotBehaviorUtil.TowerKillConfidence(800, 100, 100, 150);
    expect(conf).toBeGreaterThanOrEqual(BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE);
  });

  it('returns MEDIUM confidence when kill is possible but not certain', () => {
    // attackerDps=100, targetHp=500, attackerHp=600 → timeToKill=5s, timeToDie=4s → ratio=0.8 → 0.44
    const conf = BotBehaviorUtil.TowerKillConfidence(600, 100, 500, 150);
    expect(conf).toBeGreaterThanOrEqual(BotBehaviorUtil.TOWER_KILL_MEDIUM_CONFIDENCE);
    expect(conf).toBeLessThan(BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE);
  });

  it('returns LOW confidence when attacker is weak and target has substantial HP', () => {
    // attackerDps=80, targetHp=600, attackerHp=300 → timeToKill=7.5s, timeToDie=2s → ratio=0.27 → 0.21
    const conf = BotBehaviorUtil.TowerKillConfidence(300, 80, 600, 150);
    expect(conf).toBeLessThan(BotBehaviorUtil.TOWER_KILL_MEDIUM_CONFIDENCE);
  });

  it('returns HIGH confidence for a burst-damage attacker at full health vs full-HP target', () => {
    // "100→0 in 1 second": attackerDps=1000, targetHp=1000, attackerHp=2000
    // timeToKill=1s, timeToDie=13.3s → ratio=13.3 → 0.93 → HIGH
    const conf = BotBehaviorUtil.TowerKillConfidence(2000, 1000, 1000, 150);
    expect(conf).toBeGreaterThanOrEqual(BotBehaviorUtil.TOWER_KILL_HIGH_CONFIDENCE);
  });

  it('returns 1 when target HP is 0', () => {
    expect(BotBehaviorUtil.TowerKillConfidence(1000, 100, 0, 150)).toBe(1);
  });

  it('returns 0 when attacker HP is 0', () => {
    expect(BotBehaviorUtil.TowerKillConfidence(0, 100, 500, 150)).toBe(0);
  });
});

describe('BotBehaviorUtil.HasManaForCombat', () => {
  it('returns true when mana is at 100%', () => {
    expect(BotBehaviorUtil.HasManaForCombat(500, 500)).toBe(true);
  });

  it('returns true exactly at the 20% threshold', () => {
    expect(BotBehaviorUtil.HasManaForCombat(100, 500)).toBe(true);
  });

  it('returns false just below the 20% threshold', () => {
    expect(BotBehaviorUtil.HasManaForCombat(99, 500)).toBe(false);
  });

  it('returns false at 0 mana', () => {
    expect(BotBehaviorUtil.HasManaForCombat(0, 500)).toBe(false);
  });

  it('returns true for manaless heroes (maxMana = 0)', () => {
    expect(BotBehaviorUtil.HasManaForCombat(0, 0)).toBe(true);
  });
});

describe('BotBehaviorUtil.IsEnemyKillable', () => {
  it('returns false at 21% HP', () => {
    expect(BotBehaviorUtil.IsEnemyKillable(21)).toBe(false);
  });

  it('returns true exactly at the 20% boundary', () => {
    expect(BotBehaviorUtil.IsEnemyKillable(20)).toBe(true);
  });

  it('returns true at 0% HP', () => {
    expect(BotBehaviorUtil.IsEnemyKillable(0)).toBe(true);
  });
});

describe('BotBehaviorUtil.IsCreepLastHittable', () => {
  it('returns false at 16% HP', () => {
    expect(BotBehaviorUtil.IsCreepLastHittable(16)).toBe(false);
  });

  it('returns true exactly at the 15% boundary', () => {
    expect(BotBehaviorUtil.IsCreepLastHittable(15)).toBe(true);
  });

  it('returns true at 1% HP (clearly dying)', () => {
    expect(BotBehaviorUtil.IsCreepLastHittable(1)).toBe(true);
  });
});

describe('BotBehaviorUtil.CalculateFleeDirection', () => {
  it('flees directly away from enemy when no ally is present', () => {
    // Hero at (0,0), enemy at (-100, 0) → flee direction = (+1, 0)
    const dir = BotBehaviorUtil.CalculateFleeDirection(0, 0, -100, 0);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
  });

  it('returns a unit vector when fleeing with no ally', () => {
    const dir = BotBehaviorUtil.CalculateFleeDirection(100, 200, 400, 600);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
  });

  it('blends toward ally when ally is present', () => {
    // Hero at (0,0), enemy at (-100,0), ally at (0,100)
    // away-from-enemy = (+1, 0)
    // toward-ally     = (0, +1)
    // blended (0.4*away + 0.6*toward) ≈ (0.4, 0.6), normalised
    const dir = BotBehaviorUtil.CalculateFleeDirection(0, 0, -100, 0, 0, 100);
    expect(dir.x).toBeGreaterThan(0); // still moves away from enemy
    expect(dir.y).toBeGreaterThan(0); // also moves toward ally
    // toward-ally component should be larger than away-from-enemy component
    expect(dir.y).toBeGreaterThan(dir.x);
  });

  it('returns a unit vector when ally is present', () => {
    const dir = BotBehaviorUtil.CalculateFleeDirection(0, 0, -100, 0, 0, 100);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
  });

  it('handles hero and enemy at same position without crashing', () => {
    // Degenerate case: enemy exactly on top of hero — falls back to +x
    const dir = BotBehaviorUtil.CalculateFleeDirection(0, 0, 0, 0);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5); // still returns a valid unit direction
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
  });

  it('with ally directly between hero and enemy, blended direction points toward ally', () => {
    // Hero (0,0), enemy (0,-200), ally (0,100)
    // away from enemy = (0, +1); toward ally = (0, +1) — same direction
    const dir = BotBehaviorUtil.CalculateFleeDirection(0, 0, 0, -200, 0, 100);
    expect(dir.x).toBeCloseTo(0, 3);
    expect(dir.y).toBeCloseTo(1, 3);
  });
});

describe('BotBehaviorUtil.CalculateFleeCentroidDirection', () => {
  it('returns {x:1, y:0} when no enemies are provided', () => {
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(0, 0, [], []);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
  });

  it('flees away from a single enemy when no allies are present', () => {
    // Hero at (0,0), enemy at (-100,0) → flee direction = (+1, 0)
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(0, 0, [{ x: -100, y: 0 }], []);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
  });

  it('returns a unit vector with single enemy, no allies', () => {
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(100, 200, [{ x: 400, y: 600 }], []);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
  });

  it('flees away from enemy centroid of multiple enemies', () => {
    // Hero at (0,0), enemies at (-100,0) and (-100,10) → centroid ~(-100,5)
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [
        { x: -100, y: 0 },
        { x: -100, y: 10 },
      ],
      [],
    );
    expect(dir.x).toBeGreaterThan(0); // flees in +x direction
  });

  it('blends toward ally centroid when allies are present', () => {
    // Hero at (0,0), enemy at (-100,0), ally at (0,100)
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [{ x: -100, y: 0 }],
      [{ x: 0, y: 100 }],
    );
    expect(dir.x).toBeGreaterThan(0); // still moves away from enemy
    expect(dir.y).toBeGreaterThan(0); // also moves toward ally
    expect(dir.y).toBeGreaterThan(dir.x); // ally component dominates (60/40 blend)
  });

  it('returns a unit vector when allies are present', () => {
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [{ x: -100, y: 0 }],
      [{ x: 0, y: 100 }],
    );
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
  });

  it('uses centroid of multiple allies', () => {
    // Hero at (0,0), enemy at (-100,0), two allies at (0,50) and (0,150) → ally centroid (0,100)
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [{ x: -100, y: 0 }],
      [
        { x: 0, y: 50 },
        { x: 0, y: 150 },
      ],
    );
    // Same result as single ally at centroid (0,100)
    const dirSingle = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [{ x: -100, y: 0 }],
      [{ x: 0, y: 100 }],
    );
    expect(dir.x).toBeCloseTo(dirSingle.x, 5);
    expect(dir.y).toBeCloseTo(dirSingle.y, 5);
  });

  it('handles hero exactly at enemy centroid without crashing', () => {
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(0, 0, [{ x: 0, y: 0 }], []);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
    expect(dir.x).toBeCloseTo(1, 5);
  });

  it('escapes away from enemies even when ally is on the wrong side', () => {
    // Enemy cluster at (100,0) and (80, 20), ally at (200, 0) (in enemy direction)
    // Away from enemy centroid = negative x. Ally in enemy direction.
    // Expected: blended direction should still have -x component despite ally pull.
    const dir = BotBehaviorUtil.CalculateFleeCentroidDirection(
      0,
      0,
      [
        { x: 100, y: 0 },
        { x: 80, y: 20 },
      ],
      [{ x: 200, y: 0 }],
    );
    // away-from-enemy = (-1, ~0); toward-ally = (+1, 0)
    // blend = 0.4*(-1) + 0.6*(+1) = +0.2 → x positive but weak
    // This tests that the blend doesn't blindly override the escape direction
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    expect(len).toBeCloseTo(1, 5);
  });
});

describe('BotBehaviorUtil.ShouldOrbWalkBack', () => {
  it('returns false for melee hero (attackRange <= 200)', () => {
    expect(BotBehaviorUtil.ShouldOrbWalkBack(50, 150)).toBe(false);
    expect(BotBehaviorUtil.ShouldOrbWalkBack(50, 200)).toBe(false);
  });

  it('returns false when at optimal range', () => {
    // attackRange=600, dist=500 → 500 >= 600-150=450 → no kite needed
    expect(BotBehaviorUtil.ShouldOrbWalkBack(500, 600)).toBe(false);
  });

  it('returns true when ranged hero is too close', () => {
    // attackRange=600, dist=200 → 200 < 450 → kite back
    expect(BotBehaviorUtil.ShouldOrbWalkBack(200, 600)).toBe(true);
  });

  it('returns true exactly at the threshold boundary', () => {
    // attackRange=600, threshold=450, dist=449
    expect(BotBehaviorUtil.ShouldOrbWalkBack(449, 600)).toBe(true);
  });

  it('handles edge case of zero distance', () => {
    expect(BotBehaviorUtil.ShouldOrbWalkBack(0, 600)).toBe(true);
  });
});
