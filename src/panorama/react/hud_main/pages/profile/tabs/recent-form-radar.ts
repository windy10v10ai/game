export type Corner = 'damage' | 'participation' | 'gold' | 'push' | 'survival' | 'support';

// 与网站的六边形同一套比例
// 承伤与死亡各占一半：只看死亡，躲在后排不上前的人得分最高
const SURVIVAL_TANK_WEIGHT = 0.5;
// 两项几乎不相关，平均后挤在中间，放大到和其他角一样分得开
const SURVIVAL_STRETCH = 1.6;
// 治疗取决于英雄有没有治疗技能，以较高的一项为主，没有治疗技能的辅助不被拖低；另一项加分，两项都会的排在前面
const SUPPORT_PRIMARY_WEIGHT = 0.9;
const SUPPORT_SECONDARY_WEIGHT = 0.25;
// 控制人人都有，只占一点，免得单靠控制就像辅助
const SUPPORT_STUNS_WEIGHT = 0.1;

/** 把接口的各项合成六边形的六个角。 */
export function combineCorners(radar: PlayerStatsRadar): Record<Corner, number> {
  const survivalAverage =
    SURVIVAL_TANK_WEIGHT * radar.tank + (1 - SURVIVAL_TANK_WEIGHT) * radar.deaths;
  const survival = Math.min(100, Math.max(0, 50 + SURVIVAL_STRETCH * (survivalAverage - 50)));
  const primary = Math.max(radar.healing, radar.assists);
  const secondary = Math.min(radar.healing, radar.assists);
  const supportCore = Math.min(
    100,
    SUPPORT_PRIMARY_WEIGHT * primary + SUPPORT_SECONDARY_WEIGHT * secondary,
  );
  const support = (1 - SUPPORT_STUNS_WEIGHT) * supportCore + SUPPORT_STUNS_WEIGHT * radar.stuns;
  return {
    damage: Math.round(radar.damage),
    participation: Math.round(radar.participation),
    gold: Math.round(radar.gold),
    push: Math.round(radar.push),
    survival: Math.round(survival),
    support: Math.round(support),
  };
}
