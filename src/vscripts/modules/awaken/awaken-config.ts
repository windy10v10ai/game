/** 觉醒替换配置：物品觉醒（路线 A）与未来数据觉醒（路线 B）共用同一张表 */

export interface AbilityReplacement {
  heroName: string;
  /** 要被替换/移除的旧技能名（与 targetSlot 二选一） */
  targetAbility?: string;
  /** 要插入的槽位（与 targetAbility 二选一）；命中非空槽位时执行插入，原技能保留等级重新加回 */
  targetSlot?: number;
  newAbility: string;
  newLevel: number;
}

export const ABILITY_REPLACEMENTS: AbilityReplacement[] = [
  // 屠夫 觉醒肉钩：把原版 pudge_meat_hook 替换为射程随力量增长的觉醒版
  {
    heroName: 'npc_dota_hero_pudge',
    targetAbility: 'pudge_meat_hook',
    newAbility: 'pudge_meat_hook_lua',
    newLevel: 0,
  },
];
