import { canDiveTower, canOutlastTower, retreatPointFromTowers } from './tower-retreat';

describe('canOutlastTower', () => {
  const input = {
    heroHealth: 6000,
    heroReserve: 1000,
    towerDpsOnHero: 250,
    towerHealth: 3000,
    teamDpsOnTower: 400,
  };

  it('keeps hitting a tower it can outlast', () => {
    // 能扛 20 秒，塔 7.5 秒就倒
    expect(canOutlastTower(input)).toBe(true);
  });

  it('leaves when the tower would kill it first', () => {
    expect(canOutlastTower({ ...input, heroHealth: 2500 })).toBe(false);
    expect(canOutlastTower({ ...input, teamDpsOnTower: 50 })).toBe(false);
  });

  it('never dives when nobody can hurt the tower', () => {
    expect(canOutlastTower({ ...input, teamDpsOnTower: 0 })).toBe(false);
  });
});

describe('tower retreat point', () => {
  it('moves directly away from a single tower toward home', () => {
    expect(
      retreatPointFromTowers({ x: 0, y: 0 }, [{ x: 100, y: 0 }], { x: -1000, y: 0 }, 250),
    ).toEqual({ x: -250, y: 0 });
  });

  it('heads home when caught between two towers instead of bouncing between them', () => {
    const towers = [
      { x: -500, y: 0 },
      { x: 500, y: 0 },
    ];
    const point = retreatPointFromTowers({ x: 0, y: 0 }, towers, { x: 0, y: -3000 }, 300);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(-300);
  });

  it('uses the fountain direction when hero and tower positions overlap', () => {
    expect(
      retreatPointFromTowers({ x: 100, y: 100 }, [{ x: 100, y: 100 }], { x: 0, y: 100 }, 200),
    ).toEqual({ x: -100, y: 100 });
  });
});

describe('canDiveTower', () => {
  const dive = { enemyHealth: 3000, teamDps: 600, towerDps: 200, diverHealth: 2000 };

  it('dives when the target dies before the tower kills one diver', () => {
    expect(canDiveTower(dive)).toBe(true);
  });

  it('stays out when the tower would kill a diver first', () => {
    expect(canDiveTower({ ...dive, towerDps: 500 })).toBe(false);
    expect(canDiveTower({ ...dive, teamDps: 200 })).toBe(false);
  });

  it('never dives with no damage and always dives a harmless tower', () => {
    expect(canDiveTower({ ...dive, teamDps: 0 })).toBe(false);
    expect(canDiveTower({ ...dive, towerDps: 0 })).toBe(true);
  });
});
