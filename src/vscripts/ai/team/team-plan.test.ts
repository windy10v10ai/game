import {
  buildLanePath,
  distance,
  forwardProgress,
  nearestLane,
  pointAtProgress,
  projectOnLane,
} from './lane-geometry';
import { shouldUseGlyph } from './glyph';
import { combatPower, damagePerSecond, effectiveHealth } from './power';
import { Activity } from './activity';
import { resolvePushStaging } from './push-staging';
import { pushLevelFor, shouldTakeOver, takeoverFallbackSeconds } from './takeover';
import { DefendStage, PlanInput, PushLane, planTasks, ROSHAN_POWER_MARGIN } from './team-plan';

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
    evasion: 0,
    magicImmune: false,
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

  it('splits into effective health and damage per second', () => {
    expect(Math.sqrt(effectiveHealth(stats) * damagePerSecond(stats))).toBeCloseTo(
      combatPower(stats),
    );
  });

  it('counts evasion and magic immunity as harder to kill, by at most half the damage each', () => {
    const base = combatPower(stats);
    expect(combatPower({ ...stats, evasion: 0.5 })).toBeGreaterThan(base);
    const immune = combatPower({ ...stats, magicImmune: true });
    expect(immune).toBeGreaterThan(base);
    expect(immune).toBeLessThan(base * Math.SQRT2 * 1.2);
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

  it('never takes over before four minutes', () => {
    expect(shouldTakeOver({ ...input, gameTime: 4 * 60 - 1, towersLost: 5 })).toBe(false);
    expect(shouldTakeOver({ ...input, gameTime: 4 * 60, towersLost: 5 })).toBe(true);
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

  it('sends everyone to a base building the enemy is hitting even when a few would do', () => {
    const input = baseInput({ bots: bots(8), defend: [baseThreat('engaged', 150)] });
    input.bots[7].pos = { x: -9000, y: 0 };
    const tasks = [...planTasks(input).tasks.values()];
    expect(tasks.every((task) => task.kind === 'defend')).toBe(true);
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

  it('fights before sending bots home to clear creeps', () => {
    const input = baseInput({ defend: [baseThreat('creeps', 500)], fights: [spot(400)] });
    input.bots.forEach((bot) => (bot.waveClear = true));
    const kinds = [...planTasks(input).tasks.values()].map((task) => task.kind);
    // 打这一架要派全队，清兵不能先把人抽走
    expect(kinds.filter((kind) => kind === 'fight')).toHaveLength(5);
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

  const spot = (enemyPower: number) => ({
    pos: { x: 500, y: 0 },
    enemyPower,
    allyPower: 0,
    focusId: 99,
    rally: { x: -2000, y: 0 },
    pastFront: false,
    engaged: false,
  });

  it('does not send bots after an enemy whose tower would kill them first', () => {
    const tasks = planTasks(baseInput({ fights: [{ ...spot(250), towerSafe: true }] })).tasks;
    expect([...tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
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
    const fresh = planTasks(baseInput({ fights: [spot(1200)] })).tasks;
    expect([...fresh.values()].some((task) => task.kind === 'fight')).toBe(false);
    const fighting = new Map([
      [1, 99],
      [2, 99],
      [3, 99],
    ]);
    const kept = planTasks(baseInput({ fights: [spot(1200)], fighting })).tasks;
    expect([1, 2, 3].map((id) => kept.get(id)?.kind)).toEqual(['fight', 'fight', 'fight']);
    const hopeless = planTasks(baseInput({ fights: [spot(5000)], fighting })).tasks;
    expect([...hopeless.values()].some((task) => task.kind === 'fight')).toBe(false);
  });

  it('sends every bot that can get there to a winnable fight and leaves the far ones pushing', () => {
    const input = baseInput({ fights: [spot(250)] });
    input.bots[4].pos = { x: 9000, y: 0 };
    const tasks = planTasks(input).tasks;
    expect([1, 2, 3, 4].map((id) => tasks.get(id)?.kind)).toEqual([
      'fight',
      'fight',
      'fight',
      'fight',
    ]);
    expect(tasks.get(1)?.targetId).toBe(99);
    expect(tasks.get(5)?.kind).toBe('push');
  });

  it('takes on a fight the whole team is slightly weaker in', () => {
    const tasks = planTasks(baseInput({ fights: [spot(900)] })).tasks;
    expect([...tasks.values()].every((task) => task.kind === 'fight')).toBe(true);
  });

  it('counts a far bot with teleport ready as able to get to the fight', () => {
    const input = baseInput({ fights: [spot(250)] });
    input.bots[4].pos = { x: 9000, y: 0 };
    input.bots[4].teleportReady = true;
    expect(planTasks(input).tasks.get(5)?.kind).toBe('fight');
  });

  it('sends everyone needed straight toward the fight instead of waiting at a rally point', () => {
    const input = baseInput({ fights: [spot(900)] });
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

  it('pulls pushers in even when the fight could be won without them', () => {
    const tasks = planTasks(baseInput({ fights: [spot(100)] })).tasks;
    expect([...tasks.values()].every((task) => task.kind === 'fight')).toBe(true);
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

  it('merges into one lane when half the team could not beat the enemy', () => {
    expect([...laneCounts(baseInput({ bots: bots(8), enemyPower: 300 })).values()]).toEqual([4, 4]);
    expect([...laneCounts(baseInput({ bots: bots(8), enemyPower: 500 })).values()]).toEqual([8]);
  });

  it('pushes one lane together during a group push and drops the split plan at once', () => {
    const first = planTasks(baseInput({ bots: bots(8) }));
    expect(first.plan!.picks).toHaveLength(2);
    const group = baseInput({ bots: bots(8), plan: first.plan, now: 150, groupPush: true });
    expect([...laneCounts(group).values()]).toEqual([8]);
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

  it('keeps away from where an unbeatable enemy was seen a moment ago', () => {
    const input = baseInput({
      lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)],
      avoided: [{ x: 0, y: 0 }],
    });
    expect([...planTasks(input).tasks.values()].every((task) => task.lane !== 'mid')).toBe(true);
  });

  it('reports fights the whole team cannot take so the area stays avoided', () => {
    const fight = {
      pos: { x: 0, y: 0 },
      enemyPower: 1e6,
      allyPower: 0,
      focusId: 99,
      rally: { x: -2000, y: 0 },
      pastFront: false,
      engaged: false,
    };
    expect(planTasks(baseInput({ fights: [fight] })).avoid).toEqual([{ x: 0, y: 0 }]);
  });

  it('stops sending bots to fights while resting from fighting and keeps away from them', () => {
    const result = planTasks(
      baseInput({
        lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)],
        fights: [{ ...spot(100), pos: { x: 0, y: 0 } }],
        resting: new Set<Activity>(['fight']),
      }),
    );
    expect([...result.tasks.values()].some((task) => task.kind === 'fight')).toBe(false);
    expect([...result.tasks.values()].every((task) => task.lane !== 'mid')).toBe(true);
  });

  it('switches away from lanes the team has been stuck pushing', () => {
    const input = baseInput({
      lanes: [lane('top', -3000), lane('mid', 0), lane('bot', 3000)],
      resting: new Set<Activity>(['push']),
      tiredLanes: ['top', 'bot'],
    });
    expect([...planTasks(input).tasks.values()].every((task) => task.lane === 'mid')).toBe(true);
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

describe('high ground', () => {
  const highGround = (name: PushLane['lane'], x: number) => ({
    ...lane(name, x),
    highGround: true,
  });
  const kinds = (input: PlanInput) => [...planTasks(input).tasks.values()];

  it('pushes the remaining outer towers before going up high ground', () => {
    const tasks = kinds(
      baseInput({ lanes: [highGround('top', -3000), lane('mid', 0)], enemyPower: 300 }),
    );
    expect(tasks.every((task) => task.lane === 'mid')).toBe(true);
  });

  it('keeps the outer-first order while a lane has no creep wave to push with', () => {
    const tasks = kinds(
      baseInput({ lanes: [highGround('top', -3000)], outerTowersLeft: true, enemyPower: 300 }),
    );
    expect(tasks.every((task) => task.kind === 'farm')).toBe(true);
  });

  it('storms high ground when the team is not far stronger', () => {
    const tasks = kinds(baseInput({ lanes: [highGround('top', -3000)], enemyPower: 300 }));
    expect(tasks.every((task) => task.kind === 'push' && task.lane === 'top')).toBe(true);
  });

  it('farms around the high ground push point when far stronger', () => {
    const tasks = kinds(
      baseInput({
        lanes: [highGround('top', -3000)],
        enemyPower: 50,
        farms: [
          { pos: { x: 100, y: 0 }, ancient: false },
          { pos: { x: -2800, y: 0 }, ancient: false },
        ],
      }),
    );
    expect(tasks.every((task) => task.kind === 'farm' && task.pos.x === -2800)).toBe(true);
  });

  it('judges dominance by strength, counting bots that are dead for now', () => {
    const tasks = kinds(
      baseInput({
        bots: bots(2),
        lanes: [highGround('top', -3000)],
        enemyPower: 150,
        teamStrength: 500,
      }),
    );
    expect(tasks.every((task) => task.kind === 'farm')).toBe(true);
  });

  it('keeps pressing outside high ground while dominance dips a little', () => {
    const input = baseInput({ lanes: [highGround('top', -3000)], enemyPower: 230 });
    expect(kinds(input).every((task) => task.kind === 'push')).toBe(true);
    expect(kinds({ ...input, siege: true }).every((task) => task.kind === 'farm')).toBe(true);
  });

  it('keeps the pressing state while every bot is off fighting', () => {
    const fights = [
      {
        pos: { x: 0, y: 0 },
        enemyPower: 40,
        allyPower: 0,
        focusId: 50,
        rally: { x: 0, y: 0 },
        pastFront: false,
        engaged: false,
      },
    ];
    const result = planTasks(
      baseInput({ lanes: [highGround('top', -3000)], enemyPower: 50, fights }),
    );
    expect([...result.tasks.values()].every((task) => task.kind === 'fight')).toBe(true);
    expect(result.siege).toBe(true);
  });

  it('stops pressing and goes up once the team has farmed around high ground too long', () => {
    const tasks = kinds(
      baseInput({
        lanes: [highGround('top', -3000)],
        enemyPower: 50,
        siege: true,
        resting: new Set<Activity>(['farm']),
      }),
    );
    expect(tasks.every((task) => task.kind === 'push')).toBe(true);
  });

  it('storms high ground during a group push even when far stronger', () => {
    const tasks = kinds(
      baseInput({ lanes: [highGround('top', -3000)], enemyPower: 50, groupPush: true }),
    );
    expect(tasks.every((task) => task.kind === 'push')).toBe(true);
  });
});

describe('roshan', () => {
  // 留给玩家的 2 分钟已过，三个 bot 刚好够打
  const roshan = {
    id: 900,
    pos: { x: 5000, y: 0 },
    power: 300 / ROSHAN_POWER_MARGIN,
    aliveSeconds: 150,
    waitSeconds: 120,
  };
  const needing = (count: number) => ({ ...roshan, power: (count * 100) / ROSHAN_POWER_MARGIN });
  // 编号越大离肉山越近
  const spreadBots = () => bots(5).map((bot) => ({ ...bot, pos: { x: bot.id * 500, y: 0 } }));
  const roshanTasks = (input: PlanInput) =>
    [...planTasks(input).tasks.entries()].filter(([, task]) => task.kind === 'roshan');

  it('sends the nearest bots with enough power and keeps the rest pushing', () => {
    const tasks = roshanTasks(baseInput({ bots: spreadBots(), roshan }));
    expect(tasks.map(([id]) => id).sort()).toEqual([3, 4, 5]);
    expect(tasks[0][1].targetId).toBe(900);
  });

  it('keeps the squad on roshan without re-checking the start bar', () => {
    // 两人战力 200，达不到开打要的 4 倍，但仍稳稳强过肉山，继续打
    const tasks = roshanTasks(
      baseInput({ bots: spreadBots(), roshan: needing(4), roshanSquad: new Set([2, 5]) }),
    );
    expect(tasks.map(([id]) => id).sort()).toEqual([2, 5]);
  });

  it('tops up a squad that lost members until it outpowers roshan again', () => {
    const tasks = roshanTasks(
      baseInput({ bots: spreadBots(), roshan: needing(5), roshanSquad: new Set([2, 5]) }),
    );
    expect(tasks.map(([id]) => id).sort()).toEqual([2, 4, 5]);
  });

  it('pulls the whole squad off once too many have left, instead of leaving one on roshan', () => {
    const input = baseInput({
      bots: spreadBots().map((bot) => ({ ...bot, needsRecover: bot.id !== 5 })),
      roshan: needing(3),
      roshanSquad: new Set([4, 5]),
    });
    expect(roshanTasks(input)).toEqual([]);
  });

  it('calls off roshan when even the top-up cannot outpower it', () => {
    const tasks = roshanTasks(
      baseInput({ bots: spreadBots(), roshan: needing(24), roshanSquad: new Set([2, 5]) }),
    );
    expect(tasks).toEqual([]);
  });

  it('gives players a few minutes after roshan appears', () => {
    expect(
      roshanTasks(baseInput({ bots: spreadBots(), roshan: { ...roshan, aliveSeconds: 60 } })),
    ).toEqual([]);
  });

  it('waits while roshan would take more than half the team', () => {
    expect(roshanTasks(baseInput({ bots: spreadBots(), roshan: needing(4) }))).toEqual([]);
  });

  it('lets the whole team go once roshan has been up for long', () => {
    const late = { ...needing(4), aliveSeconds: 600 };
    const tasks = roshanTasks(baseInput({ bots: spreadBots(), roshan: late }));
    expect(tasks.map(([id]) => id).sort()).toEqual([2, 3, 4, 5]);
  });

  it('sneaks roshan even when the enemy is stronger than the whole team', () => {
    expect(roshanTasks(baseInput({ bots: spreadBots(), roshan, enemyPower: 5000 }))).not.toEqual(
      [],
    );
  });

  it('skips roshan while a building needs defending', () => {
    const defend = [
      {
        id: 7,
        pos: { x: 0, y: 0 },
        stage: 'creeps' as DefendStage,
        isBase: false,
        core: false,
        importance: 1,
        hpRatio: 1,
        attackerPower: 50,
      },
    ];
    expect(roshanTasks(baseInput({ bots: spreadBots(), roshan, defend }))).toEqual([]);
  });

  it('skips roshan when the free bots together cannot kill it', () => {
    expect(
      roshanTasks(baseInput({ bots: spreadBots(), roshan: { ...needing(6), aliveSeconds: 600 } })),
    ).toEqual([]);
  });

  it('leaves the roshan squad out of a fight that is already won without it', () => {
    const fights = [
      {
        pos: { x: -2000, y: 0 },
        enemyPower: 100,
        allyPower: 0,
        focusId: 50,
        rally: { x: 0, y: 0 },
        pastFront: false,
        engaged: false,
      },
    ];
    const tasks = roshanTasks(
      baseInput({ bots: spreadBots(), roshan, fights, roshanSquad: new Set([4, 5]) }),
    );
    expect(tasks.map(([id]) => id).sort()).toEqual([4, 5]);
  });

  it('does not set out for roshan while a fight is going on', () => {
    const fights = [
      {
        pos: { x: -9000, y: 0 },
        enemyPower: 50,
        allyPower: 0,
        focusId: 50,
        rally: { x: 0, y: 0 },
        pastFront: false,
        engaged: false,
      },
    ];
    expect(roshanTasks(baseInput({ bots: spreadBots(), roshan, fights }))).toEqual([]);
  });

  const farFight = (x: number) => ({
    pos: { x, y: 0 },
    enemyPower: 50,
    allyPower: 0,
    focusId: 50,
    rally: { x: 0, y: 0 },
    pastFront: false,
    engaged: false,
  });

  it('goes for roshan while resting from a fight elsewhere', () => {
    const tasks = roshanTasks(
      baseInput({
        bots: spreadBots(),
        roshan,
        fights: [farFight(-9000)],
        resting: new Set<Activity>(['fight']),
      }),
    );
    expect(tasks.map(([id]) => id).sort()).toEqual([3, 4, 5]);
  });

  it('stays off roshan while the enemy is right next to it', () => {
    const input = baseInput({
      bots: spreadBots(),
      roshan,
      fights: [farFight(5200)],
      resting: new Set<Activity>(['fight']),
    });
    expect(roshanTasks(input)).toEqual([]);
  });

  it('lets a fight take bots first', () => {
    const fights = [
      {
        pos: { x: 1000, y: 0 },
        enemyPower: 300,
        allyPower: 0,
        focusId: 50,
        rally: { x: 0, y: 0 },
        pastFront: false,
        engaged: false,
      },
    ];
    expect(roshanTasks(baseInput({ bots: spreadBots(), roshan, fights }))).toEqual([]);
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
