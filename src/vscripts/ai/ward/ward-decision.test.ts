import {
  countHeldWards,
  HeldItem,
  isZoneFree,
  pickDetourSpot,
  pickPassingSpot,
  pickWardBuyer,
  shouldDropSentry,
  WardZone,
} from './ward-decision';
import { OBSERVER_WARD_CONFIG, SENTRY_WARD_CONFIG, WardZoneData } from './ward-position-config';

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
  it.each(sides)('%s 假眼点位两两距离不小于 600', (side) => {
    const spots = spotsOf(OBSERVER_WARD_CONFIG.zones[side]);
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        expect(dist(spots[i], spots[j])).toBeGreaterThanOrEqual(600);
      }
    }
  });

  it.each(sides)('%s 同一区域的备选点互相都在去重半径内，不同区域互不影响', (side) => {
    const zones = OBSERVER_WARD_CONFIG.zones[side];
    const radius = OBSERVER_WARD_CONFIG.sameWardRadius;
    for (const zone of zones) {
      expect(zone.spots.length).toBeGreaterThan(0);
      for (const a of zone.spots) {
        for (const b of zone.spots) {
          expect(dist(a, b)).toBeLessThanOrEqual(radius);
        }
      }
      for (const other of zones) {
        if (other === zone) continue;
        for (const a of zone.spots) {
          for (const b of other.spots) {
            expect(dist(a, b)).toBeGreaterThan(radius);
          }
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
});

const never = () => false;

describe('区域取点', () => {
  it('区域里已有己方眼时整个区域不再选', () => {
    expect(isZoneFree(zoneA, [vec(650, 100)], 800)).toBe(false);
    expect(isZoneFree(zoneA, [vec(5000, 0)], 800)).toBe(true);
  });

  it('多次取点能选到每一个够得着的备选点', () => {
    const picked = new Set<number>();
    for (let i = 0; i < 3; i++) {
      const pick = pickPassingSpot(vec(300, 300), [zoneA], 1000, [], 800, never, sequence(i));
      picked.add(pick!.spot.x * 10000 + pick!.spot.y);
    }
    expect(picked.size).toBe(3);
  });

  it('够不着的备选点不选', () => {
    for (const i of [0, 1, 2]) {
      expect(pickPassingSpot(vec(0, 0), [zoneA], 300, [], 800, never, sequence(i))?.spot).toBe(
        zoneA.spots[0],
      );
    }
  });

  it('区域已被占用时路过也不插', () => {
    expect(
      pickPassingSpot(vec(0, 0), [zoneA], 1000, [vec(0, 600)], 800, never, sequence(0)),
    ).toBeUndefined();
  });

  it('已被认领的区域路过也不插', () => {
    expect(
      pickPassingSpot(vec(0, 0), [zoneA], 1000, [], 800, (id) => id === 'a', sequence(0)),
    ).toBeUndefined();
  });
});

describe('顺路选点', () => {
  it('范围内有两个空区域时选近的', () => {
    const pick = pickDetourSpot(vec(2500, 0), [zoneA, zoneB], 3000, [], 800, never, sequence(0));
    expect(pick?.zoneId).toBe('b');
  });

  it('区域里已有己方眼时不选', () => {
    const pick = pickDetourSpot(
      vec(2500, 0),
      [zoneA, zoneB],
      3000,
      [vec(3100, 0)],
      800,
      never,
      sequence(0),
    );
    expect(pick?.zoneId).toBe('a');
  });

  it('只在区域里够得着的备选点里随机，范围外的备选点不会被抽到', () => {
    // 英雄在 (0,0)，范围 650：区域 A 只有 (0,0) 与 (600,0) 够得着，(0,700) 够不着
    for (const i of [0, 1, 2, 3]) {
      const pick = pickDetourSpot(vec(0, 0), [zoneA], 650, [], 800, never, sequence(i));
      expect(zoneA.spots.slice(0, 2)).toContain(pick!.spot);
    }
  });

  it('范围外不选', () => {
    expect(pickDetourSpot(vec(9000, 0), [zoneA, zoneB], 1500, [], 800, never, sequence(0))).toBe(
      undefined,
    );
  });

  it('被别的电脑认领的区域不选', () => {
    const pick = pickDetourSpot(
      vec(2500, 0),
      [zoneA, zoneB],
      3000,
      [],
      800,
      (id) => id === 'b',
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
  const buyer = (id: number, power: number, gold = 1000, hasRoom = true) => ({
    id,
    power,
    gold,
    hasRoom,
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

describe('countHeldWards 按眼种读组合守卫的充能', () => {
  const item = (name: string, charges: number, secondaryCharges = 0): HeldItem => ({
    name,
    charges,
    secondaryCharges,
  });

  it('组合守卫的假眼记在当前充能，真眼记在第二充能', () => {
    const dispenser = [item('item_ward_dispenser', 2, 1)];
    expect(countHeldWards('observer', dispenser).total).toBe(2);
    expect(countHeldWards('sentry', dispenser).total).toBe(1);
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
    });
  });

  it('没有眼时全为 0', () => {
    expect(countHeldWards('sentry', [item('item_tango', 1)])).toEqual({
      total: 0,
      canStack: false,
    });
  });
});
