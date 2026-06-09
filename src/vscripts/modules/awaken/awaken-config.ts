/** 觉醒替换配置：物品觉醒（路线 A）与未来数据觉醒（路线 B）共用同一张表 */

export interface AbilityReplacement {
  heroName: string;
  /** 要被替换/移除的旧技能名（与 targetSlot 二选一） */
  targetAbility?: string;
  /** 要插入的槽位（与 targetAbility 二选一）；命中非空槽位时执行插入，原技能保留等级重新加回 */
  targetSlot?: number;
  newAbility: string;
  newLevel: number;
  /** 加新技能时改为继承此关联技能的当前等级（用于 LinkedAbility 同步升级的技能初始等级对齐），优先级高于 newLevel */
  inheritLevelFrom?: string;
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
  // 斧王 自动淘汰之刃（插入 slot 3，与大招淘汰之刃 LinkedAbility 同步升级，初始等级继承大招）
  {
    heroName: 'npc_dota_hero_axe',
    targetSlot: 3,
    newAbility: 'axe_auto_culling_blade',
    newLevel: 0,
    inheritLevelFrom: 'axe_culling_blade',
  },
  // 死灵法师 竭心光环觉醒：替换原版竭心光环为 DataDriven 脚本伤害版
  {
    heroName: 'npc_dota_hero_necrolyte',
    targetAbility: 'necrolyte_heartstopper_aura',
    newAbility: 'necrolyte_heartstopper_aura_datadriven',
    newLevel: 0,
  },
  // 卓尔游侠 数箭连发（插入 slot 4，与数箭齐发共享 CD、LinkedAbility 同步升级，初始等级继承大招）
  {
    heroName: 'npc_dota_hero_drow_ranger',
    targetSlot: 4,
    newAbility: 'special_bonus_unique_drow_ranger_upgrade',
    newLevel: 0,
    inheritLevelFrom: 'drow_ranger_multishot',
  },
  // 宙斯 神王（新增被动）
  {
    heroName: 'npc_dota_hero_zuus',
    newAbility: 'special_bonus_unique_zuus_upgrade',
    newLevel: 1,
  },
  // 幻影刺客 幻影突袭（替换幻影突袭闪烁）
  {
    heroName: 'npc_dota_hero_phantom_assassin',
    targetAbility: 'phantom_assassin_phantom_strike',
    newAbility: 'special_bonus_unique_phantom_assassin_upgrade',
    newLevel: 0,
  },
  // 巫医 神语（新增被动）
  {
    heroName: 'npc_dota_hero_witch_doctor',
    newAbility: 'special_bonus_unique_witch_doctor_upgrade',
    newLevel: 1,
  },
  // 影魔 魂之挽歌护体（新增被动）
  {
    heroName: 'npc_dota_hero_nevermore',
    newAbility: 'special_bonus_unique_nevermore_upgrade',
    newLevel: 1,
  },
];
