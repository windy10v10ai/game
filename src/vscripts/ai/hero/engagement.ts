/**
 * 英雄层交战判断：对面强不是撤退的理由，扛不住才是。没打起来时打不过只保持距离、够得着就放技能；
 * 打起来后按「还能撑几秒」决定去留，撑得住就一直打，跑不掉才原地还手。
 */

import { AVOID_POWER_RATIO, KEEP_FIGHTING_RATIO } from '../team/power';

export type Stance = 'task' | 'fight' | 'hold' | 'retreat' | 'lastStand';

// 按近期受到的伤害还能撑这么多秒以上就继续打；打不过时留更多余量，撤退要走一段路
const SURVIVE_SECONDS = 3;
const SURVIVE_SECONDS_LOSING = 6;

export interface EngagementInput {
  engaged: boolean;
  ourPower: number;
  enemyPower: number;
  canEscape: boolean;
  /** 按近期受到的伤害，自己还能撑的秒数 */
  survivalSeconds: number;
  /** 上一次判断就在撤退 */
  wasRetreating: boolean;
}

/** 还没打起来时，这波敌人是否值得主动上去打：走上去交战与先手跳进敌人身边都用这一个口径。 */
export function canEngage(ourPower: number, enemyPower: number): boolean {
  return enemyPower <= ourPower * AVOID_POWER_RATIO;
}

export function decideStance(input: EngagementInput): Stance {
  if (input.enemyPower <= 0) {
    return 'task';
  }
  if (!input.engaged) {
    return canEngage(input.ourPower, input.enemyPower) ? 'fight' : 'hold';
  }
  // 撤退中伤害停了也不马上回头，否则残血在交战边缘来回进出
  if (input.wasRetreating) {
    return input.canEscape ? 'retreat' : 'lastStand';
  }
  const losing = input.enemyPower > input.ourPower * KEEP_FIGHTING_RATIO;
  if (input.survivalSeconds >= (losing ? SURVIVE_SECONDS_LOSING : SURVIVE_SECONDS)) {
    return 'fight';
  }
  return input.canEscape ? 'retreat' : 'lastStand';
}

export function survivalSeconds(health: number, damage: number, elapsed: number): number {
  if (damage <= 0 || elapsed <= 0) {
    return Infinity;
  }
  return health / (damage / elapsed);
}

export interface EscapeInput {
  rooted: boolean;
  /** 有比自己快的敌人已经贴到自己攻击距离内 */
  caughtByFaster: boolean;
}

/** 只有被定身、或已被更快的敌人贴身追着打才算跑不掉，此时原地还手；甩开了就继续跑。 */
export function canEscape(input: EscapeInput): boolean {
  return !input.rooted && !input.caughtByFaster;
}
