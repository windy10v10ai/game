import {
  buildLanePath,
  forwardProgress,
  nearestLane,
  pointAtProgress,
  projectOnLane,
} from './lane-geometry';
import { combatPower, decayThreat, threatMultiplier } from './power';
import { resolvePushStaging } from './push-staging';
import { pushLevelFor, shouldTakeOver, takeoverFallbackSeconds } from './takeover';
import { PlanInput, PushLane, planTasks } from './team-plan';

const lane = (name: PushLane['lane'], x: number, enemyPower = 0): PushLane => ({
  lane: name,
  towerPower: 0,
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
  }));

const baseInput = (overrides: Partial<PlanInput>): PlanInput => ({
  bots: bots(5),
  fountain: { x: -1000, y: -1000 },
  defend: [],
  fights: [],
  farms: [{ pos: { x: -4000, y: -4000 }, ancient: false }],
  lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)],
  now: 100,
  // 固定取最高权重，测试结果可预期
  random: () => 0,
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

describe('push staging', () => {
  it('pushes the tower when the creep wave has arrived', () => {
    expect(resolvePushStaging(9500, 10000, false)).toEqual({
      waveAtTarget: true,
      stagingForward: 10000,
    });
  });

  it('waits outside the tower while backdoor protection remains active', () => {
    expect(resolvePushStaging(9500, 10000, true)).toEqual({
      waveAtTarget: false,
      stagingForward: 8900,
    });
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
    engaged: false,
  });

  it('does not send bots to fight behind a standing tower', () => {
    const tasks = planTasks(baseInput({ fights: [{ ...spot(250), pastFront: true }] })).tasks;
    expect([...tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
  });

  it('farms instead of pushing a tower the team cannot even chip', () => {
    const tasks = planTasks(
      baseInput({
        lanes: [
          { ...lane('top', -3000), towerPower: 1200 },
          { ...lane('mid', 0), towerPower: 800 },
        ],
      }),
    ).tasks;
    expect([...tasks.values()].every((task) => task.lane === 'mid')).toBe(true);

    const blocked = planTasks(
      baseInput({ lanes: [{ ...lane('top', -3000), towerPower: 1200 }] }),
    ).tasks;
    expect(blocked.get(1)).toEqual({ kind: 'farm', pos: { x: -4000, y: -4000 } });
  });

  it('farms ancients only when strong enough', () => {
    const input = baseInput({
      lanes: [{ ...lane('top', -3000), towerPower: 20000 }],
      farms: [
        { pos: { x: 100, y: 0 }, ancient: true },
        { pos: { x: 2000, y: 0 }, ancient: false },
      ],
    });
    input.bots[1].power = 5000;
    const tasks = planTasks(input).tasks;
    expect(tasks.get(1)).toEqual({ kind: 'farm', pos: { x: 2000, y: 0 } });
    expect(tasks.get(2)).toEqual({ kind: 'farm', pos: { x: 100, y: 0 } });
  });

  it('farms a split group too weak for its tower', () => {
    const input = baseInput({
      bots: bots(8),
      lanes: [{ ...lane('top', -3000), towerPower: 900 }, lane('bot', 3000)],
    });
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.lane ?? task.kind);
    expect(kinds.filter((kind) => kind === 'bot')).toHaveLength(4);
    expect(kinds.filter((kind) => kind === 'farm')).toHaveLength(4);
  });

  it('keeps pushing the current lane instead of teleporting across the map', () => {
    const input = baseInput({
      lanes: [lane('top', -9000), { ...lane('bot', 9000), waveAtTarget: true }],
    });
    input.bots.forEach((bot) => (bot.pos = { x: -8000, y: 0 }));
    expect(planTasks(input).plan?.picks.map((pick) => pick.lane)).toEqual(['top']);
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

  it('gathers at the rally before engaging when the bots nearby are not enough', () => {
    const input = baseInput({ fights: [spot(450)] });
    input.bots.forEach((bot) => (bot.pos = { x: -9000, y: 0 }));
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.kind);
    expect(kinds.filter((kind) => kind === 'regroup')).toHaveLength(5);
    expect(kinds).not.toContain('fight');
  });

  it('sends the nearest bots straight in once the fight has started', () => {
    const input = baseInput({ fights: [{ ...spot(450), engaged: true }] });
    input.bots.forEach((bot) => (bot.pos = { x: -9000, y: 0 }));
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.kind);
    expect(kinds.filter((kind) => kind === 'fight')).toHaveLength(5);
    expect(kinds).not.toContain('regroup');
  });

  it('pushes away from a fight the whole team cannot win instead of fleeing', () => {
    const input = baseInput({ fights: [spot(1200)] });
    const tasks = [...planTasks(input).tasks.values()];
    expect(tasks.some((task) => task.kind === 'fight' || task.kind === 'regroup')).toBe(false);
    expect(tasks.every((task) => task.lane !== 'mid')).toBe(true);
  });

  it('calls in bots from across the map to a fight nearby bots cannot win alone', () => {
    const input = baseInput({ fights: [{ ...spot(450), engaged: true }] });
    input.bots.forEach((bot) => (bot.pos = { x: 5500, y: 0 }));
    input.bots[0].pos = { x: 500, y: 0 };
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.kind);
    expect(kinds.filter((kind) => kind === 'fight')).toHaveLength(5);
  });

  it('pulls pushers in only when the fight needs them', () => {
    const tasks = planTasks(baseInput({ fights: [spot(350)] })).tasks;
    expect([...tasks.values()].every((task) => task.kind === 'fight')).toBe(true);
  });

  it('counts players already in the fight', () => {
    const tasks = planTasks(baseInput({ fights: [spot(150, 300)] })).tasks;
    expect([...tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
  });

  const laneCounts = (input: PlanInput) => {
    const counts = new Map<string, number>();
    for (const task of planTasks(input).tasks.values()) {
      counts.set(task.lane!, (counts.get(task.lane!) ?? 0) + 1);
    }
    return counts;
  };

  it('splits into two lanes once there are enough bots for two groups', () => {
    expect(laneCounts(baseInput({ bots: bots(5) })).size).toBe(1);
    expect([...laneCounts(baseInput({ bots: bots(8) })).values()]).toEqual([4, 4]);
  });

  it('picks lanes at random weighted by opportunity', () => {
    const input = baseInput({ lanes: [lane('top', -3000), lane('bot', 3000)], random: () => 0.99 });
    expect(planTasks(input).plan?.picks[0].lane).toBe('bot');
  });

  it('keeps the chosen lanes until the lock runs out', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    const picked = first.plan!.picks.map((pick) => pick.lane);
    const later = baseInput({ bots: bots(8), plan: first.plan, now: 150, random: () => 0.99 });
    expect(planTasks(later).plan).toBe(first.plan);

    const expired = planTasks({ ...later, now: 1000 }).plan!.picks.map((pick) => pick.lane);
    expect(expired).not.toEqual(picked);
  });

  it('follows the same lane to the next building after a tower falls', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    const fallen = baseInput({
      bots: bots(8),
      plan: first.plan,
      now: 150,
      random: () => 0.99,
      lanes: [lane('top', -3000), { ...lane('mid', 0), targetId: 7 }, lane('bot', 3000)],
    });
    const result = planTasks(fallen);
    expect(result.plan).toBe(first.plan);
    expect([...result.tasks.values()].some((task) => task.targetId === 7)).toBe(true);
  });

  it('keeps the lanes while a fight borrows some of the bots', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    const fighting = baseInput({ bots: bots(8), plan: first.plan, fights: [spot(250)] });
    expect(planTasks(fighting).plan).toBe(first.plan);
  });

  it('does not move pushers across lanes when a fight borrows their teammates', () => {
    const input = baseInput({ bots: bots(8) });
    const first = planTasks(input);
    input.bots.forEach((bot) => (bot.pushLane = first.tasks.get(bot.id)?.lane));
    const tasks = planTasks({ ...input, plan: first.plan, fights: [spot(250)] }).tasks;
    for (const bot of input.bots) {
      const task = tasks.get(bot.id);
      if (task?.kind === 'push') {
        expect(task.lane).toBe(bot.pushLane);
      }
    }
  });

  it('lets a group farm while its lane waits for the next creep wave', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    const [kept, waiting] = first.plan!.picks;
    const input = baseInput({
      bots: bots(8),
      plan: first.plan,
      lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)].filter(
        (entry) => entry.lane !== waiting.lane,
      ),
    });
    input.bots.forEach((bot, i) => (bot.pushLane = i < 4 ? kept.lane : waiting.lane));
    const result = planTasks(input);
    expect(result.plan).toBe(first.plan);
    expect(result.tasks.get(8)?.kind).toBe('farm');
    expect(result.tasks.get(1)?.lane).toBe(kept.lane);
  });

  it('returns bots to their own lane after a detour', () => {
    const input = baseInput({ bots: bots(8) });
    const plan = planTasks(input).plan!;
    input.bots.forEach((bot) => (bot.pushLane = plan.picks[1].lane));
    input.bots[0].pushLane = plan.picks[0].lane;
    input.bots[0].pos = { x: 99999, y: 0 };
    const tasks = planTasks({ ...input, plan }).tasks;
    expect(tasks.get(1)?.lane).toBe(plan.picks[0].lane);
  });

  it('avoids lanes where the players are when possible', () => {
    const input = baseInput({
      lanes: [lane('top', -3000), lane('mid', 0, 400), lane('bot', 3000)],
    });
    expect([...planTasks(input).tasks.values()].every((task) => task.lane !== 'mid')).toBe(true);
  });

  it('farms when every lane is defended more than twice as strongly', () => {
    const strong = planTasks(
      baseInput({
        lanes: [lane('top', -3000, 1300), lane('mid', 0, 1200), lane('bot', 3000, 1100)],
      }),
    );
    expect([...strong.tasks.values()].every((task) => task.kind === 'farm')).toBe(true);
  });
});
