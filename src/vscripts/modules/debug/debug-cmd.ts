// cmd enum

export enum CMD {
  // ---- 常用命令 ----
  V = '-v', // 获取当前vector
  M = '-m', // 获取当前modifier
  A = '-a', // 获取当前ability
  REFRESH_AI = '-r', // 刷新AI
  TIME = '-time', // 获取当前时间，不包含暂停
  D = '-d', // 获取当前伤害
  S = '-s', // 获取控制时长与治疗量

  KILL = '-k',
  KILL_ALL = '-kall',
  G = '-g', // 加钱升级
  G_ALL = '-gall', // 所有人升级加钱
  L = '-l', // 所有人略微升级加钱
  L_ALL = '-lall', // 所有人逐级升级

  LOTTERY = '-lottery', // 抽奖
  END = '-end', // 游戏结算
  TREASURE = '-treasure', // 在 SPAWN_POINTS_INITIAL 刷新一个藏宝箱
  PICK_ITEM = '-pickitem', // 强制触发物品抽奖 UI（跳过宝箱）

  BOT_THINKING_ENABLE = '-bte', // 开启/关闭 bot
  BOT_THINKING_DISABLE = '-btd', // 开启/关闭 bot

  // ---- 当前英雄相关 ----
  REPLACE_HERO = '-rh', // 替换当前英雄
  /** 重置当前英雄技能 */
  RESET_ABILITY = '-resetAbility',
  REFRESH_BUYBACK = '-refreshBuyback',
  /** 对英雄造成存粹伤害 */
  DAMAGE_PURE = '-damagePure',
  HP_LOSS = '-hploss',
  MP_LOSS = '-mploss',
  STUN = '-stun',
  SILENCE = '-silence',
  ROOT = '-root',

  // ---- item ----
  ADD_BKB_ALL = '-bkball', // 所有人添加bkb
  ADD_PHASE_AXE_ALL = '-phaseaxeall', // 所有人添加相位斧
  ADD_ITEM_ALL = '-additemall', // 所有人添加物品
  REMOVE_ITEM_ALL = '-rmiall', // 移除所有物品
  RM_ITEM = '-rmitem', // 移除物品
  REPLACE_NEUTRAL_ITEM = '-rn', // 替换中立物品
  REPLACE_ENHANCE_ITEM = '-re', // 替换附魔物品
  REPLACE_ITEM_ALL = '-rpa', // 替换所有物品
  REPLACE_ITEM_LIST = '-rpl', // 替换指定装备

  // ---- modifier相关 ----
  // lua modifier，需要先购买物品激活
  MODIFIER_ADD = '-ma', // 添加指定modifier
  MODIFIER_REMOVE = '-mr', // 移除指定modifier
  MODIFIER_ADD_All = '-maall', // 添加指定modifier
  MODIFIER_ADD_DATADRIVE_All = '-madall', // 添加数据驱动modifier
  MODIFIER_REMOVE_All = '-mrall', // 移除指定modifier

  GET_KEY_V3 = '-get_key_v3', // 获取key

  // ---- 性能排查 ----
  PERF = '-perf', // 开启/关闭性能采样
  PERF_MARK = '-perfmark', // 切换实验段标签
  PERF_PROF = '-perfprof', // 开启/关闭 Lua 耗时归因
  PERF_AUTO = '-perfauto', // 在当前局跑完整套对照实验：-perfauto <每段真实秒数> <重复次数> <测量倍率>
  AI_ON = '-aion', // 开启自定义 AI 思考
  AI_OFF = '-aioff', // 关闭自定义 AI 思考
  CLEAR_UNITS = '-clearunits', // 移除所有小兵、野怪、召唤物
  SPAWN_UNITS = '-spawnunits', // 中路两侧各刷一半近战兵

  // ---- 实机测试 ----
  STAT = '-stat', // 分行输出英雄与假人能读到的全部数值：基础、三维、攻击、防御（护甲/魔抗/状态抗性）、技能增强/施法距离/冷却缩减、物品冷却
  WATCH = '-watch', // 开关：监视英雄与假人的 modifier 与数值变化；-watch <半径> 额外监视范围内敌人
  CAST = '-cast', // 代码施法：-cast <物品或技能名> [<x偏移> <y偏移> | @dummy]，备用施法只认玩家真实按键，代码触发不了
  DUMMY = '-dummy', // 在英雄偏移处刷训练假人：-dummy [x偏移] [y偏移]
  TP = '-tp', // 英雄瞬移到坐标：-tp <x> <y>；坐标可从 -watch 的 start 行读
  GIVE = '-give', // 服务端直接给英雄发物品，不依赖客户端处理：-give <物品名>
  HURT = '-hurt', // 最近刷的假人对英雄造成纯粹伤害，模拟敌方英雄攻击：-hurt [伤害]
}
