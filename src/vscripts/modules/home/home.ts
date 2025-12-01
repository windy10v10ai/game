import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class Home {
  constructor() {
    // 监听游戏状态变化
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          // 延迟等待英雄加载
          Timers.CreateTimer(2, () => {
            this.initHomeAll();
          });
        }
      },
      undefined,
    );

    // 注册自定义事件监听器
    // CustomGameEventManager.RegisterListener('home_example_event', (userId, event) => {
    //   this.handleExampleEvent(userId, event);
    // });
  }

  /**
   * 为所有玩家初始化 Home
   */
  initHomeAll() {
    print('initHomeAll');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.initHome(playerId);
    });
  }

  /**
   * 为单个玩家初始化 Home
   */
  initHome(playerId: PlayerID) {
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();

    // 初始化 Home 状态数据
    CustomNetTables.SetTableValue('home_status', steamAccountID, {
      // 在这里添加初始状态数据
      initialized: true,
    });

    print(`Home initialized for player ${playerId} (${steamAccountID})`);
  }

  /**
   * 示例事件处理方法
   */
  // handleExampleEvent(userId: EntityIndex, event: HomeExampleEventData & CustomGameEventDataBase) {
  //   const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
  //   print(`Home event received from player ${event.PlayerID}`);
  //
  //   // 在这里处理事件逻辑
  // }
}
