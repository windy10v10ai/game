import { combineCorners } from './recent-form-radar';

const base: PlayerStatsRadar = {
  damage: 50,
  gold: 50,
  participation: 50,
  push: 50,
  deaths: 50,
  tank: 50,
  healing: 0,
  assists: 0,
  stuns: 0,
};

describe('combineCorners', () => {
  it('辅助取治疗、助攻里较高的一项，控制只占一点', () => {
    const healer = combineCorners({ ...base, healing: 90, assists: 20, stuns: 40 });
    const assister = combineCorners({ ...base, healing: 0, assists: 90, stuns: 40 });
    const stunner = combineCorners({ ...base, healing: 10, assists: 20, stuns: 90 });

    expect(healer.support).toBe(85);
    expect(assister.support).toBe(85);
    expect(stunner.support).toBe(27);
  });
});
