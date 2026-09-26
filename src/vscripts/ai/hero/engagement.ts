/**
 * 英雄层交战判断：没打起来时只在明显打不过时避开；已经打起来打不过就边撤边放技能物品，动不了才打到底。
 * 目的是让 bot 有对抗性，不送的门槛放低；撤向队友或塔总比原地硬打多一线生机，所以不按移速预判跑不掉。
 */

import { AVOID_POWER_RATIO } from '../team/power';

export type Stance = 'task' | 'fight' | 'avoid' | 'retreat' | 'lastStand';

export interface EngagementInput {
  engaged: boolean;
  ourPower: number;
  enemyPower: number;
  canEscape: boolean;
}

// 已经交战时，敌方略强也继续打，打团本来就有来回
const KEEP_FIGHTING_RATIO = 2;

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
  return input.canEscape ? 'retreat' : 'lastStand';
}
