import { assistXpReward, refundKillXpInput, shouldRefundCut } from './hero-kill-reward';

describe('HeroKillReward', () => {
  describe('assistXpReward', () => {
    it('should give 30% of the death xp to each assister', () => {
      expect(assistXpReward(1000)).toBe(300);
      expect(assistXpReward(0)).toBe(0);
      expect(assistXpReward(333)).toBe(99);
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

  describe('shouldRefundCut', () => {
    it('should refund every cut when the reward is restored', () => {
      expect(shouldRefundCut(true, 3, 3)).toBe(true);
      expect(shouldRefundCut(true, 4, 3)).toBe(true);
    });

    it('should keep only the killer cut when the reward is halved', () => {
      expect(shouldRefundCut(false, 3, 3)).toBe(false);
      expect(shouldRefundCut(false, 4, 3)).toBe(true);
      expect(shouldRefundCut(false, 4, undefined)).toBe(true);
    });
  });
});
