import {
  countHeldWards,
  HeldItem,
  isZoneEnabled,
  canPlaceInZone,
  detourRange,
  isZoneFree,
  regularCapReached,
  wardUnits,
  groupUsed,
  pickNearestTarget,
  pickWardBuyer,
  resolveTargets,
  ResolveTargetsInput,
  shouldDropSentry,
  TargetPick,
  WardTier,
  WardZone,
} from './ward-decision';
import {
  OBSERVER_WARD_CONFIG,
  POSITION_JITTER,
  SENTRY_WARD_CONFIG,
  WardTypeConfig,
  WardZoneData,
} from './ward-position-config';

/** 判定只用到 __sub 与 Length2D，构造最小替身即可 */
function vec(x: number, y: number, z = 0): Vector {
  return {
    x,
    y,
    z,
    __sub: (other: Vector) => vec(x - other.x, y - other.y, z - other.z),
    Length2D: () => Math.sqrt(x * x + y * y),
  } as unknown as Vector;
}

/** 固定序列的随机数：依次取，取模到范围内 */
function sequence(...values: number[]): (n: number) => number {
  let i = 0;
  return (n) => values[i++ % values.length] % n;
}

function zone(id: string, group: string, x: number, tier: WardTier = 'always', tower?: string) {
  const result: WardZone = { id, group, tier, tower, spots: [vec(x, 0), vec(x + 100, 0)] };
  return result;
}

/** 配置里是原始坐标，自检直接按坐标算，不依赖引擎的 Vector */
type Spot = readonly [number, number];
const dist = (a: Spot, b: Spot) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
const sides = ['radiant', 'dire'] as const;
const configs: ReadonlyArray<readonly [string, WardTypeConfig]> = [
  ['假眼', OBSERVER_WARD_CONFIG],
  ['真眼', SENTRY_WARD_CONFIG],
];

describe('分阵营取点', () => {
  it('天辉与夜魇各有自己的点位', () => {
    for (const [, config] of configs) {
      const { radiant, dire } = config.sides;
      expect(radiant.zones.length).toBeGreaterThan(0);
      expect(dire.zones.length).toBeGreaterThan(0);
      expect(radiant.zones).not.toBe(dire.zones);
      expect(radiant.zones.map((item) => item.id)).not.toEqual(dire.zones.map((item) => item.id));
    }
  });
});

describe('配置数据自检', () => {
  // 眼落地后按备选点到眼的距离判占用，落点带偏移，不同区的备选点要隔开去重半径加偏移才不会互相挤占
  const MIN_ZONE_GAP = OBSERVER_WARD_CONFIG.sameWardRadius + POSITION_JITTER;

  describe.each(configs)('%s', (_name, config) => {
    const zonesOf = (side: (typeof sides)[number]): readonly WardZoneData[] =>
      config.sides[side].zones;

    it.each(sides)('%s 不同区的备选点两两距离不小于去重半径加偏移', (side) => {
      const zones = zonesOf(side);
      const violations: string[] = [];
      for (const a of zones) {
        for (const b of zones) {
          if (b.id <= a.id) continue;
          for (const x of a.spots) {
            for (const y of b.spots) {
              if (dist(x, y) < MIN_ZONE_GAP) {
                violations.push(`${a.id}-${b.id}:${Math.round(dist(x, y))}`);
              }
            }
          }
        }
      }
      expect(violations).toEqual([]);
    });

    // 区占用按「任一备选点附近有眼」整区判，备选点相距略超去重半径也不会重复插
    it.each(sides)('%s 同一区的备选点互相都在 1100 内', (side) => {
      for (const item of zonesOf(side)) {
        expect(item.spots.length).toBeGreaterThan(0);
        for (const a of item.spots) {
          for (const b of item.spots) {
            expect(dist(a, b)).toBeLessThanOrEqual(1100);
          }
        }
      }
    });

    it.each(sides)('%s 区 id 唯一，每个区的组都有上限', (side) => {
      const zones = zonesOf(side);
      expect(new Set(zones.map((item) => item.id)).size).toBe(zones.length);
      for (const item of zones) {
        expect(config.sides[side].groupLimits[item.group]).toBeGreaterThanOrEqual(1);
      }
    });

    it.each(sides)('%s 每个组的上限不超过组内区数', (side) => {
      const { groupLimits } = config.sides[side];
      for (const [group, limit] of Object.entries(groupLimits)) {
        const count = zonesOf(side).filter((item) => item.group === group).length;
        expect(limit).toBeLessThanOrEqual(count);
      }
    });

    it.each([
      ['radiant', 'goodguys_tower', 'badguys_tower'],
      ['dire', 'badguys_tower', 'goodguys_tower'],
    ] as const)('%s defend 绑己方塔，push 绑敌方塔', (side, own, enemy) => {
      for (const item of zonesOf(side)) {
        if (item.tier === 'defend') {
          expect(item.tower).toMatch(new RegExp(`^${own}[123]_(top|mid|bot)$`));
        } else if (item.tier === 'push') {
          expect(item.tower).toMatch(new RegExp(`^${enemy}[123]_(top|mid|bot)$`));
        } else {
          expect(item.tower).toBeUndefined();
        }
      }
    });
  });
});

