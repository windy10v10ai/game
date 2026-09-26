import {
  buildLanePath,
  forwardProgress,
  nearestLane,
  pointAtProgress,
  projectOnLane,
} from './lane-geometry';
import { combatPower, decayThreat, threatMultiplier } from './power';
import { pushLevelFor, shouldTakeOver, takeoverFallbackSeconds } from './takeover';
import { PlanInput, PushLane, planTasks, pickStrategy, requiredPushLevel } from './team-plan';

const lane = (name: PushLane['lane'], x: number, enemyPower = 0): PushLane => ({
  lane: name,
  minLevel: 0,
  targetId: 100 + x,
  stagingPos: { x, y: 0 },
  targetHpRatio: 1,
  waveAtTarget: false,
  enemyPower,
});

const bots = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    pos: { x: 0, y: 0 },
    power: 100,
    needsRecover: false,
    // 编号越大普攻输出越高，4、5 号是推塔手
    attackDps: (i + 1) * 10,
    level: 10,
  }));

const baseInput = (overrides: Partial<PlanInput>): PlanInput => ({
  bots: bots(5),
  fountain: { x: -1000, y: -1000 },
  defend: [],
  fights: [],
  farms: [{ x: -4000, y: -4000 }],
  lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)],
  ourPower: 500,
  enemyPower: 500,
  ...overrides,
});

