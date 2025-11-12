import { GameEndDto } from './analytics/dto/game-end-dto';
import { ApiClient, HttpMethod } from './api-client';

export class Game {
  public static POST_GAME_END_URL = '/game/end';

  constructor() {}
  public static POST_SAVE_TEMP_POINTS_URL = '/game/saveTempPoints';

  public static PostSaveTempPoints(steamId: number, matchId: string, battlePoints: number) {
    const apiParameter = {
      method: HttpMethod.POST,
      path: this.POST_SAVE_TEMP_POINTS_URL,
      body: { steamId, matchId, battlePoints },
      successFunc: (data: string) => {
        print(`[Game] save temp points success: ${data}`);
      },
      failureFunc: (data: string) => {
        print(`[Game] save temp points failed: ${data}`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  public static PostEndGame(gameEndDto: GameEndDto) {
    CustomNetTables.SetTableValue('ending_status', 'ending_status', {
      status: 1,
    });

    const apiParameter = {
      method: HttpMethod.POST,
      path: this.POST_GAME_END_URL,
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
