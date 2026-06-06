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
  // 剑圣 觉醒剑刃风暴
  {
    heroName: 'npc_dota_hero_juggernaut',
    targetAbility: 'juggernaut_blade_fury',
    newAbility: 'juggernaut_blade_fury_custom',
    newLevel: 0,
  },
  // 斯拉克 刮痧之王（新增被动）
  {
    heroName: 'npc_dota_hero_slark',
    newAbility: 'break_speed_limit',
    newLevel: 0,
  },
  // 狙击手 觉醒刺杀
  {
    heroName: 'npc_dota_hero_sniper',
    targetAbility: 'sniper_assassinate',
    newAbility: 'sniper_assassinate_upgrade',
    newLevel: 0,
  },
  // 斧王 自动淘汰之刃（插入 slot 3）
  {
    heroName: 'npc_dota_hero_axe',
    targetSlot: 3,
    newAbility: 'axe_auto_culling_blade',
    newLevel: 0,
  },
];