describe('lane geometry', () => {
  const path = buildLanePath('mid', [
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);

  it('projects points onto the polyline', () => {
    expect(path.length).toBe(2000);
    expect(projectOnLane(path, { x: 500, y: 100 })).toEqual({ progress: 500, offset: 100 });
    expect(projectOnLane(path, { x: 1100, y: 500 }).progress).toBe(1500);
  });

  it('maps progress back to a point and flips for dire', () => {
    expect(pointAtProgress(path, 1500)).toEqual({ x: 1000, y: 500 });
    expect(forwardProgress(path, 500, true)).toBe(500);
    expect(forwardProgress(path, 500, false)).toBe(1500);
  });

  it('ignores points far from every lane', () => {
    expect(nearestLane([path], { x: 500, y: 3000 }, 1200)).toBeUndefined();
    expect(nearestLane([path], { x: 500, y: 300 }, 1200)?.path.lane).toBe('mid');
  });
});

describe('power', () => {
  const stats = {
    health: 2000,
    armor: 10,
    magicResist: 0.25,
    attackDamage: 100,
    attacksPerSecond: 1,
    level: 10,
    spellAmp: 0,
    spellReady: 1,
  };

  it('grows with health and damage and is zero when dead', () => {
    expect(combatPower({ ...stats, health: 4000 })).toBeGreaterThan(combatPower(stats));
    expect(combatPower({ ...stats, attackDamage: 300 })).toBeGreaterThan(combatPower(stats));
    expect(combatPower({ ...stats, health: 0 })).toBe(0);
  });

  it('counts magic resist and drops when skills and items are on cooldown', () => {
    expect(combatPower({ ...stats, magicResist: 0.5 })).toBeGreaterThan(combatPower(stats));
    expect(combatPower({ ...stats, spellReady: 0 })).toBeLessThan(combatPower(stats));
  });

  it('decays threat and caps the multiplier', () => {
    expect(decayThreat(2, 90)).toBeCloseTo(1);
    expect(threatMultiplier(0)).toBe(1);
    expect(threatMultiplier(100)).toBe(3);
  });
});

describe('takeover', () => {
  const input = {
    gameTime: 6 * 60,
    towersLost: 0,
    midOnly: false,
    averageBotLevel: 5,
    pushLevel: 12,
    direMultiplier: 1,
  };

  it('never takes over before five minutes', () => {
    expect(shouldTakeOver({ ...input, gameTime: 4 * 60, towersLost: 5 })).toBe(false);
  });

  it('takes over on tower loss, bot level or time fallback', () => {
    expect(shouldTakeOver(input)).toBe(false);
    expect(shouldTakeOver({ ...input, towersLost: 2 })).toBe(true);
    expect(shouldTakeOver({ ...input, towersLost: 1, midOnly: true })).toBe(true);
    expect(shouldTakeOver({ ...input, averageBotLevel: 12 })).toBe(true);
    expect(shouldTakeOver({ ...input, gameTime: 12 * 60 })).toBe(true);
  });

  it('shortens the fallback with the multiplier within bounds', () => {
    expect(takeoverFallbackSeconds(1)).toBe(12 * 60);
    expect(takeoverFallbackSeconds(2)).toBe(10 * 60);
    expect(takeoverFallbackSeconds(20)).toBe(8 * 60);
    expect(pushLevelFor(100, false)).toBe(12);
    expect(pushLevelFor(500, true)).toBe(5);
  });
});

describe('planTasks', () => {
  it('sends low bots home before anything else', () => {
    const input = baseInput({});
    input.bots[0].needsRecover = true;
    expect(planTasks(input).tasks.get(1)?.kind).toBe('recover');
  });

  it('defends a threatened tower with enough power and leaves the rest pushing', () => {
    const result = planTasks(
      baseInput({
        defend: [
          {
            id: 50,
            pos: { x: 0, y: 0 },
            isBase: false,
            importance: 1,
            hpRatio: 0.5,
            attackerPower: 150,
          },
        ],
      }),
    );
    const kinds = [...result.tasks.values()].map((task) => task.kind);
    expect(kinds.filter((kind) => kind === 'defend')).toHaveLength(2);
    expect(kinds.filter((kind) => kind === 'push')).toHaveLength(3);
  });

  it('gives up an outer tower it cannot hold but always defends the base', () => {
    const threat = {
      id: 50,
      pos: { x: 0, y: 0 },
      importance: 1,
      hpRatio: 0.5,
      attackerPower: 5000,
    };
    const outer = planTasks(baseInput({ defend: [{ ...threat, isBase: false }] }));
    expect([...outer.tasks.values()].some((task) => task.kind === 'defend')).toBe(false);
    const base = planTasks(baseInput({ defend: [{ ...threat, isBase: true }] }));
    expect([...base.tasks.values()].every((task) => task.kind === 'defend')).toBe(true);
  });

  const spot = (enemyPower: number, allyPower = 0) => ({
    pos: { x: 500, y: 0 },
    enemyPower,
    allyPower,
    focusId: 99,
    rally: { x: -2000, y: 0 },
    pastFront: false,
  });

  it('does not send bots to fight behind a standing tower', () => {
    const tasks = planTasks(baseInput({ fights: [{ ...spot(250), pastFront: true }] })).tasks;
    expect([...tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
  });

  it('sends bots below every lane level gate to farm and keeps the rest pushing', () => {
    const input = baseInput({
      lanes: [
        { ...lane('top', -3000), minLevel: 12 },
        { ...lane('mid', 0), minLevel: 8 },
      ],
    });
    input.bots[0].level = 6;
    input.bots[1].level = 9;
    const tasks = planTasks(input).tasks;
    expect(tasks.get(1)).toEqual({ kind: 'farm', pos: { x: -4000, y: -4000 } });
    expect(tasks.get(2)?.lane).toBe('mid');
    expect(requiredPushLevel(1, 12)).toBe(0);
    expect(requiredPushLevel(2, 12)).toBe(8);
    expect(requiredPushLevel(4, 12)).toBe(12);
  });

  it('keeps pushing the current lane instead of teleporting across the map', () => {
    const input = baseInput({
      ourPower: 1000,
      enemyPower: 300,
      lanes: [lane('top', -9000), { ...lane('bot', 9000), waveAtTarget: true }],
    });
    input.bots.forEach((bot) => (bot.pos = { x: -8000, y: 0 }));
    expect(planTasks(input).mainLane).toBe('top');
  });

  it('sends just enough nearby bots to a winnable fight and leaves pushers pushing', () => {
    const input = baseInput({ fights: [spot(250)] });
    input.bots[4].pos = { x: 9000, y: 0 };
    const tasks = planTasks(input).tasks;
    expect([1, 2, 3].map((id) => tasks.get(id)?.kind)).toEqual(['fight', 'fight', 'fight']);
    expect(tasks.get(1)?.targetId).toBe(99);
    expect(tasks.get(4)?.kind).toBe('push');
    expect(tasks.get(5)?.kind).toBe('push');
  });

  it('pulls pushers in only when the fight needs them', () => {
    const tasks = planTasks(baseInput({ fights: [spot(350)] })).tasks;
    expect([...tasks.values()].every((task) => task.kind === 'fight')).toBe(true);
  });

  it('pulls nearby bots back to the rally point when clearly outmatched', () => {
    const input = baseInput({ fights: [spot(1000)] });
    input.bots[4].pos = { x: 5000, y: 0 };
    const tasks = planTasks(input).tasks;
    expect(tasks.get(1)).toEqual({ kind: 'regroup', pos: { x: -2000, y: 0 } });
    expect(tasks.get(5)?.kind).toBe('push');
  });

  it('counts players already in the fight', () => {
    const tasks = planTasks(baseInput({ fights: [spot(150, 300)] })).tasks;
    expect([...tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
  });

  it('groups on one lane when ahead', () => {
    const result = planTasks(baseInput({ ourPower: 1000, enemyPower: 300 }));
    const lanes = new Set([...result.tasks.values()].map((task) => task.lane));
    expect(lanes.size).toBe(1);
    expect(result.mainLane).toBeDefined();
  });

  it('keeps a main group and pressures other lanes when even', () => {
    const result = planTasks(baseInput({}));
    const counts = new Map<string, number>();
    for (const task of result.tasks.values()) {
      counts.set(task.lane!, (counts.get(task.lane!) ?? 0) + 1);
    }
    expect(counts.get(result.mainLane!)).toBe(3);
    expect(counts.size).toBe(3);
  });

  it('split pushes the lanes without enemies when behind', () => {
    const result = planTasks(
      baseInput({
        ourPower: 300,
        enemyPower: 1000,
        lanes: [lane('top', -3000), lane('mid', 0, 800), lane('bot', 3000)],
      }),
    );
    const lanes = [...result.tasks.values()].map((task) => task.lane);
    expect(lanes).not.toContain('mid');
    expect(new Set(lanes).size).toBe(2);
    expect(pickStrategy(300, 1000)).toBe('disadvantage');
  });

  it('still pushes the weakest lane when enemies are everywhere', () => {
    const result = planTasks(
      baseInput({
        ourPower: 300,
        enemyPower: 1000,
        lanes: [lane('top', -3000, 900), lane('mid', 0, 800), lane('bot', 3000, 700)],
      }),
    );
    expect([...result.tasks.values()].every((task) => task.lane === 'bot')).toBe(true);
  });
});