describe('档位启用条件', () => {
  const alive = ['npc_dota_badguys_tower3_mid', 'npc_dota_goodguys_tower1_top'];

  it.each(['always', 'attack'] as const)('%s 随时启用，不看塔', (tier) => {
    expect(isZoneEnabled(zone('a', 'g', 0, tier), alive)).toBe(true);
    expect(isZoneEnabled(zone('a', 'g', 0, tier), [])).toBe(true);
  });

  it('defend 绑的己方塔活着不启用，塔倒后启用，别的塔活着不影响', () => {
    const defend = zone('a', 'g', 0, 'defend', 'goodguys_tower1_top');
    expect(isZoneEnabled(defend, alive)).toBe(false);
    expect(isZoneEnabled(defend, ['npc_dota_badguys_tower3_mid'])).toBe(true);
    // An empty list means the tower cache is not ready, not that every tower is dead.
    expect(isZoneEnabled(defend, [])).toBe(false);
  });

  it('push 绑的敌方塔活着不启用，塔倒后启用', () => {
    const push = zone('a', 'g', 0, 'push', 'badguys_tower3_mid');
    expect(isZoneEnabled(push, alive)).toBe(false);
    expect(isZoneEnabled(push, ['npc_dota_goodguys_tower1_top'])).toBe(true);
  });
});

describe('区占用', () => {
  const zoneA = zone('a', 'g', 0);

  it('区里已有己方眼时整个区都算占用', () => {
    expect(isZoneFree(zoneA, [vec(650, 100)], 800)).toBe(false);
    expect(isZoneFree(zoneA, [vec(5000, 0)], 800)).toBe(true);
  });

  it('备选点相距超过去重半径时，任一点旁有眼整个区也算占用', () => {
    const wide: WardZone = {
      id: 'w',
      group: 'g',
      tier: 'always',
      spots: [vec(0, 0), vec(1050, 0)],
    };
    expect(isZoneFree(wide, [vec(0, 40)], 900)).toBe(false);
    expect(isZoneFree(wide, [vec(1050, 40)], 900)).toBe(false);
    expect(isZoneFree(wide, [vec(5000, 0)], 900)).toBe(true);
  });
});

