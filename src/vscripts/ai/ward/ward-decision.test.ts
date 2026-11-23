import {
  countHeldWards,
  HeldItem,
  isZoneEnabled,
  isZoneFree,
  pickDetourSpot,
  maxZoneSpan,
  pickPassingSpot,
  pickWardBuyer,
  shouldDropSentry,
  WardZone,
  wardQueryRadius,
} from './ward-decision';
import {
  OBSERVER_WARD_CONFIG,
  POSITION_JITTER,
  SENTRY_WARD_CONFIG,
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

const zoneA: WardZone = { id: 'a', spots: [vec(0, 0), vec(600, 0), vec(0, 700)] };
const zoneB: WardZone = { id: 'b', spots: [vec(3000, 0)] };

/** 配置里是原始坐标，自检直接按坐标算，不依赖引擎的 Vector */
type Spot = readonly [number, number, number];
const dist = (a: Spot, b: Spot) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
const spotsOf = (zones: readonly WardZoneData[]): Spot[] =>
  zones.flatMap((zone) => [...zone.spots]);
const sides = ['radiant', 'dire'] as const;

describe('分阵营取点', () => {
  it('天辉与夜魇各有自己的点位', () => {
    const { radiant, dire } = OBSERVER_WARD_CONFIG.zones;
    expect(radiant.length).toBeGreaterThan(0);
    expect(dire.length).toBeGreaterThan(0);
    expect(radiant).not.toBe(dire);
    expect(spotsOf(radiant)).not.toEqual(spotsOf(dire));
  });
});

describe('配置数据自检', () => {
  // 眼落地后按备选点到眼的距离判占用，落点带偏移，不同区域的备选点要隔开去重半径加偏移才不会互相挤占
  const MIN_ZONE_GAP = OBSERVER_WARD_CONFIG.sameWardRadius + POSITION_JITTER;
  // 进攻眼位 a 类与 b 类、b 类之间是同一片的替代点（塔倒前后各用一个），允许挨得近，显式列出
  const PAIRED_ZONES: Record<(typeof sides)[number], ReadonlyArray<readonly [string, string]>> = {
    radiant: [
      ['ra2', 'rb1'],
      ['ra1', 'rb2'],
    ],
    dire: [
      ['da1', 'db1'],
      ['da1', 'db3'],
      ['da2', 'db2'],
      ['da2', 'db4'],
    ],
  };

  it.each(sides)('%s 不同区域的点位两两距离不小于去重半径加偏移，成对进攻眼位除外', (side) => {
    const zones = OBSERVER_WARD_CONFIG.zones[side];
    const paired = (x: string, y: string) =>
      PAIRED_ZONES[side].some(([p, q]) => (p === x && q === y) || (p === y && q === x));
    const violations: string[] = [];
    for (const zone of zones) {
      for (const other of zones) {
        if (other.id >= zone.id || paired(zone.id, other.id)) continue;
        for (const a of zone.spots) {
          for (const b of other.spots) {
            if (dist(a, b) < MIN_ZONE_GAP) {
              violations.push(`${zone.id}-${other.id}:${Math.round(dist(a, b))}`);
            }
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  // 区域占用按「任一备选点附近有眼」整区判，备选点相距略超去重半径也不会重复插
  it.each(sides)('%s 同一区域的备选点互相都在 1100 内', (side) => {
    for (const zone of OBSERVER_WARD_CONFIG.zones[side]) {
      expect(zone.spots.length).toBeGreaterThan(0);
      for (const a of zone.spots) {
        for (const b of zone.spots) {
          expect(dist(a, b)).toBeLessThanOrEqual(1100);
        }
      }
    }
  });

  it.each(sides)('%s 真眼点位离任一假眼点位不小于 300', (side) => {
    const observers = spotsOf(OBSERVER_WARD_CONFIG.zones[side]);
    for (const sentry of spotsOf(SENTRY_WARD_CONFIG.zones[side])) {
      for (const observer of observers) {
        expect(dist(sentry, observer)).toBeGreaterThanOrEqual(300);
      }
    }
  });

  it('两方点位数量相差不超过 2', () => {
    const { radiant, dire } = OBSERVER_WARD_CONFIG.zones;
    expect(Math.abs(spotsOf(radiant).length - spotsOf(dire).length)).toBeLessThanOrEqual(2);
  });

  it.each([
    ['radiant', 'badguys_tower3_'],
    ['dire', 'goodguys_tower3_'],
  ] as const)('%s 进攻眼位依赖的是敌方高地塔', (side, prefix) => {
    const gated = OBSERVER_WARD_CONFIG.zones[side].filter((zone) => zone.requiresDeadTower);
    expect(gated.length).toBeGreaterThan(0);
    for (const zone of gated) {
      expect(zone.requiresDeadTower).toMatch(new RegExp(`^${prefix}(top|mid|bot)$`));
    }
  });
});

describe('进攻眼位启用条件', () => {
  const free: WardZone = { id: 'a', spots: [vec(0, 0)] };
  const gated: WardZone = { id: 'b', spots: [vec(0, 0)], requiresDeadTower: 'badguys_tower3_mid' };
  const alive = ['npc_dota_badguys_tower3_mid', 'npc_dota_badguys_tower3_top'];

  it('塔射程外的区域始终可选', () => {
    expect(isZoneEnabled(free, alive)).toBe(true);
    expect(isZoneEnabled(free, [])).toBe(true);
  });

  it('依赖的塔还活着时不可选', () => {
    expect(isZoneEnabled(gated, alive)).toBe(false);
  });

  it('依赖的塔不在存活名单里就可选，别的塔活着不影响', () => {
    expect(isZoneEnabled(gated, ['npc_dota_badguys_tower3_top'])).toBe(true);
    expect(isZoneEnabled(gated, [])).toBe(true);
  });
});

describe('区域取点', () => {
  it('区域里已有己方眼时整个区域不再选', () => {
    expect(isZoneFree(zoneA, [vec(650, 100)], 800)).toBe(false);
    expect(isZoneFree(zoneA, [vec(5000, 0)], 800)).toBe(true);
  });

  it('备选点相距超过去重半径时，任一点旁有眼整个区域也算占用', () => {
    const wide: WardZone = { id: 'w', spots: [vec(0, 0), vec(1050, 0)] };
    expect(isZoneFree(wide, [vec(0, 40)], 900)).toBe(false);
    expect(isZoneFree(wide, [vec(1050, 40)], 900)).toBe(false);
    expect(isZoneFree(wide, [vec(5000, 0)], 900)).toBe(true);
  });

  it('多次取点能选到每一个够得着的备选点', () => {
    const picked = new Set<number>();
    for (let i = 0; i < 3; i++) {
      const pick = pickPassingSpot(vec(300, 300), [zoneA], 1000, [], 800, sequence(i));
      picked.add(pick!.spot.x * 10000 + pick!.spot.y);
    }
    expect(picked.size).toBe(3);
  });

  it('够不着的备选点不选', () => {
    for (const i of [0, 1, 2]) {
      expect(pickPassingSpot(vec(0, 0), [zoneA], 300, [], 800, sequence(i))?.spot).toBe(
        zoneA.spots[0],
      );
    }
  });

  it('区域已被占用时路过也不插', () => {
    expect(
      pickPassingSpot(vec(0, 0), [zoneA], 1000, [vec(0, 600)], 800, sequence(0)),
    ).toBeUndefined();
  });

  it('只有认领、眼还没落地时，相邻区域的点也不可选', () => {
    // 认领点当作已落地的眼传入：与已认领点相距 283 的另一个区域落在去重半径内
    const near: WardZone = { id: 'near', spots: [vec(283, 0)] };
    const far: WardZone = { id: 'far', spots: [vec(3000, 0)] };
    const claimed = [vec(0, 0)];
    expect(pickPassingSpot(vec(100, 0), [near], 600, claimed, 900, sequence(0))).toBeUndefined();
    expect(pickPassingSpot(vec(100, 0), [near], 600, [], 900, sequence(0))?.zoneId).toBe('near');
    expect(pickPassingSpot(vec(2900, 0), [far], 600, claimed, 900, sequence(0))?.zoneId).toBe(
      'far',
    );
  });
});

describe('查眼半径', () => {
  const wide: WardZone = { id: 'w', spots: [vec(0, 0), vec(1066, 0)] };

  it('半径按候选距离加区域最大跨度加去重半径算', () => {
    expect(maxZoneSpan([zoneA, wide])).toBeCloseTo(1066);
    expect(wardQueryRadius(600, [zoneA, wide], 900)).toBeCloseTo(600 + 1066 + 900);
  });

  it('远端备选点旁的眼落在查询半径内，整区判为占用', () => {
    // 英雄在近端备选点旁够得着它，远端备选点旁的眼离英雄 1066 + 850
    const hero = vec(-500, 0);
    const radius = wardQueryRadius(600, [wide], 900);
    const farWard = vec(1066 + 850, 0);
    expect(farWard.__sub(hero).Length2D()).toBeLessThanOrEqual(radius);
    expect(isZoneFree(wide, [farWard], 900)).toBe(false);
    // 旧口径「跨度不超过 900」算出的半径会漏掉它
    expect(farWard.__sub(hero).Length2D()).toBeGreaterThan(600 + 2 * 900);
  });
});

describe('顺路选点', () => {
  it('范围内有两个空区域时选近的', () => {
    const pick = pickDetourSpot(vec(2500, 0), [zoneA, zoneB], 3000, [], 800, sequence(0));
    expect(pick?.zoneId).toBe('b');
  });

  it('区域里已有己方眼时不选', () => {
    const pick = pickDetourSpot(
      vec(2500, 0),
      [zoneA, zoneB],
      3000,
      [vec(3100, 0)],
      800,
      sequence(0),
    );
    expect(pick?.zoneId).toBe('a');
  });

  it('只在区域里够得着的备选点里随机，范围外的备选点不会被抽到', () => {
    // 英雄在 (0,0)，范围 650：区域 A 只有 (0,0) 与 (600,0) 够得着，(0,700) 够不着
    for (const i of [0, 1, 2, 3]) {
      const pick = pickDetourSpot(vec(0, 0), [zoneA], 650, [], 800, sequence(i));
      expect(zoneA.spots.slice(0, 2)).toContain(pick!.spot);
    }
  });

  it('范围外不选', () => {
    expect(pickDetourSpot(vec(9000, 0), [zoneA, zoneB], 1500, [], 800, sequence(0))).toBe(
      undefined,
    );
  });

  it('被别的电脑认领的点附近的区域不选', () => {
    const pick = pickDetourSpot(
      vec(2500, 0),
      [zoneA, zoneB],
      3000,
      [vec(3000, 100)],
      800,
      sequence(0),
    );
    expect(pick?.zoneId).toBe('a');
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
