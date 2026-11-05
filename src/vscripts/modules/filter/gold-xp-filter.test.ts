import { GoldXPFilter, earlyKillGoldRate, earlyKillXpRate } from './gold-xp-filter';

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
      expect(goldFilter.filterHeroKillGoldByMultiplier(1.5)).toBeLessThan(1.5);
      expect(goldFilter.filterHeroKillGoldByMultiplier(1.5)).toBeGreaterThan(1);

      expect(goldFilter.filterHeroKillGoldByMultiplier(10)).toBeLessThan(10);
      expect(goldFilter.filterHeroKillGoldByMultiplier(10)).toBeGreaterThan(2);
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

  describe('earlyKillGoldRate', () => {
    it.each([
      [-60, 0.7],
      [0, 0.7],
      [149, 0.7],
      [150, 1],
      [179, 1],
      [600, 1],
    ])('should return the early kill gold rate at %i seconds', (gameTime, expected) => {
      expect(earlyKillGoldRate(gameTime)).toBe(expected);
    });
  });

  describe('earlyKillXpRate', () => {
    it.each([
      [-60, 0.5],
      [0, 0.5],
      [149, 0.5],
      [150, 1],
      [179, 1],
      [600, 1],
    ])('should return the early kill xp rate at %i seconds', (gameTime, expected) => {
      expect(earlyKillXpRate(gameTime)).toBe(expected);
    });
  });

  describe('filterMultiplier', () => {
    it('should return the same multiplier if it is less than or equal to 1', () => {
      expect(goldFilter.filterMultiplier(0.5, 0.4)).toBe(0.5);
      expect(goldFilter.filterMultiplier(1, 0.4)).toBe(1);
    });

    it('should reduce the multiplier correctly when it is greater than 1', () => {
      expect(goldFilter.filterMultiplier(2, 0.4)).toBe(1.4);
      expect(goldFilter.filterMultiplier(6, 0.4)).toBe(3);
      expect(goldFilter.filterMultiplier(2, 0.5)).toBe(1.5);
      expect(goldFilter.filterMultiplier(2, 0.0)).toBe(1);
      expect(goldFilter.filterMultiplier(2, 1.0)).toBe(2);
    });
  });
});