describe('分组抽区', () => {
  const base = (patch: Partial<ResolveTargetsInput>): ResolveTargetsInput => ({
    zones: [],
    groupLimits: {},
    aliveTowerNames: [],
    wards: [],
    claims: [],
    sameWardRadius: 900,
    now: 0,
    ttl: 90,
    picks: new Map<string, TargetPick>(),
    stateKeyPrefix: 't|',
    random: sequence(0),
    ...patch,
  });
  // 一组 3 个区，间隔 2000，彼此不挤占
  const group = [zone('a', 'g', 0), zone('b', 'g', 2000), zone('c', 'g', 4000)];
  const one = { g: 1 };

  it('同一组的区等概率抽到：固定随机序列能覆盖组内每个区与每个备选点', () => {
    const zones = new Set<string>();
    const spots = new Set<number>();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const [target] = resolveTargets(
          base({ zones: group, groupLimits: one, random: sequence(i, j) }),
        );
        zones.add(target.zoneId);
        spots.add(target.spot.x);
      }
    }
    expect([...zones].sort()).toEqual(['a', 'b', 'c']);
    expect(spots.size).toBe(6);
  });

  it('抽区不看离谁近：随机数落在远处的区就是远处的区', () => {
    const [target] = resolveTargets(
      base({ zones: group, groupLimits: one, random: sequence(2, 0) }),
    );
    expect(target.zoneId).toBe('c');
  });

  it('每个有空槽的组各出一个目标', () => {
    const zones = [...group, zone('x', 'h', 8000), zone('y', 'h', 10000)];
    const targets = resolveTargets(base({ zones, groupLimits: { g: 1, h: 1 } }));
    expect(targets.map((item) => item.group)).toEqual(['g', 'h']);
  });

  it('组已满不再抽，哪怕还有启用的空区', () => {
    const picks = new Map<string, TargetPick>();
    const targets = resolveTargets(
      base({ zones: group, groupLimits: one, wards: [vec(0, 0)], picks }),
    );
    expect(targets).toEqual([]);
    expect(picks.size).toBe(0);
  });

  it('上限为 2 时占 1 个还有空槽，抽的是别的区，占满 2 个才停', () => {
    const half = resolveTargets(base({ zones: group, groupLimits: { g: 2 }, wards: [vec(0, 0)] }));
    expect(half).toHaveLength(1);
    expect(half[0].zoneId).not.toBe('a');
    const full = resolveTargets(
      base({ zones: group, groupLimits: { g: 2 }, wards: [vec(0, 0), vec(2000, 0)] }),
    );
    expect(full).toEqual([]);
  });

  it('只从启用的区里抽：defend 塔活着的区不会被抽到', () => {
    const zones = [
      zone('a', 'g', 0, 'defend', 'goodguys_tower1_top'),
      zone('b', 'g', 2000, 'defend', 'goodguys_tower1_bot'),
    ];
    for (let i = 0; i < 4; i++) {
      const [target] = resolveTargets(
        base({
          zones,
          groupLimits: one,
          aliveTowerNames: ['npc_dota_goodguys_tower1_top'],
          random: sequence(i, i),
        }),
      );
      expect(target.zoneId).toBe('b');
    }
    const bothAlive = ['npc_dota_goodguys_tower1_top', 'npc_dota_goodguys_tower1_bot'];
    expect(resolveTargets(base({ zones, groupLimits: one, aliveTowerNames: bothAlive }))).toEqual(
      [],
    );
  });

  it('push 对敌塔同理：塔倒后才有目标', () => {
    const zones = [zone('p', 'g', 0, 'push', 'badguys_tower3_mid')];
    const alive = ['npc_dota_badguys_tower3_mid'];
    expect(resolveTargets(base({ zones, groupLimits: one, aliveTowerNames: alive }))).toEqual([]);
    const other = ['npc_dota_goodguys_tower1_top'];
    expect(
      resolveTargets(base({ zones, groupLimits: one, aliveTowerNames: other }))[0].zoneId,
    ).toBe('p');
    expect(resolveTargets(base({ zones, groupLimits: one }))).toEqual([]);
  });

  it('目标抽定后保留，期间别的随机数不改变它，超时才重抽', () => {
    const picks = new Map<string, TargetPick>();
    const first = resolveTargets(
      base({ zones: group, groupLimits: one, picks, random: sequence(1, 1) }),
    );
    const later = resolveTargets(
      base({ zones: group, groupLimits: one, picks, now: 60, random: sequence(2, 0) }),
    );
    expect(later[0]).toEqual(first[0]);
    const expired = resolveTargets(
      base({ zones: group, groupLimits: one, picks, now: 91, random: sequence(2, 0) }),
    );
    expect(expired[0].zoneId).toBe('c');
  });

  it('目标区被占用后重抽别的区', () => {
    const picks = new Map<string, TargetPick>();
    const limit = { g: 2 };
    resolveTargets(base({ zones: group, groupLimits: limit, picks, random: sequence(0, 0) }));
    const next = resolveTargets(
      base({
        zones: group,
        groupLimits: limit,
        picks,
        wards: [vec(0, 0)],
        random: sequence(0, 0),
      }),
    );
    expect(next[0].zoneId).toBe('b');
  });

  it('两队各有自己的状态键，互不影响', () => {
    const picks = new Map<string, TargetPick>();
    resolveTargets(base({ zones: group, groupLimits: one, picks, stateKeyPrefix: 'r|' }));
    resolveTargets(
      base({
        zones: group,
        groupLimits: one,
        picks,
        stateKeyPrefix: 'd|',
        random: sequence(2, 0),
      }),
    );
    expect([...picks.keys()].sort()).toEqual(['d|g', 'r|g']);
  });
});

describe('tower state', () => {
  it('push and defend stay closed while the tower list is empty', () => {
    expect(isZoneEnabled(zone('a', 'g', 0, 'push', 'badguys_tower3_mid'), [])).toBe(false);
    expect(isZoneEnabled(zone('a', 'g', 0, 'defend', 'goodguys_tower1_top'), [])).toBe(false);
  });

  it('they open only once the tower is gone from a non-empty list', () => {
    const alive = ['npc_dota_badguys_tower3_top'];
    expect(isZoneEnabled(zone('a', 'g', 0, 'push', 'badguys_tower3_mid'), alive)).toBe(true);
  });

  it('a defend or push zone without a tower field never opens', () => {
    expect(isZoneEnabled(zone('a', 'g', 0, 'push'), ['npc_dota_x'])).toBe(false);
  });
});

