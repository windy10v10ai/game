import { canEscape, decideStance } from './engagement';

const input = {
  engaged: false,
  ourPower: 100,
  enemyPower: 100,
  canEscape: true,
  spentActions: 0,
};

describe('decideStance', () => {
  it('follows the task when no enemy is around', () => {
    expect(decideStance({ ...input, enemyPower: 0 })).toBe('task');
  });

  it('only avoids a fight when clearly outmatched', () => {
    expect(decideStance({ ...input, enemyPower: 180 })).toBe('fight');
    expect(decideStance({ ...input, enemyPower: 250 })).toBe('avoid');
  });

  it('keeps fighting a close fight once engaged', () => {
    expect(decideStance({ ...input, engaged: true, enemyPower: 120 })).toBe('fight');
  });

  it('spends skills before retreating from a lost fight', () => {
    const losing = { ...input, engaged: true, enemyPower: 300 };
    expect(decideStance(losing)).toBe('spend');
    expect(decideStance({ ...losing, spentActions: 2 })).toBe('retreat');
    expect(decideStance({ ...losing, canEscape: false })).toBe('lastStand');
  });
});

describe('canEscape', () => {
  const escape = { rooted: false, ourSpeed: 300, fastestEnemySpeed: 300, distanceToSafety: 3000 };

  it('cannot escape while rooted or when a faster enemy is far from safety', () => {
    expect(canEscape(escape)).toBe(true);
    expect(canEscape({ ...escape, rooted: true })).toBe(false);
    expect(canEscape({ ...escape, fastestEnemySpeed: 400 })).toBe(false);
    expect(canEscape({ ...escape, fastestEnemySpeed: 400, distanceToSafety: 1000 })).toBe(true);
  });
});
