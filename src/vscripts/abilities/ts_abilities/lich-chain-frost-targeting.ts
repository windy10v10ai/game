export interface ChainFrostTargetCandidate {
  id: number;
  distance: number;
  current: boolean;
  valid: boolean;
  realHero: boolean;
  illusion: boolean;
  iceSpire: boolean;
  ordinary: boolean;
}

function nearest<T extends ChainFrostTargetCandidate>(candidates: T[]): T | undefined {
  let selected: T | undefined;
  for (const candidate of candidates) {
    if (!selected || candidate.distance < selected.distance) {
      selected = candidate;
    }
  }
  return selected;
}

/**
 * 巫妖觉醒连环霜冻下一跳优先级：
 * 多英雄只跳英雄；单英雄+尖柱在两者间跳；单英雄无尖柱允许普通单位；无英雄只跳普通单位。
 */
export function selectChainFrostNextTarget<T extends ChainFrostTargetCandidate>(
  candidates: T[],
): T | undefined {
  const valid = candidates.filter((candidate) => candidate.valid);
  const current = valid.find((candidate) => candidate.current);
  const next = valid.filter((candidate) => !candidate.current);
  const heroes = valid.filter((candidate) => candidate.realHero && !candidate.illusion);
  const nextHeroes = next.filter((candidate) => candidate.realHero && !candidate.illusion);
  const spires = next.filter((candidate) => candidate.iceSpire);
  const ordinary = next.filter((candidate) => candidate.ordinary && !candidate.iceSpire);

  if (heroes.length >= 2) {
    return nearest(nextHeroes);
  }

  if (heroes.length === 1) {
    const hero = heroes[0];
    if (spires.length > 0) {
      if (current?.iceSpire) {
        return hero.current ? undefined : hero;
      }
      if (current?.realHero && !current.illusion) {
        return nearest(spires);
      }
      return hero.current ? nearest(spires) : hero;
    }

    if (!hero.current) {
      return hero;
    }
    return nearest(ordinary);
  }

  return nearest(ordinary);
}
