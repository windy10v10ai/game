/** 随机抽选觉醒：从可觉醒英雄池排除已觉醒后随机取候选。 */

export const AWAKEN_RANDOM_CANDIDATE_COUNT = 3;

/**
 * 从 allHeroNames 排除 awakenedHeroNames 后随机取 count 个不重复英雄名。
 * 剩余不足 count（即可觉醒英雄 < 3）时返回空数组,调用方据此判定随机不可用。
 */
export function pickRandomCandidates(
  allHeroNames: string[],
  awakenedHeroNames: string[],
  count: number,
): string[] {
  const pool = allHeroNames.filter((name) => !awakenedHeroNames.includes(name));
  if (pool.length < count) {
    return [];
  }
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = RandomInt(0, pool.length - 1);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}
