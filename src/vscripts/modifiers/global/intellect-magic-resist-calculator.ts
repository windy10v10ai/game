/**
 * 计算基于智力的实际魔抗值
 * 使用双曲递减收益函数：确保魔抗平滑增长且永远不会达到上限
 *
 * @param intellect 英雄的基础智力值
 * @returns 实际应该获得的魔抗值（百分比，0-100，例如25表示25%）
 */
export function calculateIntellectMagicResist(intellect: number): number {
  const maxCap = 75; // 最终上限百分比
  const c = 0.001; // 缩放系数

  return maxCap * ((c * intellect) / (1 + c * intellect));
}
