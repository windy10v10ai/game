/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

import { AWAKEN_RANDOM_CANDIDATE_COUNT, pickRandomCandidates } from './awaken-random';

// 取区间内确定值，便于断言；逻辑本身只关心排除/数量/不重复，不验证随机分布
beforeEach(() => {
  global.RandomInt = jest.fn((min: number, _max: number) => min);
});

const POOL = ['hero_a', 'hero_b', 'hero_c', 'hero_d', 'hero_e'];

describe('pickRandomCandidates', () => {
  it('剩余不足 count 时返回空数组', () => {
    const awakened = ['hero_a', 'hero_b', 'hero_c'];
    expect(pickRandomCandidates(POOL, awakened, AWAKEN_RANDOM_CANDIDATE_COUNT)).toEqual([]);
  });

  it('剩余恰好等于 count 时全部返回', () => {
    const awakened = ['hero_a', 'hero_b'];
    const result = pickRandomCandidates(POOL, awakened, AWAKEN_RANDOM_CANDIDATE_COUNT);
    expect(result).toHaveLength(3);
    expect(result.slice().sort()).toEqual(['hero_c', 'hero_d', 'hero_e']);
  });

  it('结果排除已觉醒英雄', () => {
    const awakened = ['hero_a'];
    const result = pickRandomCandidates(POOL, awakened, AWAKEN_RANDOM_CANDIDATE_COUNT);
    expect(result).not.toContain('hero_a');
  });

  it('结果不重复且数量为 count', () => {
    const result = pickRandomCandidates(POOL, [], AWAKEN_RANDOM_CANDIDATE_COUNT);
    expect(result).toHaveLength(AWAKEN_RANDOM_CANDIDATE_COUNT);
    expect(new Set(result).size).toBe(AWAKEN_RANDOM_CANDIDATE_COUNT);
  });

  it('空池返回空数组', () => {
    expect(pickRandomCandidates([], [], AWAKEN_RANDOM_CANDIDATE_COUNT)).toEqual([]);
  });
});
