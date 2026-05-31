import { formatStatNumber, formatStatNumberParts } from './format-stat-number';

describe('formatStatNumber', () => {
  describe('英文 (isChinese=false)', () => {
    it('小于一万原样', () => {
      expect(formatStatNumber(0, false)).toBe('0');
      expect(formatStatNumber(8500, false)).toBe('8500');
      expect(formatStatNumber(9999, false)).toBe('9999');
    });
    it('万级用 K，3 位有效数字去尾零', () => {
      expect(formatStatNumber(10000, false)).toBe('10K');
      expect(formatStatNumber(12345, false)).toBe('12.3K');
      expect(formatStatNumber(123456, false)).toBe('123K');
    });
    it('百万级用 M', () => {
      expect(formatStatNumber(1000000, false)).toBe('1M');
      expect(formatStatNumber(1250000, false)).toBe('1.25M');
      expect(formatStatNumber(12345678, false)).toBe('12.3M');
    });
  });

  describe('中文 (isChinese=true)', () => {
    it('小于一万原样', () => {
      expect(formatStatNumber(0, true)).toBe('0');
      expect(formatStatNumber(9999, true)).toBe('9999');
    });
    it('万级用「万」', () => {
      expect(formatStatNumber(10000, true)).toBe('1万');
      expect(formatStatNumber(12345, true)).toBe('1.23万');
      expect(formatStatNumber(123456, true)).toBe('12.3万');
    });
    it('亿级用「亿」', () => {
      expect(formatStatNumber(100000000, true)).toBe('1亿');
      expect(formatStatNumber(125000000, true)).toBe('1.25亿');
    });
    it('支持 NetTable 传来的大数字字符串', () => {
      expect(formatStatNumber('12345678901234568', true)).toBe('123,456,789亿');
      expect(formatStatNumber('12345678901234568', false)).toBe('12,345,678,901M');
    });
    it('拆分数字和单位，空单位也保留结构', () => {
      expect(formatStatNumberParts(233, true)).toEqual({ value: '233', unit: '' });
      expect(formatStatNumberParts(32400, true)).toEqual({ value: '3.24', unit: '万' });
      expect(formatStatNumberParts('12345678901234568', true)).toEqual({
        value: '123,456,789',
        unit: '亿',
      });
    });
  });

  describe('防御', () => {
    it('负数与非有限数按 0', () => {
      expect(formatStatNumber(-5, false)).toBe('0');
      expect(formatStatNumber(NaN, true)).toBe('0');
      expect(formatStatNumber('not-a-number', true)).toBe('0');
    });
  });
});
