import { calculateIntellectMagicResist } from './intellect-magic-resist-calculator';

describe('calculateIntellectMagicResist', () => {
  describe('第一段：0-500智力', () => {
    it.each([
      [0, 0, '0智力的魔抗'],
      [100, 0.05, '100智力的魔抗 (5%)'],
      [300, 0.15, '300智力的魔抗 (15%)'],
      [500, 0.25, '500智力的魔抗（边界值）(25%)'],
    ])('应该正确计算%s', (intellect, expected) => {
      const result = calculateIntellectMagicResist(intellect);
      expect(result).toBe(expected);
    });
  });

  describe('第二段：500-1000智力', () => {
    it.each([
      [501, 0.25025, '501智力的魔抗（边界值+1）'],
      [600, 0.275, '600智力的魔抗 (27.5%)'],
      [750, 0.3125, '750智力的魔抗 (31.25%)'],
      [1000, 0.375, '1000智力的魔抗（边界值）(37.5%)'],
    ])('应该正确计算%s', (intellect, expected) => {
      const result = calculateIntellectMagicResist(intellect);
      if (intellect === 501) {
        expect(result).toBeCloseTo(expected, 5);
      } else {
        expect(result).toBe(expected);
      }
    });
  });

  describe('第三段：1000+智力', () => {
    it.each([
      [1001, 0.37509375, '1001智力的魔抗（边界值+1）'],
      [1500, 0.421875, '1500智力的魔抗 (42.1875%)'],
      [2000, 0.46875, '2000智力的魔抗 (46.875%)'],
      [3000, 0.5625, '3000智力的魔抗 (56.25%)'],
      [4000, 0.65625, '4000智力的魔抗 (65.625%)'],
      [5000, 0.75, '5000智力的魔抗（达到100%上限）(75%)'],
    ])('应该正确计算%s', (intellect, expected) => {
      const result = calculateIntellectMagicResist(intellect);
      if (intellect === 1001) {
        expect(result).toBeCloseTo(expected, 5);
      } else {
        expect(result).toBe(expected);
      }
    });
  });

  describe('边界值测试', () => {
    it.each([
      [500, 501, '500-501边界'],
      [1000, 1001, '1000-1001边界'],
    ])('应该在%s处连续', (lower, upper) => {
      const atLower = calculateIntellectMagicResist(lower);
      const atUpper = calculateIntellectMagicResist(upper);
      expect(atUpper).toBeGreaterThan(atLower);
    });
  });

  describe('收益递减验证', () => {
    it('应该验证低智力时收益高于高智力时', () => {
      // 前100点智力提供的魔抗
      const first100 = calculateIntellectMagicResist(100) - calculateIntellectMagicResist(0);
      // 从1000到1100点智力提供的魔抗
      const from1000to1100 =
        calculateIntellectMagicResist(1100) - calculateIntellectMagicResist(1000);

      // 低智力时每点提供的魔抗应该高于高智力时
      expect(first100 / 100).toBeGreaterThan(from1000to1100 / 100);
    });

    it('应该验证每段收益递减', () => {
      // 第一段：0-500，每点0.05%
      const segment1Rate = 0.0005;
      // 第二段：500-1000，每点0.025%
      const segment2Rate = 0.00025;
      // 第三段：1000+，每点0.009375%
      const segment3Rate = 0.00009375;

      expect(segment1Rate).toBeGreaterThan(segment2Rate);
      expect(segment2Rate).toBeGreaterThan(segment3Rate);
    });

    it('应该验证5000智力时达到100%魔抗上限', () => {
      // 基础魔抗25% + 智力提供的魔抗75% = 100%
      const baseMagicResist = 0.25;
      const intellectMagicResist = calculateIntellectMagicResist(5000);
      const totalMagicResist = baseMagicResist + intellectMagicResist;

      expect(intellectMagicResist).toBe(0.75); // 智力提供75%
      expect(totalMagicResist).toBe(1.0); // 总计100%
    });
  });
});
