import {
  buildLanePath,
  distance,
  forwardProgress,
  nearestLane,
  pointAtProgress,
  projectOnLane,
} from './lane-geometry';
import { shouldUseGlyph } from './glyph';
import { combatPower, decayThreat, threatMultiplier } from './power';
import { resolvePushStaging } from './push-staging';
import { pushLevelFor, shouldTakeOver, takeoverFallbackSeconds } from './takeover';
import { DefendStage, PlanInput, PushLane, planTasks } from './team-plan';

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
            stage: 'engaged',
            isBase: false,
            core: false,
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
      stage: 'engaged' as const,
      core: false,
      importance: 1,
      hpRatio: 0.5,
      attackerPower: 5000,
    };
    const outer = planTasks(baseInput({ defend: [{ ...threat, isBase: false }] }));
    expect([...outer.tasks.values()].some((task) => task.kind === 'defend')).toBe(false);
    const base = planTasks(baseInput({ defend: [{ ...threat, isBase: true }] }));
    expect([...base.tasks.values()].every((task) => task.kind === 'defend')).toBe(true);
  });

  const baseThreat = (stage: DefendStage, attackerPower: number) => ({
    id: 60,
    pos: { x: 2000, y: 0 },
    stage,
    isBase: true,
    core: false,
    importance: 4,
    hpRatio: 1,
    attackerPower,
  });

  it('sends one controller to wait behind the base when enemy heroes approach', () => {
    const input = baseInput({ defend: [baseThreat('warning', 5000)] });
    input.bots[2].control = true;
    input.bots[2].pos = { x: 8000, y: 0 };
    const tasks = [...planTasks(input).tasks.entries()].filter(
      ([, task]) => task.kind === 'defend',
    );
    expect(tasks.map(([id]) => id)).toEqual([3]);
    const pos = tasks[0][1].pos;
    // 站在建筑靠自家泉水一侧，不迎着敌人来的方向
    expect(distance(pos, { x: -1000, y: -1000 })).toBeLessThan(
      distance({ x: 2000, y: 0 }, { x: -1000, y: -1000 }),
    );
  });

  it('sends a far bot with teleport ready before a nearer one that has to walk', () => {
    const input = baseInput({ defend: [{ ...baseThreat('engaged', 80), isBase: false }] });
    input.bots[0].pos = { x: 5000, y: 0 };
    input.bots[1].pos = { x: 12000, y: 0 };
    input.bots[1].teleportReady = true;
    input.bots.slice(2).forEach((bot) => (bot.pos = { x: -9000, y: 0 }));
    const tasks = planTasks(input).tasks;
    expect(tasks.get(2)?.kind).toBe('defend');
    expect(tasks.get(1)?.kind).not.toBe('defend');
  });

  it('sends a few wave clearers against creeps pushing the base', () => {
    const input = baseInput({ defend: [baseThreat('creeps', 300)] });
    input.bots[0].waveClear = true;
    // 2、3 号既没有范围清兵技能、普攻也不高，离得再近也不派
    input.bots[1].pos = { x: 2000, y: 0 };
    input.bots[2].pos = { x: 2000, y: 0 };
    const tasks = planTasks(input).tasks;
    const defenders = [...tasks.entries()].filter(([, task]) => task.kind === 'defend');
    expect(defenders.map(([id]) => id).sort()).toEqual([1, 4]);
  });

  it('leaves a wave the buildings can hold to one nearby clearer who farms it', () => {
    // 扣掉建筑战力后威胁不剩，附近有人就派一个去吃兵，远处的不回
    const near = baseInput({ defend: [baseThreat('creeps', 0)] });
    near.bots.forEach((bot) => (bot.waveClear = true));
    near.bots[2].pos = { x: 1500, y: 0 };
    const nearTasks = [...planTasks(near).tasks.entries()].filter(([, t]) => t.kind === 'defend');
    expect(nearTasks.map(([id]) => id)).toEqual([3]);

    const far = baseInput({ defend: [baseThreat('creeps', 0)] });
    far.bots.forEach((bot) => {
      bot.waveClear = true;
      bot.pos = { x: 9000, y: 0 };
    });
    expect([...planTasks(far).tasks.values()].some((t) => t.kind === 'defend')).toBe(false);
  });

  it('sends at least one bot against a weak creep wave', () => {
    const tasks = planTasks(baseInput({ defend: [baseThreat('creeps', 10)] })).tasks;
    expect([...tasks.values()].filter((task) => task.kind === 'defend')).toHaveLength(1);
  });

  it('asks bots defending the core base to hold their ground', () => {
    const core = planTasks(
      baseInput({ defend: [{ ...baseThreat('engaged', 5000), core: true }] }),
    ).tasks;
    expect([...core.values()].every((task) => task.kind === 'defend' && task.hold)).toBe(true);
    const highGround = planTasks(baseInput({ defend: [baseThreat('engaged', 5000)] })).tasks;
    expect([...highGround.values()].every((task) => task.kind === 'defend')).toBe(true);
    expect([...highGround.values()].some((task) => task.hold)).toBe(false);
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

  it('keeps bots already fighting a target until the enemy is far stronger', () => {
    // 全队也凑不够开新仗的余量，但上一轮已经在打的人不因此掉头
    const fresh = planTasks(baseInput({ fights: [spot(450)] })).tasks;
    expect([...fresh.values()].some((task) => task.kind === 'fight')).toBe(false);
    const fighting = new Map([
      [1, 99],
      [2, 99],
      [3, 99],
    ]);
    const kept = planTasks(baseInput({ fights: [spot(450)], fighting })).tasks;
    expect([1, 2, 3].map((id) => kept.get(id)?.kind)).toEqual(['fight', 'fight', 'fight']);
    const hopeless = planTasks(baseInput({ fights: [spot(5000)], fighting })).tasks;
    expect([...hopeless.values()].some((task) => task.kind === 'fight')).toBe(false);
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

  it('sends everyone needed straight toward the fight instead of waiting at a rally point', () => {
    const input = baseInput({ fights: [spot(400)] });
    input.bots.forEach((bot) => (bot.pos = { x: -9000, y: 0 }));
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.kind);
    expect(kinds.filter((kind) => kind === 'fight')).toHaveLength(5);
  });

  it('calls a pusher standing right next to the fight', () => {
    const input = baseInput({ fights: [spot(150)] });
    input.bots.forEach((bot) => (bot.pos = { x: -9000, y: 0 }));
    input.bots[4].pos = { x: 500, y: 0 };
    expect(planTasks(input).tasks.get(5)?.kind).toBe('fight');
  });

  it('pushes away from a fight the whole team cannot win instead of fleeing', () => {
    const input = baseInput({ fights: [spot(1200)] });
    const tasks = [...planTasks(input).tasks.values()];
    expect(tasks.some((task) => task.kind === 'fight')).toBe(false);
    expect(tasks.every((task) => task.lane !== 'mid')).toBe(true);
  });

  it('calls in bots from across the map to a fight nearby bots cannot win alone', () => {
    const input = baseInput({ fights: [{ ...spot(400), engaged: true }] });
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

  it('keeps the lanes when bots go home or die during the lock', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    const fewer = baseInput({ bots: bots(8), plan: first.plan, now: 150, random: () => 0.99 });
    fewer.bots.slice(0, 4).forEach((bot) => (bot.needsRecover = true));
    expect(planTasks(fewer).plan).toBe(first.plan);
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

describe('glyph', () => {
  const glyph = (tier: number, hpRatio: number, fallSeconds: number, defenderEta = Infinity) =>
    shouldUseGlyph({ tier, hpRatio, fallSeconds, defenderEta });

  it('opens earlier against fast pushers regardless of health', () => {
    expect(glyph(3, 0.7, 7)).toBe(true);
    expect(glyph(3, 0.3, 30)).toBe(false);
    expect(glyph(1, 0.2, 20)).toBe(false);
    expect(glyph(1, 0.9, 5)).toBe(true);
  });

  it('opens on the last sliver of health', () => {
    expect(glyph(1, 0.05, 30)).toBe(true);
  });

  it('gives the core base more time than outer towers', () => {
    expect(glyph(6, 0.8, 9)).toBe(true);
    expect(glyph(1, 0.8, 9)).toBe(false);
  });

  it('opens a tier 2 tower or barracks only when defenders arrive in time', () => {
    expect(glyph(2, 0.5, 5)).toBe(false);
    expect(glyph(2, 0.5, 5, 8)).toBe(true);
    expect(glyph(4, 0.5, 5, 30)).toBe(false);
  });
});
