/**
 * 觉醒替换配置：物品觉醒（路线 A）与未来数据觉醒（路线 B）共用同一张表。
 * 增删觉醒英雄后，记得同步更新觉醒预览页 AwakenTab.tsx 的 AWAKEN_ABILITIES（含顺序，新增的排最前）。
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
  /** 该标记技能可见期间新技能保持隐藏且不删 targetAbility（如上古巨神丢魂中途不打断原生召回流程） */
  keepHiddenWhile?: string;
}

export const ABILITY_REPLACEMENTS: AbilityReplacement[] = [
  // 戴泽 觉醒
  {
    heroName: 'npc_dota_hero_dazzle',
    newAbility: 'special_bonus_unique_dazzle_upgrade',
    newLevel: 1,
  },
  // 半人马战行者 觉醒：双刃剑替换为觉醒版，同时添加隐藏机制能力
  {
    heroName: 'npc_dota_hero_centaur',
    targetAbility: 'centaur_double_edge',
    newAbility: 'centaur_double_edge_awakened',
    newLevel: 0,
  },
  {
    heroName: 'npc_dota_hero_centaur',
    newAbility: 'special_bonus_unique_centaur_upgrade',
    newLevel: 1,
  },
  // 上古巨神 觉醒
  {
    heroName: 'npc_dota_hero_elder_titan',
    targetAbility: 'elder_titan_ancestral_spirit',
    newAbility: 'elder_titan_ancestral_spirit_awaken',
    newLevel: 0,
    keepHiddenWhile: 'elder_titan_return_spirit',
  },
  // 炸弹人 觉醒
  {
    heroName: 'npc_dota_hero_techies',
    newAbility: 'techies_squees_scope',
    newLevel: 1,
  },
  // 尸王 觉醒
  {
    heroName: 'npc_dota_hero_undying',
    newAbility: 'special_bonus_unique_undying_upgrade',
    newLevel: 1,
  },
  // 巫妖 觉醒
  {
    heroName: 'npc_dota_hero_lich',
    newAbility: 'special_bonus_unique_lich_upgrade',
    newLevel: 1,
  },
  // 末日使者 觉醒
  {
    heroName: 'npc_dota_hero_doom_bringer',
    targetAbility: 'doom_bringer_doom',
    newAbility: 'doom_bringer_doom_awakened',
    newLevel: 0,
  },
  // 光之守卫 觉醒
  {
    heroName: 'npc_dota_hero_keeper_of_the_light',
    newAbility: 'special_bonus_unique_keeper_of_the_light_upgrade',
    newLevel: 1,
  },
  // 水晶室女 觉醒
  {
    heroName: 'npc_dota_hero_crystal_maiden',
    newAbility: 'special_bonus_unique_crystal_maiden_upgrade',
    newLevel: 1,
  },
  // 小小 觉醒
  {
    heroName: 'npc_dota_hero_tiny',
    newAbility: 'special_bonus_unique_tiny_upgrade',
    newLevel: 1,
  },
  // 军团指挥官 自动决斗（插入 slot 4，即 Ability5 空槽，与大招决斗 LinkedAbility 同步升级，初始等级继承大招）
  {
    heroName: 'npc_dota_hero_legion_commander',
    targetSlot: 4,
    newAbility: 'legion_commander_auto_duel',
    newLevel: 0,
    inheritLevelFrom: 'legion_commander_duel',
  },
  // 凤凰 觉醒
  {
    heroName: 'npc_dota_hero_phoenix',
    newAbility: 'special_bonus_unique_phoenix_upgrade',
    newLevel: 1,
  },
  // 术士 觉醒
  {
    heroName: 'npc_dota_hero_warlock',
    newAbility: 'special_bonus_unique_warlock_upgrade',
    newLevel: 1,
  },
  // 斯温 觉醒（与风暴之拳 LinkedAbility 同步升级，初始等级继承风暴之拳）
  {
    heroName: 'npc_dota_hero_sven',
    newAbility: 'special_bonus_unique_sven_upgrade',
    newLevel: 0,
    inheritLevelFrom: 'sven_storm_bolt',
  },
  // 发条技师 觉醒
  {
    heroName: 'npc_dota_hero_rattletrap',
    newAbility: 'special_bonus_unique_rattletrap_upgrade',
    newLevel: 1,
  },
  // 风行者 觉醒（替换大招 focusfire，等级同步已学等级）
  {
    heroName: 'npc_dota_hero_windrunner',
    targetAbility: 'windrunner_focusfire',
    newAbility: 'windrunner_whirlwind_custom',
    newLevel: 0,
  },
  // 昆卡 觉醒（复用原版神杖技能 kunkka_torrent_storm，插入朗姆酒原槽位，朗姆酒保留等级挪至其他槽位）
  {
    heroName: 'npc_dota_hero_kunkka',
    targetSlot: 3, // Ability4（0-indexed），原版对应 kunkka_admirals_rum
    newAbility: 'kunkka_torrent_storm',
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
  // 寒冬飞龙 觉醒
  {
    heroName: 'npc_dota_hero_winter_wyvern',
    newAbility: 'special_bonus_unique_winter_wyvern_upgrade',
    newLevel: 1,
  },
  // 齐天大圣 觉醒
  {
    heroName: 'npc_dota_hero_monkey_king',
    newAbility: 'special_bonus_unique_monkey_king_upgrade',
    newLevel: 1,
  },
  // 莉娜 神灭斩觉醒（新增被动：施放神灭斩附带等额纯粹伤害）
  {
    heroName: 'npc_dota_hero_lina',
    newAbility: 'special_bonus_unique_lina_upgrade',
    newLevel: 1,
  },
  // 钢背兽 自动喷刺（新增 autocast 总开关：有敌方英雄时自动黏液+倒刺）
  {
    heroName: 'npc_dota_hero_bristleback',
    newAbility: 'special_bonus_unique_bristleback_upgrade',
    newLevel: 1,
  },
  // 卓尔游侠 裂影箭（新增被动，固定概率不随等级变化）
  {
    heroName: 'npc_dota_hero_drow_ranger',
    newAbility: 'special_bonus_unique_drow_ranger_upgrade',
    newLevel: 1,
  },
  // 影魔 魂之挽歌护体（新增被动）
  {
    heroName: 'npc_dota_hero_nevermore',
    newAbility: 'special_bonus_unique_nevermore_upgrade',
    newLevel: 1,
  },
  // 巫医 神语（新增被动）
  {
    heroName: 'npc_dota_hero_witch_doctor',
    newAbility: 'special_bonus_unique_witch_doctor_upgrade',
    newLevel: 1,
  },
  // 幻影刺客 幻影突袭（替换幻影突袭闪烁）
  {
    heroName: 'npc_dota_hero_phantom_assassin',
    targetAbility: 'phantom_assassin_phantom_strike',
    newAbility: 'special_bonus_unique_phantom_assassin_upgrade',
    newLevel: 0,
  },
  // 宙斯 神王（新增被动）
  {
    heroName: 'npc_dota_hero_zuus',
    newAbility: 'special_bonus_unique_zuus_upgrade',
    newLevel: 1,
  },
  // 死灵法师 竭心光环觉醒：替换原版竭心光环为 DataDriven 脚本伤害版
  {
    heroName: 'npc_dota_hero_necrolyte',
    targetAbility: 'necrolyte_heartstopper_aura',
    newAbility: 'necrolyte_heartstopper_aura_datadriven',
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
  // 狙击手 觉醒刺杀
  {
    heroName: 'npc_dota_hero_sniper',
    targetAbility: 'sniper_assassinate',
    newAbility: 'special_bonus_unique_sniper_assassinate_upgrade',
    newLevel: 0,
  },
  // 剑圣 觉醒剑刃风暴
  {
    heroName: 'npc_dota_hero_juggernaut',
    targetAbility: 'juggernaut_blade_fury',
    newAbility: 'juggernaut_blade_fury_custom',
    newLevel: 0,
  },
  // 屠夫 觉醒肉钩：把原版 pudge_meat_hook 替换为射程随力量增长的觉醒版
  {
    heroName: 'npc_dota_hero_pudge',
    targetAbility: 'pudge_meat_hook',
    newAbility: 'pudge_meat_hook_lua',
    newLevel: 0,
  },
];

/**
 * 限时免费体验清单：清单内英雄不需积分解锁，选它出场即自动觉醒。
 * 新觉醒发布时加入，下次发版由 awaken-ability skill 流程确认移出。
 */
export const FREE_TRIAL_HEROES: string[] = [
  'npc_dota_hero_dazzle', // 戴泽
  'npc_dota_hero_elder_titan', // 上古巨神
  'npc_dota_hero_techies', // 炸弹人
  'npc_dota_hero_undying', // 尸王
  'npc_dota_hero_lich', // 巫妖
  'npc_dota_hero_doom_bringer', // 末日使者
  'npc_dota_hero_keeper_of_the_light', // 光之守卫
  'npc_dota_hero_crystal_maiden', // 水晶室女
  'npc_dota_hero_tiny', // 小小
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
