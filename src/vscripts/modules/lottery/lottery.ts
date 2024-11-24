import { LotteryDto } from '../../../common/dto/lottery';
import { PlayerHelper } from '../../helper/player-helper';
import { reloadable } from '../../utils/tstl-utils';

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

    // 监听玩家选择物品
    CustomGameEventManager.RegisterListener('finish_item_pick', (userId, event) => {
      this.FinishItemPick(userId, event);
    });
  }

  StartItemLottery() {
    print('StartItemLottery');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.SpecialItemAdd(playerId);
    });
  }

  SpecialItemAdd(playerId: PlayerID) {
    const tierRate = [100, 40, 12, 2, 0.5];
    const tier: { [key: number]: string[] } = {};

    tier[1] = [
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
    ];

    tier[2] = [
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
    ];

    tier[3] = [
      // ---- 中立物品 lv3 ----
      'item_titan_sliver', // 巨神残铁
      'item_quickening_charm', // 加速护符
      'item_spider_legs', // 网虫腿
      'item_horizon', // 视界
      'item_witless_shako', // 无知小帽
      'item_third_eye', // 第三只眼
      'item_the_leveller', // 平世剑
      'item_paladin_sword', // 骑士剑
    ];

    tier[4] = [
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
    ];

    tier[5] = [
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
    ];

    let item_tier = 1;

    const spawnedItem: string[] = [];
    for (let i = 0; i < 4; i++) {
      let repeatedTime = 0;
      const draw = Math.random() * 100;
      for (let iTier = tierRate.length; iTier >= 1; iTier--) {
        if (draw < tierRate[iTier - 1]) {
          item_tier = iTier;
          break;
        }
      }
      print(`Draw rate ${draw} Tier ${item_tier}`);

      while (true) {
        let repeated_item = false;
        const potential_item = tier[item_tier][Math.floor(Math.random() * tier[item_tier].length)];

        // if (owner.HasItemInInventory(potential_item)) {
        //   repeated_item = true;
        // }

        for (const previous_item of spawnedItem) {
          if (previous_item === potential_item) {
            repeated_item = true;
          }
        }

        if (!repeated_item) {
          spawnedItem[i] = potential_item;
          break;
        }
        repeatedTime++;
        if (repeatedTime > 10) {
          break;
        }
      }
    }

    // 将抽选结果放到nettable lottery中
    const lotteryDto: LotteryDto = {
      itemNamesNormal: spawnedItem,
      itemNamesMember: [],
      pickItemName: undefined,
    };
    const steamIdString = PlayerResource.GetSteamID(playerId).toString();
    CustomNetTables.SetTableValue('lottery', steamIdString, lotteryDto);

    // present item choices to the player
    this.StartItemPick(playerId, spawnedItem);
  }

  StartItemPick(playerId: PlayerID, items: string[]) {
    if (PlayerResource.IsValidPlayer(playerId)) {
      CustomGameEventManager.Send_ServerToPlayer(
        PlayerResource.GetPlayer(playerId) as CDOTAPlayerController,
        'item_choice',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        items,
      );
    }
  }

  FinishItemPick(userId: EntityIndex, event: FinishItemPickEventData) {
    print('Choose item');
    print('userId', userId);
    DeepPrintTable(event);
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    DeepPrintTable(hero);
    print('event.item', event.item);

    if (!hero) {
      return;
    }
    hero.AddItemByName(event.item);
    // TODO 更新nettable
  }
}
