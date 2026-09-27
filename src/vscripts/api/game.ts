import { DailyTaskStartDto } from '../../common/dto/daily-task';
import { GameConfig } from '../modules/GameConfig';
import { PlayerHelper } from '../modules/helper/player-helper';
import { GameEndDto } from './analytics/dto/game-end-dto';
import { GA4ConfigDto } from './analytics/ga4/dto/ga4-dto';
import { GA4 } from './analytics/ga4/ga4';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto, PointInfoDto } from './player';
import { PlayerSnapshot } from './player-snapshot';

class GameStart {
  players!: PlayerInfoDto[];
  pointInfo!: PointInfoDto[];
  dailyTasks?: DailyTaskStartDto[]; // 每日任务候选
  ga4Config?: GA4ConfigDto; // Only present for official servers
}

export class Game {
  public static readonly GAME_START_URL = '/game/start';
  public static readonly GAME_END_URL = '/game/end';
  public static readonly LOCAL_GAME_END_URL = '/game/end/local';

  constructor() {}

  private static loadedSteamIds = new Set<number>();
  private static routeSelected = false;
  private static offline = false;

  public static StartGame() {
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
      status: 1,
    });
    // 自建专用服第一名玩家连入就进入设置阶段，其余玩家陆续连入，需要按人补拉
    ListenToGameEvent(
      'player_connect_full',
      () => Timers.CreateTimer(1, () => Game.LoadNewPlayers(false)),
      undefined,
    );
    ApiClient.SelectRoute(() => {
      Game.routeSelected = true;
      Game.LoadNewPlayers(true);
    });
  }

  private static LoadNewPlayers(isFirst: boolean) {
    // 选路完成前连入的玩家由首次拉取一并带上
    if (!Game.routeSelected) return;

    const steamIds: number[] = [];
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      if (steamId === 0 || Game.loadedSteamIds.has(steamId)) return;
      Game.loadedSteamIds.add(steamId);
      steamIds.push(steamId);
    });
    if (!isFirst && steamIds.length === 0) return;
    Player.playerCount = Game.loadedSteamIds.size;

    const matchId = GameRules.Script_GetMatchID().toString();

    // 定义成功回调
    const onSuccess = (data: string) => {
      const gameStart = json.decode(data)[0] as GameStart;

      // Initialize GA4 if config is provided (only for official servers)
      if (isFirst) {
        if (gameStart.ga4Config) {
          GA4.Initialize(gameStart.ga4Config);
          print(`[Game] GA4 initialized with measurementId: ${gameStart.ga4Config.measurementId}`);
        } else {
          print('[Game] GA4 config not provided (non-official server)');
        }
      }

      // 走 MergePlayerInfo 统一写入入口；首次 existing 为空，merge 等价覆盖
      for (const player of gameStart.players) {
        Player.MergePlayerInfo(player);
      }

      Game.PublishGamePresets();

      // pointInfo 仅在开局一次性下发到 net table，无需保留在 class 中
      const pointInfoBySteamId = new Map<number, PointInfoDto[]>();
      for (const info of gameStart.pointInfo) {
        const list = pointInfoBySteamId.get(info.steamId) ?? [];
        list.push(info);
        pointInfoBySteamId.set(info.steamId, list);
      }
      pointInfoBySteamId.forEach((list, steamId) => {
        CustomNetTables.SetTableValue('point_info', steamId.toString(), list);
      });

      // 按 steamId 匹配到 playerId 再转发，daily_task net table 按 playerId 存
      if (gameStart.dailyTasks) {
        PlayerHelper.ForEachPlayer((playerId) => {
          const steamId = PlayerResource.GetSteamAccountID(playerId);
          const dailyTaskDto = gameStart.dailyTasks!.find((dt) => dt.steamId === steamId);
          if (dailyTaskDto) {
            GameRules.DailyTask.SetStartData(playerId, dailyTaskDto);
          }
        });
      }

      if (!isFirst) return;
      const status = gameStart.players.length > 0 ? 2 : 3;
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status,
      });
    };

    // 定义失败回调
    const onFailure = (_: string) => {
      // 首次拉取已成功时不读快照，否则会用快照覆盖先到玩家的在线数据
      if (!isFirst && !Game.offline) {
        print(`[Game] load failed for late players: ${steamIds.join(',')}`);
        return;
      }
      Game.offline = true;
      const snapshotDate = PlayerSnapshot.Load();
      Game.PublishGamePresets();
      if (!isFirst) return;
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status: 3,
        snapshotDate,
      });
    };

    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: Game.GAME_START_URL,
      querys: { steamIds: steamIds.join(','), matchId, version: GameConfig.GAME_VERSION },
      successFunc: onSuccess,
      failureFunc: onFailure,
      timeoutSeconds: 15,
    });
  }

  /** 按 playerId 发布玩家存过的游戏预设，方便加载界面用 GetLocalPlayerID 读取 */
  private static PublishGamePresets() {
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      const setting = Player.playerInfoMap.get(steamId.toString())?.playerSetting;
      if (!setting) return;
      if (setting.gamePresetDota || setting.gamePresetHard || setting.gamePresetCustom) {
        CustomNetTables.SetTableValue('game_preset', playerId.toString(), {
          dota: setting.gamePresetDota,
          hard: setting.gamePresetHard,
          custom: setting.gamePresetCustom,
        });
      }
    });
  }

  public static EndGame(gameEndDto: GameEndDto) {
    CustomNetTables.SetTableValue('ending_status', 'ending_status', {
      status: 1,
    });

    const isLocalhost = ApiClient.IsLocalhost();
    const apiParameter = {
      method: HttpMethod.POST,
      path: isLocalhost ? Game.LOCAL_GAME_END_URL : Game.GAME_END_URL,
      body: gameEndDto,
      // 结算是累加写入。本地结算后端有冷却，已记上的那次会挡住重发；正式结算没有，重发会让积分与战绩翻倍
      retryTimes: isLocalhost ? 3 : 1,
      successFunc: (data: string) => {
        // CustomNetTables.SetTableValue('ending_status', 'ending_status', {
        //   status: 2,
        // });
        print(`[Game] end game callback data ${data}`);
      },
      failureFunc: (data: string) => {
        // CustomNetTables.SetTableValue('ending_status', 'ending_status', {
        //   status: 3,
        // });
        print(`[Game] end game callback data ${data}`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
