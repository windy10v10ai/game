// 中立物品配置接口（与 game/scripts/npc/neutral_items.txt 同步）
export interface NeutralItemConfig {
  name: string; // 物品名称
  level: number; // 物品等级（中立强化为 KV 中右侧数值）
  weight?: number; // 权重(用于概率计算，默认为1)
}

// 与 KV enhancements 下 global / 四属性池 一致
export interface NeutralTierEnhancementPools {
  global: NeutralItemConfig[];
  strength: NeutralItemConfig[];
  agility: NeutralItemConfig[];
  intelligence: NeutralItemConfig[];
  universal: NeutralItemConfig[];
}

// 中立物品 tier 配置
export interface NeutralTierConfig {
  items: NeutralItemConfig[]; // 主动中立物品
  enhancements: NeutralTierEnhancementPools;
}

// 中立物品管理类
export class NeutralItemManager {
  // 获取各tier开始时间
  private static GetTierStartTimes(): number[] {
    const baseTimeMin = [0, 6, 12, 18, 24];
    const multiplier = GameRules.Option.direGoldXpMultiplier;

    let addTimeMin = [0, 0, 0, 0, 0];
    // 根据multiplier计算tier开始时间
    if (multiplier >= 20) {
      // 立刻获取中立物品
      addTimeMin = [0, 0, 0, 0, 0];
    } else if (multiplier >= 10) {
      //延后1分钟
      addTimeMin = [1, 1, 1, 1, 2];
    } else if (multiplier >= 8) {
      //延后2分钟
      addTimeMin = [2, 2, 2, 3, 4];
    } else if (multiplier >= 6) {
      //延后3分钟
      addTimeMin = [3, 3, 4, 5, 6];
    } else if (multiplier >= 4) {
      //延后4分钟
      addTimeMin = [4, 5, 6, 7, 9];
    } else {
      // 延后6分钟
      addTimeMin = [6, 7, 8, 9, 12];
    }

    const baseTime = baseTimeMin.map((time, index) => time * 60 + addTimeMin[index] * 60);
    return baseTime;
  }

