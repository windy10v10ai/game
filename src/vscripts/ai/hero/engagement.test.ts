import { canEscape, decideStance, survivalSeconds } from './engagement';

const input = {
  engaged: false,
  ourPower: 100,
  enemyPower: 100,
  canEscape: true,
  survivalSeconds: Infinity,
  wasAvoiding: false,
};

describe('decideStance', () => {
  it('follows the task when no enemy is around', () => {
    expect(decideStance({ ...input, enemyPower: 0 })).toBe('task');
  });

  it('keeps its distance instead of running from a stronger enemy', () => {
    expect(decideStance({ ...input, enemyPower: 190 })).toBe('fight');
    expect(decideStance({ ...input, enemyPower: 250 })).toBe('hold');
  });

  it('leaves a fight it is clearly losing right away instead of fighting on', () => {
    expect(decideStance({ ...input, engaged: true, enemyPower: 350 })).toBe('retreat');
    expect(decideStance({ ...input, engaged: true, enemyPower: 350, canEscape: false })).toBe(
      'lastStand',
    );
  });

  it('keeps fighting an even fight until about to die', () => {
    const even = { ...input, engaged: true, enemyPower: 280, survivalSeconds: 4 };
    expect(decideStance(even)).toBe('fight');
    expect(decideStance({ ...even, survivalSeconds: 2 })).toBe('retreat');
  });

  it('fights back where it stands when it cannot get away', () => {
    expect(decideStance({ ...input, engaged: true, survivalSeconds: 1, canEscape: false })).toBe(
      'lastStand',
    );
  });

  it('keeps leaving once it chose to avoid, even after being hit', () => {
    expect(decideStance({ ...input, engaged: true, wasAvoiding: true })).toBe('retreat');
    expect(decideStance({ ...input, wasAvoiding: true })).toBe('fight');
  });
});

describe('survivalSeconds', () => {
  it('divides remaining health by the recent damage rate', () => {
    expect(survivalSeconds(1000, 500, 2)).toBe(4);
    expect(survivalSeconds(1000, 0, 2)).toBe(Infinity);
  });
});

describe('canEscape', () => {
  it('gives up only when rooted or caught by a faster enemy', () => {
    expect(canEscape({ rooted: false, caughtByFaster: false })).toBe(true);
    expect(canEscape({ rooted: true, caughtByFaster: false })).toBe(false);
    expect(canEscape({ rooted: false, caughtByFaster: true })).toBe(false);
  });
});
