export type Corner = 'damage' | 'participation' | 'gold' | 'push' | 'survival' | 'support';

// 与网站的六边形同一套比例
// 承伤与死亡各占一半：只看死亡，躲在后排不上前的人得分最高
const SURVIVAL_TANK_WEIGHT = 0.5;
// 治疗型和助攻型辅助很少两项都高，以较高的一项为主才不会互相拖低，另一项只加分，两项都会的排在只会一项的前面
const SUPPORT_SECONDARY_WEIGHT = 0.3;
// 控制人人都有，只占一点，免得单靠控制就像辅助
const SUPPORT_STUNS_WEIGHT = 0.1;

/** 把接口的各项合成六边形的六个角。 */
export function combineCorners(radar: PlayerStatsRadar): Record<Corner, number> {
  const survival = SURVIVAL_TANK_WEIGHT * radar.tank + (1 - SURVIVAL_TANK_WEIGHT) * radar.deaths;
  const primary = Math.max(radar.healing, radar.assists);
  const secondary = Math.min(radar.healing, radar.assists);
  const support =
    (1 - SUPPORT_STUNS_WEIGHT) * Math.min(100, primary + SUPPORT_SECONDARY_WEIGHT * secondary) +
    SUPPORT_STUNS_WEIGHT * radar.stuns;
  return {
    damage: Math.round(radar.damage),
    participation: Math.round(radar.participation),
    gold: Math.round(radar.gold),
    push: Math.round(radar.push),
    survival: Math.round(survival),
    support: Math.round(support),
  };
}
