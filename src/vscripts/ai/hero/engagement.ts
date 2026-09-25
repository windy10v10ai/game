/**
 * 英雄层交战判断：没打起来时只在明显打不过时避开；已经打起来就先把技能物品交出去再撤，跑不掉就打到底。
 * 目的是让 bot 有对抗性，不送的门槛放低。
 */

import { AVOID_POWER_RATIO } from '../team/power';

export type Stance = 'task' | 'fight' | 'avoid' | 'spend' | 'retreat' | 'lastStand';

export interface EngagementInput {
  engaged: boolean;
  ourPower: number;
  enemyPower: number;
  canEscape: boolean;
  /** 本次交战里打不过之后已经交出去的技能与物品次数 */
  spentActions: number;
}

// 已经交战时，敌方略强也继续打，打团本来就有来回
const KEEP_FIGHTING_RATIO = 1.3;
const SPEND_BUDGET = 2;

export function decideStance(input: EngagementInput): Stance {
  if (input.enemyPower <= 0) {
    return 'task';
  }
  if (!input.engaged) {
    return input.enemyPower > input.ourPower * AVOID_POWER_RATIO ? 'avoid' : 'fight';
  }
  if (input.enemyPower <= input.ourPower * KEEP_FIGHTING_RATIO) {
    return 'fight';
  }
  if (!input.canEscape) {
    return 'lastStand';
  }
  return input.spentActions < SPEND_BUDGET ? 'spend' : 'retreat';
}

export interface EscapeInput {
  rooted: boolean;
  ourSpeed: number;
  fastestEnemySpeed: number;
  distanceToSafety: number;
}

// 敌方移速快出这么多时，离安全点稍远就追得上
const SPEED_GAP = 30;
const SAFE_DISTANCE_WHEN_SLOWER = 1500;

export function canEscape(input: EscapeInput): boolean {
  if (input.rooted) {
    return false;
  }
  if (input.fastestEnemySpeed > input.ourSpeed + SPEED_GAP) {
    return input.distanceToSafety <= SAFE_DISTANCE_WHEN_SLOWER;
  }
  return true;
}