describe('group quota counts ward entities', () => {
  const near = zone('near', 'g', 0);
  const next = zone('next', 'g', 1000);
  const zones = [near, next];

  it('one ward covering two zones takes one slot', () => {
    expect(groupUsed(zones, [vec(550, 0)], 900)).toBe(1);
  });

  it('two wards in one zone take two slots', () => {
    expect(groupUsed(zones, [vec(0, 0), vec(50, 0)], 900)).toBe(2);
  });

  it('a ward that blocks both zones still leaves a limit-2 group open for a third zone', () => {
    const far = zone('far', 'g', 5000);
    const targets = resolveTargets({
      zones: [near, next, far],
      groupLimits: { g: 2 },
      aliveTowerNames: [],
      wards: [vec(550, 0)],
      claims: [],
      sameWardRadius: 900,
      now: 0,
      ttl: 90,
      picks: new Map<string, TargetPick>(),
      stateKeyPrefix: 't|',
      random: sequence(0),
    });
    expect(targets.map((item) => item.zoneId)).toEqual(['far']);
  });

  it('a claim next to a landed ward is not counted twice', () => {
    expect(wardUnits([vec(0, 0)], [vec(30, 0)], 900)).toHaveLength(1);
    expect(wardUnits([vec(0, 0)], [vec(3000, 0)], 900)).toHaveLength(2);
  });
});

describe('re-check before casting', () => {
  const zones = [zone('a', 'g', 0), zone('b', 'g', 3000)];
  const input = (wards: Vector[], claims: Vector[] = []) => ({
    groupLimits: { g: 1 },
    aliveTowerNames: [],
    wards,
    claims,
    sameWardRadius: 900,
  });

  it('allows an open zone', () => {
    expect(canPlaceInZone(zones, 'a', input([]))).toBe(true);
  });

  it('gives up when the zone was taken after it was drawn', () => {
    expect(canPlaceInZone(zones, 'a', input([vec(100, 0)]))).toBe(false);
  });

  it('gives up when the group filled up through another zone', () => {
    expect(canPlaceInZone(zones, 'a', input([vec(3000, 0)]))).toBe(false);
  });

  it('gives up when the tower is not confirmed gone', () => {
    const gated = [zone('a', 'g', 0, 'push', 'badguys_tower3_mid')];
    expect(canPlaceInZone(gated, 'a', input([]))).toBe(false);
  });
});

describe('detour range', () => {
  it('stays short until the ward has been carried long enough, then widens', () => {
    expect(detourRange(100, 120, 2500, 3500, 45)).toBe(2500);
    expect(detourRange(100, 145, 2500, 3500, 45)).toBe(3500);
  });

  it('a widened range reaches a remote target the short range misses', () => {
    const targets = [{ zoneId: 'far', group: 'g', spot: vec(3000, 0) }];
    expect(
      pickNearestTarget(vec(0, 0), targets, detourRange(0, 10, 2500, 3500, 45)),
    ).toBeUndefined();
    expect(pickNearestTarget(vec(0, 0), targets, detourRange(0, 50, 2500, 3500, 45))?.zoneId).toBe(
      'far',
    );
  });
});

describe('regular sentry cap', () => {
  it('stops regular spots one short of the team quota', () => {
    expect(regularCapReached(2, [vec(0, 0)], [], 900)).toBe(false);
    expect(regularCapReached(2, [vec(0, 0)], [vec(5000, 0)], 900)).toBe(true);
    expect(regularCapReached(undefined, [vec(0, 0), vec(5000, 0)], [], 900)).toBe(false);
  });
});

describe('顺路选点', () => {
  const targets = [
    { zoneId: 'near', group: 'g', spot: vec(500, 0) },
    { zoneId: 'far', group: 'h', spot: vec(2000, 0) },
  ];

  it('范围内选最近的目标', () => {
    expect(pickNearestTarget(vec(1800, 0), targets, 3000)?.zoneId).toBe('far');
    expect(pickNearestTarget(vec(0, 0), targets, 3000)?.zoneId).toBe('near');
  });

  it('范围外不选', () => {
    expect(pickNearestTarget(vec(9000, 0), targets, 1500)).toBeUndefined();
    expect(pickNearestTarget(vec(0, 0), [], 1500)).toBeUndefined();
  });
});

