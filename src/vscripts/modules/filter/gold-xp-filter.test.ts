import { GoldXPFilter } from './gold-xp-filter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;
global.GameRules = {
  GetGameModeEntity: jest.fn().mockReturnValue({
    SetModifyGoldFilter: jest.fn(),
    SetModifyExperienceFilter: jest.fn(),
  }),
};
describe('GoldFilter', () => {
  let goldFilter: GoldXPFilter;

  beforeEach(() => {
    goldFilter = new GoldXPFilter();
  });

  describe('filterHeroKillGoldByMultiplier', () => {
    it('should return the same multiplier if it is less than or equal to 1', () => {
      expect(goldFilter.filterHeroKillGoldByMultiplier(0.5)).toBe(0.5);
      expect(goldFilter.filterHeroKillGoldByMultiplier(1)).toBe(1);
    });

    it('should reduce the multiplier correctly when it is greater than 1', () => {
      expect(goldFilter.filterHeroKillGoldByMultiplier(1.5)).toBe(1.3);
      expect(goldFilter.filterHeroKillGoldByMultiplier(2)).toBe(1.6);
      expect(goldFilter.filterHeroKillGoldByMultiplier(6)).toBe(4);
      expect(goldFilter.filterHeroKillGoldByMultiplier(10)).toBeCloseTo(6.4, 1);
    });
  });

  describe('filterHeroKillGold', () => {
    it.each([
      [0, 0],
      [400, 400],
      [1600, 1000],
      [3200, 1400],
      [6000, 1750],
    ])('should reduce the gold correctly when the multiplier is %f', (gold, expected) => {
      expect(goldFilter.filterHeroKillGold(gold)).toBe(expected);
    });
  });
});
