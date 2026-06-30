/**
 * 觉醒替换配置：物品觉醒（路线 A）与未来数据觉醒（路线 B）共用同一张表。
 * 增删觉醒英雄后，记得同步更新觉醒预览页 AwakenTab.tsx 的 AWAKEN_ABILITIES。
 */

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
  // 狙击手 觉醒刺杀
  {
    heroName: 'npc_dota_hero_sniper',
    targetAbility: 'sniper_assassinate',
    newAbility: 'special_bonus_unique_sniper_assassinate_upgrade',
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
  // 卓尔游侠 裂影箭（新增被动，固定概率不随等级变化）
  {
    heroName: 'npc_dota_hero_drow_ranger',
    newAbility: 'special_bonus_unique_drow_ranger_upgrade',
    newLevel: 1,
  },
  // 钢背兽 自动喷刺（新增 autocast 总开关：有敌方英雄时自动黏液+倒刺）
  {
    heroName: 'npc_dota_hero_bristleback',
    newAbility: 'special_bonus_unique_bristleback_upgrade',
    newLevel: 1,
  },
  // 莉娜 神灭斩觉醒（新增被动：施放神灭斩附带等额纯粹伤害）
  {
    heroName: 'npc_dota_hero_lina',
    newAbility: 'special_bonus_unique_lina_upgrade',
    newLevel: 1,
  },
  // 齐天大圣 觉醒
  {
    heroName: 'npc_dota_hero_monkey_king',
    newAbility: 'special_bonus_unique_monkey_king_upgrade',
    newLevel: 1,
  },
  // 寒冬飞龙 觉醒
  {
    heroName: 'npc_dota_hero_winter_wyvern',
    newAbility: 'special_bonus_unique_winter_wyvern_upgrade',
    newLevel: 1,
  },
  // 食人魔魔法师 觉醒（复用抽奖池技能，与大招 LinkedAbility 同步升级，初始等级继承大招）
  {
    heroName: 'npc_dota_hero_ogre_magi',
    targetAbility: 'ogre_magi_dumb_luck',
    newAbility: 'ogre_magi_multicast_lua',
    newLevel: 0,
    inheritLevelFrom: 'ogre_magi_multicast',
  },
  // 昆卡 觉醒（复用原版神杖技能 kunkka_torrent_storm）
  {
    heroName: 'npc_dota_hero_kunkka',
    targetAbility: 'kunkka_admirals_rum',
    newAbility: 'kunkka_torrent_storm',
    newLevel: 1,
  },
];

/** 可觉醒英雄名去重列表（随机抽选的英雄池真源） */
export function getAwakenHeroNames(): string[] {
  const names: string[] = [];
  for (const replacement of ABILITY_REPLACEMENTS) {
    if (!names.includes(replacement.heroName)) {
      names.push(replacement.heroName);
    }
  }
  return names;
}
