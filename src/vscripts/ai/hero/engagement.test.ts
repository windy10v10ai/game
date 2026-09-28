import { canEscape, decideStance, survivalSeconds } from './engagement';

const input = {
  engaged: false,
  ourPower: 100,
  enemyPower: 100,
  canEscape: true,
  survivalSeconds: Infinity,
  wasRetreating: false,
};

describe('decideStance', () => {
  it('follows the task when no enemy is around', () => {
    expect(decideStance({ ...input, enemyPower: 0 })).toBe('task');
  });

  it('keeps its distance instead of running from a stronger enemy', () => {
    expect(decideStance({ ...input, enemyPower: 190 })).toBe('fight');
    expect(decideStance({ ...input, enemyPower: 250 })).toBe('hold');
  });

  it('keeps fighting a lost fight while it can still take the damage', () => {
    expect(decideStance({ ...input, engaged: true, enemyPower: 1000, survivalSeconds: 8 })).toBe(
      'fight',
    );
  });

  it('retreats once about to die, sooner when losing', () => {
    const winning = { ...input, engaged: true, survivalSeconds: 4 };
    expect(decideStance(winning)).toBe('fight');
    expect(decideStance({ ...winning, enemyPower: 400 })).toBe('retreat');
    expect(decideStance({ ...winning, survivalSeconds: 2 })).toBe('retreat');
  });

  it('fights back where it stands when it cannot get away', () => {
    expect(decideStance({ ...input, engaged: true, survivalSeconds: 1, canEscape: false })).toBe(
      'lastStand',
    );
  });

  it('finishes a retreat before turning back into the same fight', () => {
    expect(decideStance({ ...input, engaged: true, wasRetreating: true })).toBe('retreat');
    expect(decideStance({ ...input, wasRetreating: true })).toBe('fight');
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
