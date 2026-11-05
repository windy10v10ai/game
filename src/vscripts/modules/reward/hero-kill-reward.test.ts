import {
  assistGoldReward,
  assistXpReward,
  killerAssistGoldReward,
  refundKillXpInput,
} from './hero-kill-reward';

describe('HeroKillReward', () => {
  describe('assistGoldReward', () => {
    it('should give 20% of the base bounty to each assister', () => {
      expect(assistGoldReward(1000)).toBe(200);
      expect(assistGoldReward(0)).toBe(0);
      expect(assistGoldReward(333)).toBe(66);
    });
  });

  describe('assistXpReward', () => {
    it('should give 40% of the death xp to each assister', () => {
      expect(assistXpReward(1000)).toBe(400);
      expect(assistXpReward(0)).toBe(0);
      expect(assistXpReward(333)).toBe(133);
    });
  });

  describe('killerAssistGoldReward', () => {
    it('should scale with assister count and stop counting after two', () => {
      expect(killerAssistGoldReward(1000, 0)).toBe(0);
      expect(killerAssistGoldReward(1000, 1)).toBe(200);
      expect(killerAssistGoldReward(1000, 2)).toBe(400);
      expect(killerAssistGoldReward(1000, 5)).toBe(400);
      expect(killerAssistGoldReward(333, 1)).toBe(66);
    });
  });

  describe('refundKillXpInput', () => {
    it('should divide the cut by the filter multiplier', () => {
      expect(refundKillXpInput(100, 1)).toBe(100);
      expect(refundKillXpInput(100, 2)).toBe(50);
      expect(refundKillXpInput(49, 1.5)).toBe(33);
      expect(refundKillXpInput(100, 0)).toBe(100);
    });
  });
});
