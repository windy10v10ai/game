import { canPlaceAtHeroPosition, findAvailableCandidates } from './ward-decision';
import type { WardTypeConfig } from './ward-position-config';

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

const config: WardTypeConfig = {
  itemNames: ['item_ward_observer', 'item_ward_dispenser'],
  wardClassName: 'npc_dota_ward_base',
  positions: [],
  castRange: 600,
  sameWardRadius: 2400,
  friendTowerRadius: 2100,
  friendFortRadius: 2500,
  enemyTowerRadius: 1200,
  placeChance: 0.2,
};

const emptyGround = {
  heroPos: vec(0, 0),
  config,
  existingWards: [],
  friendTowers: [],
  friendForts: [],
  enemyTowers: [],
  inNoCastZone: false,
};

describe('findAvailableCandidates', () => {
  it('只保留 castRange 内的眼位', () => {
    const result = findAvailableCandidates(vec(0, 0), [vec(500, 0), vec(1000, 0)], 850, [], 200);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(500);
  });

  it('排除附近已有己方同类眼的眼位', () => {
    const result = findAvailableCandidates(
      vec(0, 0),
      [vec(500, 0), vec(700, 0)],
      900,
      [vec(500, 100)],
      200,
    );
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(700);
  });

  it('高低差不影响距离判定', () => {
    const result = findAvailableCandidates(vec(0, 0, 0), [vec(100, 0, 500)], 200, [], 50);
    expect(result).toHaveLength(1);
  });

  it('去重半径覆盖全部眼位时返回空', () => {
    const result = findAvailableCandidates(
      vec(0, 0),
      [vec(500, 0), vec(700, 0)],
      900,
      [vec(0, 0)],
      2400,
    );
    expect(result).toHaveLength(0);
  });
});

describe('canPlaceAtHeroPosition', () => {
  it('周围没有任何限制物时可插', () => {
    expect(canPlaceAtHeroPosition(emptyGround)).toBe(true);
  });

  it('肉山坑禁区内不可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, inNoCastZone: true })).toBe(false);
  });

  it('己方塔在半径内不可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, friendTowers: [vec(2000, 0)] })).toBe(false);
  });

  it('己方塔在半径外可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, friendTowers: [vec(2200, 0)] })).toBe(true);
  });

  it('己方基地在半径内不可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, friendForts: [vec(2400, 0)] })).toBe(false);
  });

  it('敌方塔在半径内不可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, enemyTowers: [vec(1100, 0)] })).toBe(false);
  });

  it('已有己方同类眼不可插', () => {
    expect(canPlaceAtHeroPosition({ ...emptyGround, existingWards: [vec(2300, 0)] })).toBe(false);
  });

  it('真眼的塔半径更小，同一位置假眼不可插而真眼可插', () => {
    const sentryConfig: WardTypeConfig = { ...config, friendTowerRadius: 1200 };
    const towerAt1500 = { ...emptyGround, friendTowers: [vec(1500, 0)] };
    expect(canPlaceAtHeroPosition(towerAt1500)).toBe(false);
    expect(canPlaceAtHeroPosition({ ...towerAt1500, config: sentryConfig })).toBe(true);
  });
});
