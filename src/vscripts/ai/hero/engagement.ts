/**
 * 英雄层交战判断：没打起来时只在明显打不过时撤开；已经打起来打不过就边撤边放技能物品，跑不掉才打到底。
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
  ourSpeed: number;
  fastestEnemySpeed: number;
  distanceToSafety: number;
}

// 敌方快这么多倍、且要跑这么多秒才到撤退点，才算肯定被追上
const HOPELESS_SPEED_RATIO = 1.5;
const HOPELESS_ESCAPE_SECONDS = 6;

export function canEscape(input: EscapeInput): boolean {
  if (input.rooted) {
    return false;
  }
  const escapeSeconds = input.distanceToSafety / Math.max(input.ourSpeed, 1);
  return !(
    input.fastestEnemySpeed >= input.ourSpeed * HOPELESS_SPEED_RATIO &&
    escapeSeconds > HOPELESS_ESCAPE_SECONDS
  );
}
