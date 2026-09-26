import { canEscape, decideStance } from './engagement';

const input = {
  engaged: false,
  ourPower: 100,
  enemyPower: 100,
  canEscape: true,
};

describe('decideStance', () => {
  it('follows the task when no enemy is around', () => {
    expect(decideStance({ ...input, enemyPower: 0 })).toBe('task');
  });

  it('only avoids a fight when clearly outmatched', () => {
    expect(decideStance({ ...input, enemyPower: 280 })).toBe('fight');
    expect(decideStance({ ...input, enemyPower: 350 })).toBe('retreat');
  });

  it('keeps fighting a close fight once engaged', () => {
    expect(decideStance({ ...input, engaged: true, enemyPower: 180 })).toBe('fight');
  });

  it('retreats from a lost fight unless it cannot move', () => {
    const losing = { ...input, engaged: true, enemyPower: 300 };
    expect(decideStance(losing)).toBe('retreat');
    expect(decideStance({ ...losing, canEscape: false })).toBe('lastStand');
  });
});

describe('canEscape', () => {
  const escape = { rooted: false, ourSpeed: 300, fastestEnemySpeed: 300, distanceToSafety: 3000 };

  it('gives up only when rooted or a much faster enemy chases over a long way', () => {
    expect(canEscape(escape)).toBe(true);
    expect(canEscape({ ...escape, rooted: true })).toBe(false);
    expect(canEscape({ ...escape, fastestEnemySpeed: 400 })).toBe(true);
    expect(canEscape({ ...escape, fastestEnemySpeed: 450 })).toBe(false);
    expect(canEscape({ ...escape, fastestEnemySpeed: 450, distanceToSafety: 1500 })).toBe(true);
  });
});