  // 获取默认配置（与 neutral_items.txt neutral_tiers 一致）
  public static GetDefaultConfig(): Record<number, NeutralTierConfig> {
    return {
      1: {
        items: [
          { name: 'item_kobold_cup', level: 1 }, // 狗头人酒杯
          { name: 'item_chipped_vest', level: 1 }, // 碎裂背心
          { name: 'item_polliwog_charm', level: 1 }, // 蝌蚪护符
          { name: 'item_dormant_curio', level: 1 }, // 休眠珍品
          { name: 'item_duelist_gloves', level: 1 }, // 决斗家手套
          { name: 'item_weighted_dice', level: 1 }, // 加重骰子
          { name: 'item_ash_legion_shield', level: 1 }, // 余烬军团战盾
          { name: 'item_possessed_mask', level: 1 }, // 附魂面具
          { name: 'item_dagger_of_ristul', level: 1 }, // 瑞斯图尔的匕首
          { name: 'item_foragers_kit', level: 1 }, // 采菌套具
          { name: 'item_stonefeather_satchel', level: 1 }, // 石羽小包
          { name: 'item_safety_bubble', level: 1 }, // 安全泡泡
          { name: 'item_royal_jelly', level: 1 }, // 蜂王浆
          { name: 'item_arcane_ring', level: 1 }, // 奥术指环
        ],
        enhancements: {
          global: [
            { name: 'item_enhancement_quickened', level: 1 }, // 迅速 移速
            { name: 'item_enhancement_vital', level: 1 }, // 活力 生命恢复
            { name: 'item_enhancement_greedy', level: 1 }, // 贪婪 工资蓝量 -攻击
            { name: 'item_enhancement_wise', level: 1 }, // 睿智 每分钟经验
          ],
          strength: [
            { name: 'item_enhancement_brawny', level: 1 }, // 壮实 血量
            { name: 'item_enhancement_tough', level: 1 }, // 坚强 攻击
          ],
          agility: [
            { name: 'item_enhancement_alert', level: 1 }, // 警觉 攻速
            { name: 'item_enhancement_brawny', level: 1 }, // 壮实 血量
          ],
          intelligence: [
            { name: 'item_enhancement_mystical', level: 1 }, // 神秘 回蓝
            { name: 'item_enhancement_tough', level: 1 }, // 坚强 攻击
          ],
          universal: [
            { name: 'item_enhancement_alert', level: 1 }, // 警觉 攻速
            { name: 'item_enhancement_mystical', level: 1 }, // 神秘 回蓝
          ],
        },
      },
      2: {
        items: [
          { name: 'item_essence_ring', level: 1 }, // 精华指环
          { name: 'item_mana_draught', level: 1 }, // 魔力药水
          { name: 'item_poor_mans_shield', level: 1 }, // 穷鬼盾
          { name: 'item_searing_signet', level: 1 }, // 炽热纹章
          { name: 'item_defiant_shell', level: 1 }, // 不羁甲壳
          { name: 'item_crippling_crossbow', level: 1 }, // 致残之弩
          { name: 'item_medallion_of_courage', level: 1 }, // 勇气勋章
          { name: 'item_seeds_of_serenity', level: 1 }, // 宁静种籽
          { name: 'item_orb_of_destruction', level: 1 }, // 毁灭灵球
          { name: 'item_misericorde', level: 1 }, // 飞贼之刃
        ],
        enhancements: {
          global: [
            { name: 'item_enhancement_quickened', level: 2 }, // 迅速 移速
            { name: 'item_enhancement_greedy', level: 2 }, // 贪婪 工资蓝量 -攻击
            { name: 'item_enhancement_vital', level: 2 }, // 活力 生命恢复
            { name: 'item_enhancement_wise', level: 2 }, // 睿智 每分钟经验
            { name: 'item_enhancement_vast', level: 1 }, // 高远 攻击距离
            { name: 'item_enhancement_vampiric', level: 1 }, // 吸血鬼 双吸血
          ],
          strength: [
            { name: 'item_enhancement_brawny', level: 2 }, // 壮实 血量
            { name: 'item_enhancement_tough', level: 2 }, // 坚强 攻击
            { name: 'item_enhancement_crude', level: 1 }, // 粗暴 减速抗性攻击间隔 -智力
          ],
          agility: [
            { name: 'item_enhancement_alert', level: 2 }, // 警觉 攻速
            { name: 'item_enhancement_brawny', level: 2 }, // 壮实 血量
            { name: 'item_enhancement_nimble', level: 1 }, // 轻快 移速攻击力 -生命回复
          ],
          intelligence: [
            { name: 'item_enhancement_mystical', level: 2 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_tough', level: 2 }, // 坚强 攻击护甲
            { name: 'item_enhancement_keen_eyed', level: 1 }, // 犀利 施法距离回蓝 -最大魔法值
          ],
          universal: [
            { name: 'item_enhancement_alert', level: 2 }, // 警觉 攻速夜视
            { name: 'item_enhancement_mystical', level: 2 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_titanic', level: 1 }, // 巨神 基础攻击状态抗性 -攻击速度
          ],
        },
      },
      3: {
        items: [
          { name: 'item_serrated_shiv', level: 1 }, // 锯齿短刀
          { name: 'item_gunpowder_gauntlets', level: 1 }, // 火药手套
          { name: 'item_jidi_pollen_bag', level: 1 }, // 基迪花粉袋
          { name: 'item_unrelenting_eye', level: 1 }, // 不屈之眼
          { name: 'item_cloak_of_flames', level: 1 }, // 火焰斗篷
          { name: 'item_spellslinger', level: 1 }, // 咏咒之坠
          { name: 'item_stormcrafter', level: 1 }, // 风暴宝器
          { name: 'item_partisans_brand', level: 1 }, // 天游烙印
          { name: 'item_spider_legs', level: 1 }, // 网虫腿 原本是5级
          { name: 'item_trickster_cloak', level: 1 }, // 欺诈师斗篷
          { name: 'item_penta_edged_sword', level: 1 }, // 五锋长剑
          { name: 'item_gale_guard', level: 1 }, // 烈风护体
          { name: 'item_princes_knife', level: 1 }, // 亲王短刀
        ],
        enhancements: {
          global: [
            { name: 'item_enhancement_quickened', level: 3 }, // 迅速 移速
            { name: 'item_enhancement_greedy', level: 3 }, // 贪婪 工资蓝量 -攻击
            { name: 'item_enhancement_vast', level: 2 }, // 高远 攻击距离
            { name: 'item_enhancement_vampiric', level: 2 }, // 吸血鬼 双吸血
            { name: 'item_enhancement_evolved', level: 1 }, // 进化 主属性
            { name: 'item_enhancement_feverish', level: 1 }, // 狂热 冷却减少 蓝耗增加
          ],
          strength: [
            { name: 'item_enhancement_brawny', level: 3 }, // 壮实 血量
            { name: 'item_enhancement_tough', level: 3 }, // 坚强 攻击
            { name: 'item_enhancement_crude', level: 2 }, // 粗暴 减速抗性攻击间隔 -智力
          ],
          agility: [
            { name: 'item_enhancement_alert', level: 3 }, // 警觉 攻速
            { name: 'item_enhancement_brawny', level: 3 }, // 壮实 血量
            { name: 'item_enhancement_nimble', level: 2 }, // 轻快 移速攻击力 -生命回复
          ],
          intelligence: [
            { name: 'item_enhancement_mystical', level: 3 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_tough', level: 3 }, // 坚强 攻击护甲
            { name: 'item_enhancement_keen_eyed', level: 2 }, // 犀利 施法距离回蓝 -最大魔法值
          ],
          universal: [
            { name: 'item_enhancement_alert', level: 3 }, // 警觉 攻速夜视
            { name: 'item_enhancement_mystical', level: 3 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_titanic', level: 2 }, // 巨神 基础攻击状态抗性 -攻击速度
          ],
        },
      },
      4: {
        items: [
          { name: 'item_giant_maul', level: 1 }, // 巨人之槌
          { name: 'item_rattlecage', level: 1 }, // 回响之笼
          { name: 'item_idol_of_screeauk', level: 1 }, // 丝奎奥克神像
          { name: 'item_flayers_bota', level: 1 }, // 剥皮血囊
          { name: 'item_metamorphic_mandible', level: 1 }, // 变态上颚
          { name: 'item_dandelion_amulet', level: 1 }, // 蒲公英护符
          { name: 'item_prophets_pendulum', level: 1 }, // 先知灵摆
          { name: 'item_conjurers_catalyst', level: 1 }, // 咒术师触媒
          { name: 'item_panic_button', level: 1 }, // 神妙明灯 原本是5级
          { name: 'item_havoc_hammer', level: 1 }, // 浩劫巨锤
          { name: 'item_imp_claw', level: 1 }, // 力量法则碎片
          { name: 'item_seer_stone', level: 1 }, // 先哲之石
          { name: 'item_repair_kit', level: 1 }, // 维修器具
          { name: 'item_mirror_shield', level: 1 }, // 神镜盾
          { name: 'item_magnifying_monocle', level: 1 }, // 放大单片镜
        ],
        enhancements: {
          global: [
            { name: 'item_enhancement_quickened', level: 4 }, // 迅速 移速
            { name: 'item_enhancement_timeless', level: 1 }, // 永恒 负面时间技能增强
            { name: 'item_enhancement_vampiric', level: 3 }, // 吸血鬼 双吸血
            { name: 'item_enhancement_boundless', level: 1 }, // 无边 攻击距离施法距离
            { name: 'item_enhancement_evolved', level: 2 }, // 进化 主属性
            { name: 'item_enhancement_fierce', level: 1 }, // 凶猛
            { name: 'item_enhancement_dominant', level: 1 }, // 专横
            { name: 'item_enhancement_restorative', level: 1 }, // 滋补
            { name: 'item_enhancement_thick', level: 1 }, // 厚重
          ],
          strength: [
            { name: 'item_enhancement_brawny', level: 4 }, // 壮实 血量
            { name: 'item_enhancement_tough', level: 4 }, // 坚强 攻击护甲
            { name: 'item_enhancement_crude', level: 3 }, // 粗暴 减速抗性攻击间隔 -智力
          ],
          agility: [
            { name: 'item_enhancement_alert', level: 4 }, // 警觉 攻速夜视
            { name: 'item_enhancement_brawny', level: 4 }, // 壮实 血量
            { name: 'item_enhancement_nimble', level: 3 }, // 轻快 移速攻击力 -生命回复
          ],
          intelligence: [
            { name: 'item_enhancement_mystical', level: 4 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_tough', level: 4 }, // 坚强 攻击护甲
            { name: 'item_enhancement_keen_eyed', level: 3 }, // 犀利 施法距离回蓝 -最大魔法值
          ],
          universal: [
            { name: 'item_enhancement_alert', level: 4 }, // 警觉 攻速夜视
            { name: 'item_enhancement_mystical', level: 4 }, // 神秘 回蓝魔抗
            { name: 'item_enhancement_titanic', level: 3 }, // 巨神 基础攻击状态抗性 -攻击速度
          ],
        },
      },
      5: {
        items: [
          { name: 'item_desolator_2', level: 1 }, // 寂灭
          { name: 'item_fallen_sky', level: 1 }, // 天崩
          { name: 'item_demonicon', level: 1 }, // 死灵书
          { name: 'item_minotaur_horn', level: 1 }, // 恶牛角
          { name: 'item_riftshadow_prism', level: 1 }, // 影墟棱晶
          { name: 'item_dezun_bloodrite', level: 1 }, // 德尊血式
          { name: 'item_divine_regalia', level: 1 }, // 天赐华冠
          { name: 'item_harmonizer', level: 1 }, // 协和
          { name: 'item_heavy_blade', level: 1 }, // 行巫之祸
          { name: 'item_enchanters_bauble', level: 1 }, // 附魔师之椟
          { name: 'item_nemesis_curse', level: 1 }, // 天诛之咒
          { name: 'item_ceremonial_robe', level: 1 }, // 祭礼长袍
          { name: 'item_ballista', level: 1 }, // 弩炮
          { name: 'item_giants_ring', level: 1 }, // 巨人之戒
          { name: 'item_ex_machina', level: 1 }, // 机械之心
        ],
        enhancements: {
          global: [
            { name: 'item_enhancement_timeless', level: 2 }, // 永恒 负面时间技能增强
            { name: 'item_enhancement_evolved', level: 3 }, // 进化 主属性
            { name: 'item_enhancement_fleetfooted', level: 1 }, // 捷足 移速
            { name: 'item_enhancement_vampiric', level: 4 }, // 吸血鬼 双吸血
            { name: 'item_enhancement_titanic', level: 4 }, // 巨神 基础攻击状态抗性 -攻击速度
            { name: 'item_enhancement_crude', level: 4 }, // 粗暴 减速抗性攻击间隔 -智力
            { name: 'item_enhancement_boundless', level: 2 }, // 无边 攻击距离施法距离
            { name: 'item_enhancement_fierce', level: 2 }, // 凶猛
            { name: 'item_enhancement_dominant', level: 2 }, // 专横
            { name: 'item_enhancement_restorative', level: 2 }, // 滋补
            { name: 'item_enhancement_thick', level: 2 }, // 厚重
            { name: 'item_mysterious_hat', level: 2 }, // 仙灵饰品
            { name: 'item_spell_prism', level: 1 }, // 法术棱镜
            { name: 'item_paladin_sword', level: 1 }, // 骑士剑
          ],
          strength: [{ name: 'item_enhancement_hulking', level: 1 }], // 笨重
          agility: [{ name: 'item_enhancement_audacious', level: 1 }], // 冒险
          intelligence: [{ name: 'item_enhancement_feverish', level: 1 }], // 狂热
          universal: [{ name: 'item_enhancement_manic', level: 1 }], // 癫狂
        },
      },
    };
  }

  private static GetEnhancementPoolForHero(
    pools: NeutralTierEnhancementPools,
    hero: CDOTA_BaseNPC_Hero,
  ): NeutralItemConfig[] {
    const primary = hero.GetPrimaryAttribute();
    switch (primary) {
      case Attributes.STRENGTH:
        return pools.strength;
      case Attributes.AGILITY:
        return pools.agility;
      case Attributes.INTELLECT:
        return pools.intelligence;
      case Attributes.ALL:
        return pools.universal;
      default:
        return pools.universal;
    }
  }

  // 获取当前tier
  public static GetTargetTier(): number {
    const gameTime = GameRules.GetDOTATime(false, false);
    const startTimes = this.GetTierStartTimes();

    for (let i = startTimes.length - 1; i >= 0; i--) {
      if (gameTime > startTimes[i]) {
        return i + 1;
      }
    }
    return 0;
  }

  // 获取指定tier的物品名
  public static GetRandomTierItem(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
  ): NeutralItemConfig | undefined {
    const items = neutralItemConfig[tier]?.items || [];
    if (items.length === 0) return undefined;

    return this.SelectRandomItem(items);
  }

  // global 池 + 英雄主属性对应池，再加权随机
  public static GetRandomTierEnhancements(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
    hero: CDOTA_BaseNPC_Hero,
  ): NeutralItemConfig | undefined {
    const tierCfg = neutralItemConfig[tier];
    if (!tierCfg) return undefined;

    const pools = tierCfg.enhancements;
    const primaryPool = this.GetEnhancementPoolForHero(pools, hero);
    const combined = [...pools.global, ...primaryPool];
    if (combined.length === 0) return undefined;

    return this.SelectRandomItem(combined);
  }

  // 根据权重随机选择物品
  public static SelectRandomItem(items: NeutralItemConfig[]): NeutralItemConfig | undefined {
    if (items.length === 0) return undefined;

    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = RandomFloat(0, totalWeight);

    for (const item of items) {
      random -= item.weight || 1;
      if (random <= 0) {
        return item;
      }
    }

    return items[0];
  }
}
