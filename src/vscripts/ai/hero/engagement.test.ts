import { decideStance } from './engagement';

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
    expect(decideStance({ ...input, enemyPower: 180 })).toBe('fight');
    expect(decideStance({ ...input, enemyPower: 250 })).toBe('avoid');
  });

  it('keeps fighting a close fight once engaged', () => {
    expect(decideStance({ ...input, engaged: true, enemyPower: 120 })).toBe('fight');
  });

  it('retreats from a lost fight unless it cannot move', () => {
    const losing = { ...input, engaged: true, enemyPower: 300 };
    expect(decideStance(losing)).toBe('retreat');
    expect(decideStance({ ...losing, canEscape: false })).toBe('lastStand');
  });
});
