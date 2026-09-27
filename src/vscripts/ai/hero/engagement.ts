/**
 * 英雄层交战判断：没打起来时只在明显打不过时撤开；已经打起来打不过就边撤边放技能物品，跑不掉才原地还手。
 * 目的是让 bot 有对抗性，不送的门槛放低；撤向队友或塔总比原地硬打多一线生机，所以跑不掉的门槛定得很高。
 */

import { AVOID_POWER_RATIO, KEEP_FIGHTING_RATIO } from '../team/power';

export type Stance = 'task' | 'fight' | 'retreat' | 'lastStand';

export interface EngagementInput {
  engaged: boolean;
  ourPower: number;
  enemyPower: number;
  canEscape: boolean;
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
    return canEngage(input.ourPower, input.enemyPower) ? 'fight' : 'retreat';
  }
  if (input.enemyPower <= input.ourPower * KEEP_FIGHTING_RATIO) {
    return 'fight';
  }
  return input.canEscape ? 'retreat' : 'lastStand';
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