describe('被隐身敌人打到插真眼', () => {
  const base = {
    hasSentry: true,
    attackerInvisible: true,
    nearestFriendSentry: Infinity,
    now: 100,
    lastTriggerAt: -Infinity,
  };

  it('条件都满足时插', () => {
    expect(shouldDropSentry(base)).toBe(true);
  });

  it.each([
    ['没有真眼', { hasSentry: false }],
    ['攻击者没隐身', { attackerInvisible: false }],
    ['900 内已有己方真眼', { nearestFriendSentry: 800 }],
  ])('%s 时不插', (_name, patch) => {
    expect(shouldDropSentry({ ...base, ...patch })).toBe(false);
  });

  it('30 秒内第二次不插，之后可以再插', () => {
    expect(shouldDropSentry({ ...base, now: 120, lastTriggerAt: 100 })).toBe(false);
    expect(shouldDropSentry({ ...base, now: 131, lastTriggerAt: 100 })).toBe(true);
  });
});

describe('pickWardBuyer', () => {
  const buyer = (
    id: number,
    power: number,
    gold = 1000,
    hasRoom = true,
    holdsOtherKind = false,
  ) => ({
    id,
    power,
    gold,
    hasRoom,
    holdsOtherKind,
  });
  const supply = { owned: 1, cap: 4, stock: 3, reserve: 0, cost: 50 };

  it('picks the weakest bot that can afford a ward and has room', () => {
    const buyers = [buyer(1, 300), buyer(2, 100, 10), buyer(3, 200), buyer(4, 50, 1000, false)];
    expect(pickWardBuyer(buyers, supply)).toBe(3);
  });

  it('stops buying once the team owns enough wards', () => {
    expect(pickWardBuyer([buyer(1, 100)], { ...supply, owned: 4 })).toBeUndefined();
  });

  it('leaves the reserved stock in the shop for players', () => {
    expect(pickWardBuyer([buyer(1, 100)], { ...supply, stock: 1, reserve: 1 })).toBeUndefined();
    expect(pickWardBuyer([buyer(1, 100)], { ...supply, stock: 2, reserve: 1 })).toBe(1);
  });
});

describe('pickWardBuyer 一个电脑只带一种眼', () => {
  const supply = { owned: 0, cap: 4, stock: 5, reserve: 0, cost: 50 };
  const buyer = (id: number, power: number, holdsOtherKind: boolean) => ({
    id,
    power,
    gold: 1000,
    hasRoom: true,
    holdsOtherKind,
  });

  it('带着另一种眼的电脑不是买家，哪怕战力最低', () => {
    expect(pickWardBuyer([buyer(1, 10, true), buyer(2, 50, false)], supply)).toBe(2);
  });

  it('只剩带另一种眼的电脑时不买', () => {
    expect(pickWardBuyer([buyer(1, 10, true)], supply)).toBeUndefined();
  });
});

describe('countHeldWards 按眼种读组合守卫的充能', () => {
  const item = (name: string, charges: number, secondaryCharges = 0): HeldItem => ({
    name,
    charges,
    secondaryCharges,
  });

  it('组合守卫整件按假眼算：假眼数读当前充能，里面的真眼不计入，持有者算带假眼', () => {
    const dispenser = [item('item_ward_dispenser', 2, 1)];
    expect(countHeldWards('observer', dispenser)).toEqual({
      total: 2,
      canStack: true,
      holdsOtherKind: false,
    });
    expect(countHeldWards('sentry', dispenser)).toEqual({
      total: 0,
      canStack: true,
      holdsOtherKind: true,
    });
  });

  it('带真眼的算带另一种眼，只对假眼买家生效', () => {
    expect(countHeldWards('observer', [item('item_ward_sentry', 1)]).holdsOtherKind).toBe(true);
    expect(countHeldWards('sentry', [item('item_ward_sentry', 1)]).holdsOtherKind).toBe(false);
  });

  it('单独的眼至少算 1 个，叠放的按充能算', () => {
    expect(countHeldWards('observer', [item('item_ward_observer', 0)]).total).toBe(1);
    expect(countHeldWards('observer', [item('item_ward_observer', 3)]).total).toBe(3);
    expect(countHeldWards('sentry', [item('item_ward_observer', 3)]).total).toBe(0);
  });

  it('身上有眼时新买的能并进去', () => {
    expect(countHeldWards('observer', [item('item_ward_sentry', 1)])).toEqual({
      total: 0,
      canStack: true,
      holdsOtherKind: true,
    });
  });

  it('没有眼时全为 0', () => {
    expect(countHeldWards('sentry', [item('item_tango', 1)])).toEqual({
      total: 0,
      canStack: false,
      holdsOtherKind: false,
    });
  });
});
