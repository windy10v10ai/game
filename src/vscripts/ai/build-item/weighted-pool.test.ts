/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

// 分布类断言需要真实随机性，而非确定性 mock；沿用 SelectRandomItem 同款 RandomFloat(min, max) 签名
global.RandomFloat = (min: number, max: number) => min + Math.random() * (max - min);

import {
  CandidatePoolEntry,
  PickWeightedOne,
  ResolveCandidateEntry,
  SampleWeightedWithoutReplacement,
} from './weighted-pool';

describe('ResolveCandidateEntry', () => {
  it('字符串候选项 weight 缺省为 1', () => {
    expect(ResolveCandidateEntry('item_x')).toEqual({ item: 'item_x', weight: 1 });
  });

  it('对象候选项原样返回 weight', () => {
    expect(ResolveCandidateEntry({ item: 'item_y', weight: 3 })).toEqual({
      item: 'item_y',
      weight: 3,
    });
  });
});

describe('SampleWeightedWithoutReplacement', () => {
  it('3 项等权重候选池抽 2 个：长度恰为 2、不重复、各候选出现比例落在 30%~70%', () => {
    const pool: CandidatePoolEntry[] = ['item_a', 'item_b', 'item_c'];
    const counts: Record<string, number> = { item_a: 0, item_b: 0, item_c: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const result = SampleWeightedWithoutReplacement(pool, 2);
      expect(result).toHaveLength(2);
      expect(new Set(result).size).toBe(2);
      for (const item of result) counts[item]++;
    }

    for (const key of Object.keys(counts)) {
      const ratio = counts[key] / iterations;
      expect(ratio).toBeGreaterThanOrEqual(0.3);
      expect(ratio).toBeLessThanOrEqual(0.7);
    }
  });

  it('候选池长度小于 count 时返回全部候选', () => {
    const pool: CandidatePoolEntry[] = ['item_a', 'item_b'];
    const result = SampleWeightedWithoutReplacement(pool, 3);
    expect(result).toHaveLength(2);
    expect(new Set(result)).toEqual(new Set(['item_a', 'item_b']));
  });

  it('空候选池返回空数组', () => {
    const result = SampleWeightedWithoutReplacement([], 2);
    expect(result).toEqual([]);
  });
});

describe('PickWeightedOne', () => {
  it('重复调用约 1000 次，按权重比例分布：a 40%~60%，b/c 各 15%~35%', () => {
    const weights = { a: 50, b: 25, c: 25 };
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const picked = PickWeightedOne(weights);
      expect(picked).toBeDefined();
      counts[picked as string]++;
    }

    expect(counts.a / iterations).toBeGreaterThanOrEqual(0.4);
    expect(counts.a / iterations).toBeLessThanOrEqual(0.6);
    expect(counts.b / iterations).toBeGreaterThanOrEqual(0.15);
    expect(counts.b / iterations).toBeLessThanOrEqual(0.35);
    expect(counts.c / iterations).toBeGreaterThanOrEqual(0.15);
    expect(counts.c / iterations).toBeLessThanOrEqual(0.35);
  });

  it('空对象调用返回 undefined', () => {
    expect(PickWeightedOne({})).toBeUndefined();
  });
});
