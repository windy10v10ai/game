import { LotteryDto } from '../../../common/dto/lottery';
import { PlayerHelper } from '../../helper/player-helper';
import { reloadable } from '../../utils/tstl-utils';

interface Tier {
  rate: number;
  names: string[];
}

@reloadable
export class Lottery {
  constructor() {
    // 启动物品抽奖
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          // TODO remove this
          // wait 1 second before starting the item lottery
          Timers.CreateTimer({
            endTime: 1,
            callback: () => {
              this.StartItemLottery();
            },
          });
        }
      },
      undefined,
    );

    // 玩家选择物品
    CustomGameEventManager.RegisterListener('lottery_pick_item', (userId, event) => {
      this.pickItem(userId, event);
    });
    // 玩家刷新物品
    CustomGameEventManager.RegisterListener('lottery_refresh_item', (userId, event) => {
      this.refreshItem(userId, event);
    });

    this.itemTier.sort((a, b) => {
      return b.rate - a.rate;
    });
  }

  StartItemLottery() {
    print('StartItemLottery');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.RandomItemForPlayer(playerId);
    });
  }

  readonly normalItemCount = 3;
  readonly memberItemCount = 1;
  /**
   * 物品抽选概率，Tier 1-5
   */
  readonly itemTier: Tier[] = [
    {
      rate: 100,
      names: [
        'item_bottle', // 魔瓶
        'item_bracer', // 护腕
        'item_wraith_band', // 系带
        'item_null_talisman', // 挂件
        'item_infused_raindrop', // 凝魂之露

        // ---- 中立物品 lv1 ----
        'item_chipped_vest', // 碎裂背心
        'item_ironwood_tree', // 铁树之木
        'item_iron_talon', // 打野爪
        'item_keen_optic', // 基恩镜片
        'item_possessed_mask', // 附魂面具
        'item_ring_of_aquila', // 天鹰戒
        'item_poor_mans_shield', // 穷鬼盾
        'item_broom_handle', // 扫帚柄
      ],
    },
    {
      rate: 40,
      names: [
        'item_hand_of_midas', // 点金手
        'item_holy_locket', // 圣洁吊坠
        'item_aghanims_shard', // 阿哈利姆魔晶
        'item_great_famango', // 大疗伤莲花
        'item_tome_of_knowledge', // 知识之书

        // ---- 中立物品 lv2 ----
        'item_imp_claw', // 魔童之爪
        'item_vampire_fangs', // 吸血鬼獠牙
        'item_mysterious_hat', // 仙灵饰品
        'item_vambrace', // 臂甲
        'item_grove_bow', // 林野长弓
        'item_orb_of_destruction', // 毁灭灵球
        'item_philosophers_stone', // 贤者石
        'item_essence_ring', // 精华指环
      ],
    },
    {
      rate: 12,
      names: [
        // ---- 中立物品 lv3 ----
        'item_titan_sliver', // 巨神残铁
        'item_quickening_charm', // 加速护符
        'item_spider_legs', // 网虫腿
        'item_horizon', // 视界
        'item_witless_shako', // 无知小帽
        'item_third_eye', // 第三只眼
        'item_the_leveller', // 平世剑
        'item_paladin_sword', // 骑士剑
      ],
    },
    {
      rate: 2,
      names: [
        'item_light_part', // 圣光组件
        'item_dark_part', // 暗影组件

        // ---- 中立物品 lv4 ----
        'item_penta_edged_sword', // 五锋长剑
        'item_panic_button', // 神灯
        'item_minotaur_horn', // 恶牛角
        'item_spell_prism', // 法术棱镜
        'item_helm_of_the_undying', // 不死头盔
        'item_woodland_striders', // 丛林鞋
        'item_princes_knife', // 亲王短刀
        'item_repair_kit', // 维修器具
      ],
    },
    {
      rate: 0.5,
      names: [
        'item_tome_of_agility', // 敏捷之书
        'item_tome_of_intelligence', // 智力之书
        'item_tome_of_strength', // 力量之书

        // ---- 中立物品 lv5 ----
        'item_fallen_sky', // 天崩
        'item_desolator_2', // 寂灭
        'item_mirror_shield', // 神镜盾
        'item_ballista', // 弩炮
        'item_seer_stone', // 先哲石
        'item_ex_machina', // 机械之心
        'item_pirate_hat', // 海盗帽
      ],
    },
  ];

  // 随机决定tier
  private getRandomTier(tiers: Tier[]): Tier {
    const draw = Math.random() * 100;
    // 获取level最高，draw小于rate的tier
    print(`Draw rate ${draw}`);

    for (const tier of tiers) {
      if (draw <= tier.rate) {
        return tier;
      }
    }
    return tiers[tiers.length - 1];
  }

  // 随机抽选一个name
  private getRandomName(tiers: Tier[]): string {
    const names = this.getRandomTier(tiers).names;
    return names[Math.floor(Math.random() * names.length)];
  }

  // 随机抽选count个name
  private getRandomNames(tiers: Tier[], count: number, defaultName: string): string[] {
    const names: string[] = [];
    const maxAttempts = 10; // 最大尝试次数，避免无限循环
    for (let i = 0; i < count; i++) {
      let name = defaultName; // 默认物品，不应该被抽到
      let attempts = 0;
      do {
        name = this.getRandomName(tiers);
        attempts++;
      } while (names.includes(name) && attempts < maxAttempts);
      names.push(name);
    }
    return names;
  }

  RandomItemForPlayer(playerId: PlayerID) {
    // 抽取3个普通物品和1个会员物品，如果有重复的，重新抽取
    const items = this.getRandomNames(
      this.itemTier,
      this.normalItemCount + this.memberItemCount,
      'item_branches',
    );
    const itemNamesNormal = items.slice(0, this.normalItemCount);
    const itemNamesMember = items.slice(this.normalItemCount);

    // 将抽选结果放到nettable lottery中
    const lotteryDto: LotteryDto = {
      itemNamesNormal,
      itemNamesMember,
      pickItemName: undefined,
    };
    print('RandomItemForPlayer');
    DeepPrintTable(lotteryDto);
    CustomNetTables.SetTableValue(
      'lottery',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      lotteryDto,
    );
  }

  pickItem(userId: EntityIndex, event: LotteryPickItemEventData) {
    print('Choose item');
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    const steamAccountId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const lotteryDto = CustomNetTables.GetTableValue(
      'lottery',
      steamAccountId.toString(),
    ) as LotteryDto;

    if (lotteryDto.pickItemName) {
      return;
    }

    // 添加物品
    hero.AddItemByName(event.item);
    lotteryDto.pickItemName = event.item;
    CustomNetTables.SetTableValue('lottery', steamAccountId.toString(), lotteryDto);
  }

  // 刷新物品
  refreshItem(userId: EntityIndex, event: LotteryRefreshItemEventData) {
    const steamAccountId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const lotteryDto = CustomNetTables.GetTableValue(
      'lottery',
      steamAccountId.toString(),
    ) as LotteryDto;

    if (lotteryDto.pickItemName) {
      return;
    }

    this.RandomItemForPlayer(event.PlayerID);
  }
}
