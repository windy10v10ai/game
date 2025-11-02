// cmd enum

export enum CMD {
  // ---- 常用命令 ----
  V = '-v', // 获取当前vector
  M = '-m', // 获取当前modifier
  A = '-a', // 获取当前ability
  REFRESH_AI = '-r', // 刷新AI
  T = '-t', // 获取当前时间，不包含暂停

  KILL = '-k',
  KILL_ALL = '-kall',
  SHARD = '-shard', // 给自己碎片
  G = '-g', // 加钱升级
  G_ALL = '-gall', // 所有人升级加钱
  L_ALL = '-lall', // 所有人逐级升级

  GA4 = '-ga', // 发送GA4事件

  /** 抽奖 */
  LOTTERY = '-lottery',
  END = '-end',

  // ---- 当前英雄相关 ----
  REPLACE_HERO = '-rh', // 替换当前英雄
  /** 重置当前英雄技能 */
  RESET_ABILITY = '-resetAbility',
  REFRESH_BUYBACK = '-refreshBuyback',
  /** 获取英雄状态抗性 */
  GET_SR = '-getSR',
  /** 对英雄造成存粹伤害 */
  DAMAGE_PURE = '-damagePure',
  HP_LOSS = '-hploss',
  STUN = '-stun',
  SILENCE = '-silence',
  ROOT = '-root',

  // ---- ability ----
  ADD_ABILITY = '-ab',
  ADD_ABILITY_ALL = '-aball',

  // ---- item ----
  ADD_BKB_ALL = '-bkball', // 所有人添加bkb
  ADD_ITEM_ALL = '-additemall', // 所有人添加物品
  REMOVE_ITEM_ALL = '-rmiall', // 移除所有物品
  RM_ITEM = '-rmitem', // 移除物品
  REPLACE_NEUTRAL_ITEM = '-rn', // 替换中立物品
  REPLACE_ENHANCE_ITEM = '-re', // 替换附魔物品
  REPLACE_ITEM_ALL = '-rpiall', // 替换所有物品

  // ---- modifier相关 ----
  // lua modifier，需要先购买物品激活
  MODIFIER_ADD = '-ma', // 添加指定modifier
  MODIFIER_REMOVE = '-mr', // 移除指定modifier
  MODIFIER_ADD_All = '-maall', // 添加指定modifier
  MODIFIER_ADD_DATADRIVE_All = '-madall', // 添加数据驱动modifier
  MODIFIER_REMOVE_All = '-mrall', // 移除指定modifier

  GET_KEY_V3 = '-get_key_v3', // 获取key
}
