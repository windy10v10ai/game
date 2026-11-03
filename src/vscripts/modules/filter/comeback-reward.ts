/**
 * 丢塔后打野与补兵的收益倍数，给劣势局留翻盘空间。
 *
 * @param towersLost - 己方已丢掉的防御塔数量。
 * @returns 每丢一座塔 +3%，最多 +30%。
 */
export function farmRewardBonus(towersLost: number): number {
  return 1 + 0.03 * Math.min(towersLost, 10);
}
