/**
 * 计算基于智力的实际魔抗值
 * 使用3分段线性函数：低智力时收益高，高智力时收益递减
 * @param intellect 英雄的基础智力值
 * @returns 实际应该获得的魔抗值（百分比，0-100，例如25表示25%）
 */
export function calculateIntellectMagicResist(intellect: number): number {
  // 使用简单的3分段线性函数计算实际应该获得的魔抗
  // 分段规则：每段收益递减，简单高效
  // 预计算常量：前500点=25%，500-1000点=12.5%，前1000点=37.5%
  if (intellect <= 500) {
    // 0-500智力：每点0.05%
    return intellect * 0.05;
  } else if (intellect <= 1000) {
    // 500-1000智力：前500点固定25%，超出部分按0.025%
    return 25 + (intellect - 500) * 0.025;
  } else {
    // 1000+智力：前1000点固定37.5%，超出部分按0.01%
    // 大约5000智力时会超过100%魔抗上限
    return 37.5 + (intellect - 1000) * 0.01;
  }
}
