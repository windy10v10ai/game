import { Analytic } from '../../api/analytics/analytics';
import { reloadable } from '../../utils/tstl-utils';
import { GameConfig } from '../GameConfig';
import { NetTableHelper } from '../helper/net-table-helper';
import { PlayerHelper } from '../helper/player-helper';
import { abilityTiersActive, abilityTiersPassive } from './lottery-abilities';
import { LotteryHelper } from './lottery-helper';

@reloadable
export class Lottery {
  readonly randomCountBase = 4;

  constructor() {
    // 启动物品抽奖
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          // 延迟等待英雄加载（为了排除相同英雄的技能）
          Timers.CreateTimer(2, () => {
            this.initLotteryAll();
          });
        }
      },
      undefined,
    );

    // 玩家选择技能
    CustomGameEventManager.RegisterListener('lottery_pick_ability', (userId, event) => {
      this.pickAbility(userId, event);
    });
    // 玩家刷新技能
    CustomGameEventManager.RegisterListener('lottery_refresh_ability', (userId, event) => {
      this.refreshAbility(userId, event);
    });
  }

  initLotteryAll() {
    print('initLotteryAll');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.initLottery(playerId);
    });
  }

  initLottery(playerId: PlayerID) {
    this.randomAbilityForPlayer(playerId, true);
    this.randomAbilityForPlayer(playerId, false);

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
      },
    );
  }

  // ---- 随机技能 ----
  randomAbilityForPlayer(playerId: PlayerID, isActive: boolean) {
    const abilityTable = isActive ? 'lottery_active_abilities' : 'lottery_passive_abilities';
    const abilityTiers = isActive ? abilityTiersActive : abilityTiersPassive;
    // 排除刷新前抽取的
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue(abilityTable, steamAccountID);
    const executedNames = !!lotteryAbilitiesRaw
      ? Object.values(lotteryAbilitiesRaw).map((item) => item.name)
      : [];

    // 随机技能
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(
      abilityTiers,
      this.randomCountBase,
      hero,
      executedNames,
    );

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
  }

  // ---- 选择 ----
  pickAbility(userId: EntityIndex, event: LotteryPickEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const abilityType = event.type;
    if (lotteryStatus.activeAbilityName && abilityType === 'abilityActive') {
      print('已经抽取过主动技能');
      return;
    }
    if (lotteryStatus.passiveAbilityName && abilityType === 'abilityPassive') {
      print('已经抽取过被动技能');
      return;
    }

    // 添加技能
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) {
      return;
    }
    hero.AddAbility(event.name);

    // 记录选择的技能
    if (abilityType === 'abilityActive') {
      lotteryStatus.activeAbilityName = event.name;
      lotteryStatus.activeAbilityLevel = event.level;
    } else {
      lotteryStatus.passiveAbilityName = event.name;
      lotteryStatus.passiveAbilityLevel = event.level;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    // 发送分析事件
    Analytic.SendPickAbilityEvent({
      steamId: PlayerResource.GetSteamAccountID(event.PlayerID),
      matchId: GameRules.Script_GetMatchID().toString(),
      name: event.name,
      type: abilityType,
      level: event.level,
      difficulty: GameRules.Option.gameDifficulty,
      version: GameConfig.GAME_VERSION,
    });
  }

  // ---- 刷新 ----
  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (event.type !== 'abilityActive' && event.type !== 'abilityPassive') {
      print('刷新技能类型错误');
      return;
    }
    if (event.type === 'abilityActive') {
      if (lotteryStatus.isActiveAbilityRefreshed || lotteryStatus.activeAbilityName) {
        print('已经刷新/抽取过主动技能');
        return;
      }
    }
    if (event.type === 'abilityPassive') {
      if (lotteryStatus.isPassiveAbilityRefreshed || lotteryStatus.passiveAbilityName) {
        print('已经刷新/抽取过被动技能');
        return;
      }
    }

    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新物品');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID, event.type === 'abilityActive');

    // 记录刷新状态
    if (event.type === 'abilityActive') {
      lotteryStatus.isActiveAbilityRefreshed = true;
    } else {
      lotteryStatus.isPassiveAbilityRefreshed = true;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }
}
