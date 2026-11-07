import { teamKillGold } from './team-kill-gold';

describe('teamKillGold', () => {
  it.each([
    [5, 8, 16],
    [10, 10, 20],
    [20, 15, 30],
    [30, 20, 40],
    [40, 30, 60],
    [50, 40, 80],
    [60, 40, 80],
  ])('level %i gives %i single player and %i multiplayer', (level, single, multi) => {
    expect(teamKillGold(level, false)).toBe(single);
    expect(teamKillGold(level, true)).toBe(multi);
  });
});
