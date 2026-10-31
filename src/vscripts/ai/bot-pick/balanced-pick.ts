/** 按定位标签给电脑挑英雄，限制同队每类定位的人数，避免阵容扎堆某一类（尤其是控制）。 */

export enum HeroRole {
  Control = 'control',
  Support = 'support',
  Tank = 'tank',
  Carry = 'carry',
}

export interface BotHeroEntry {
  name: string;
  roles: HeroRole[];
}

export type RoleCaps = Record<HeroRole, number>;

const BASE_TEAM_SIZE = 10;

/** 计算一队各定位的人数上限，以 10 人队为基准按人数缩放。 */
export function GetRoleCaps(teamSize: number, isSinglePlayer: boolean): RoleCaps {
  // 单人对局全靠玩家一人应对整队电脑，控制收得更紧
  const base: RoleCaps = {
    [HeroRole.Control]: isSinglePlayer ? 3 : 4,
    [HeroRole.Support]: 5,
    [HeroRole.Tank]: 4,
    [HeroRole.Carry]: 6,
  };
  const caps = {} as RoleCaps;
  for (const role of Object.values(HeroRole)) {
    caps[role] = Math.ceil((base[role] * teamSize) / BASE_TEAM_SIZE);
  }
  return caps;
}

// 玩家反馈集中在控制过多，控制超限的代价远高于其他定位
const OVERFLOW_PENALTY: Record<HeroRole, number> = {
  [HeroRole.Control]: 10,
  [HeroRole.Support]: 1,
  [HeroRole.Tank]: 1,
  [HeroRole.Carry]: 1,
};

/**
 * 从候选中挑一个最不会让本队超出定位上限的英雄，返回其下标。
 * @param random 返回 [0, max) 内的整数
 */
export function PickBalancedHeroIndex(
  candidates: BotHeroEntry[],
  teamRoles: HeroRole[][],
  caps: RoleCaps,
  random: (max: number) => number,
): number {
  const counts: Partial<Record<HeroRole, number>> = {};
  for (const roles of teamRoles) {
    for (const role of roles) {
      counts[role] = (counts[role] ?? 0) + 1;
    }
  }

  let bestPenalty = Infinity;
  let bestIndexes: number[] = [];
  candidates.forEach((candidate, index) => {
    let penalty = 0;
    for (const role of candidate.roles) {
      if ((counts[role] ?? 0) >= caps[role]) {
        penalty += OVERFLOW_PENALTY[role];
      }
    }
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestIndexes = [index];
    } else if (penalty === bestPenalty) {
      bestIndexes.push(index);
    }
  });

  return bestIndexes[random(bestIndexes.length)];
}
