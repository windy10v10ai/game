// cmd enum

export enum CMD {
  V = '-v', // 获取当前vector
  M = '-m', // 获取当前modifier
  REFRESH_AI = '-r', // 刷新AI

  KILL = '-k',
  KILL_ALL = '-kall',
  G = '-g', // 加钱升级
  SHARD = '-shard', // 给自己碎片
  G_ALL = '-gall', // 所有人升级加钱
  L_ALL = '-lall', // 所有人逐级升级

  /** 抽奖 */
  LOTTERY = '-lottery',
  END = '-end',

  // ---- 当前英雄相关 ----
  /** 重置当前英雄技能 */
  RESET_ABILITY = '-resetAbility',
  /** 获取英雄状态抗性 */
  GET_SR = '-getSR',
  /** 对英雄造成存粹伤害 */
  DAMAGE_PURE = '-damagePure',
  /** 添加技能 */
  ADD_ABILITY = '-ab',
  ADD_ABILITY_ALL = '-aball',
  RM_ITEM = '-rmitem', // 移除物品
  REPLACE_NEUTRAL_ITEM = '-rn', // 替换中立物品
  REPLACE_ENHANCE_ITEM = '-re', // 替换附魔物品

  // ---- modifier相关 ----
  /**
   * 添加modifier
   * @param modifier名称
   */
  ADD_MODIFIER = '-addModifier', // 添加指定modifier
  REMOVE_MODIFIER = '-removeModifier', // 移除指定modifier
  ADD_MODIFIER_All_100 = '-addModifierAll100', // 添加指定modifier
  ADD_DATADRIVE_MODIFIER_All_100 = '-addDataDriveModifierAll100', // 添加指定modifier
  REMOVE_MODIFIER_ALL_100 = '-removeModifierAll100', // 移除指定modifier

  GET_KEY_V3 = '-get_key_v3', // 获取key
}
