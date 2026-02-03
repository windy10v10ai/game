import { PlayerHelper } from '../modules/helper/player-helper';
import { GA4ConfigDto } from './analytics/dto/ga4-dto';
import { GameEndDto } from './analytics/dto/game-end-dto';
import { GA4 } from './analytics/ga4';
import { ApiClient, HttpMethod } from './api-client';
import { MemberDto, Player, PlayerDto, PointInfoDto } from './player';

class GameStart {
  members!: MemberDto[];
  players!: PlayerDto[];
  pointInfo!: PointInfoDto[];
  ga4Config?: GA4ConfigDto; // Only present for official servers
}

export class Game {
  public static readonly GAME_START_URL = '/game/start';
  public static readonly GAME_END_URL = '/game/end';

  constructor() {}

  public static StartGame() {
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
      status: 1,
    });
    // get IsValidPlayer player's steamIds
    const steamIds: number[] = [];
    let playerCount = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      steamIds.push(steamId);
      playerCount++;
    });
    Player.playerCount = playerCount;

    const matchId = GameRules.Script_GetMatchID().toString();

    // 定义成功回调
    const onSuccess = (data: string) => {
      const gameStart = json.decode(data)[0] as GameStart;
      Player.memberList = gameStart.members;
      Player.playerList = gameStart.players;
      Player.pointInfoList = gameStart.pointInfo;

      // Initialize GA4 if config is provided (only for official servers)
      if (gameStart.ga4Config) {
        GA4.Initialize(gameStart.ga4Config);
        print(`[Game] GA4 initialized with measurementId: ${gameStart.ga4Config.measurementId}`);
      } else {
        print('[Game] GA4 config not provided (non-official server)');
      }

      // set member to member table
      Player.savePlayerToNetTable();
      Player.saveMemberToNetTable();
      Player.savePointInfoToNetTable();

      const status = Player.playerList.length > 0 ? 2 : 3;
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status,
      });
    };

    // 定义失败回调
    const onFailure = (_: string) => {
      if (IsInToolsMode()) {
        Player.saveMemberToNetTable();
      }
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status: 3,
      });
    };

    const apiParameter = {
      method: HttpMethod.GET,
      path: Game.GAME_START_URL,
      querys: { steamIds: steamIds.join(','), matchId },
      successFunc: onSuccess,
      failureFunc: onFailure,
      retryTimes: 6,
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  public static EndGame(gameEndDto: GameEndDto) {
    CustomNetTables.SetTableValue('ending_status', 'ending_status', {
      status: 1,
    });

    const apiParameter = {
      method: HttpMethod.POST,
      path: Game.GAME_END_URL,
      body: gameEndDto,
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
