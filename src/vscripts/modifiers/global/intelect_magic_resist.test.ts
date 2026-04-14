import { calculateIntellectMagicResist } from './intellect-magic-resist-calculator';

describe('calculateIntellectMagicResist', () => {
  describe('魔抗增长计算', () => {
    it.each([
      [0, 0, '0智力 (0%)'],
      [100, 6.82, '100智力 (约6.82%)'],
      [500, 25, '500智力 (25%)'],
      [1000, 37.5, '1000智力 (37.5%)'],
      [2000, 50, '2000智力 (50%)'],
      [5000, 62.5, '5000智力 (62.5%)'],
      [9000, 67.5, '9000智力 (67.5%)'],
    ])('应该正确计算%s', (intellect, expected) => {
      const result = calculateIntellectMagicResist(intellect);
      expect(result).toBeCloseTo(expected, 1);
    });
  });

  describe('属性验证', () => {
    it('验证极大智力下趋近于75%', () => {
      const result = calculateIntellectMagicResist(1000000);
      expect(result).toBeLessThan(75);
      expect(result).toBeGreaterThan(74);
    });

    it('验证收益递增但增长率递减', () => {
      const lowGain = calculateIntellectMagicResist(100) - calculateIntellectMagicResist(0);
      const midGain = calculateIntellectMagicResist(1100) - calculateIntellectMagicResist(1000);
      const highGain = calculateIntellectMagicResist(10100) - calculateIntellectMagicResist(10000);

      expect(lowGain).toBeGreaterThan(midGain);
      expect(midGain).toBeGreaterThan(highGain);
    });

    it('应该验证魔抗永远不会超过75%', () => {
      const extremelyHighInt = 999999999;
      const intellectMagicResist = calculateIntellectMagicResist(extremelyHighInt);
      expect(intellectMagicResist).toBeLessThan(75);
    });
  });
});
