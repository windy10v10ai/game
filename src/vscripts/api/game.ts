import { ApiClient, HttpMethod } from "./api_client";

class Player {
  teamId!: number;
  steamAccountID!: number;
  steamId!: number;
  heroName!: string;
  points!: number;
  isDisconnect!: boolean;
}

class GameInfo {
  players!: Player[];
  winnerTeamId!: number;
  matchId!: string;
  gameOption!: object;
  version!: string;
  constructor() {
    print("[Game] constructor in TS");
    this.players = [];
  }
}

class EndGameInfo {
  winnerTeamId!: number;
  players!: Player[];
  gameOption!: object;
  constructor() {
    this.players = [];
  }
}

export class Game {
  private static VERSION = "v3.12";
  constructor() {}

  public SendEndGameInfo(endData: EndGameInfo) {
    if (
      GetDedicatedServerKeyV2(ApiClient.SERVER_KEY) === ApiClient.LOCAL_APIKEY &&
      !IsInToolsMode()
    ) {
      return;
    }

    CustomNetTables.SetTableValue("ending_status", "ending_status", {
      status: 1,
    });

    const gameInfo = new GameInfo();
    gameInfo.winnerTeamId = endData.winnerTeamId;
    gameInfo.matchId = GameRules.Script_GetMatchID().toString();
    gameInfo.version = Game.VERSION;
    gameInfo.gameOption = endData.gameOption;

    DeepPrintTable(endData);

    for (let i = -1; i < endData.players.length; i++) {
      const player = endData.players[i];
      if (player == null) {
        continue;
      }
      const newPlayer = new Player();
      newPlayer.teamId = player.teamId;
      newPlayer.steamId = player.steamAccountID;
      newPlayer.heroName = player.heroName;
      newPlayer.points = player.points;
      newPlayer.isDisconnect = player.isDisconnect;
      gameInfo.players.push(newPlayer);
    }
    const apiParameter = {
      method: HttpMethod.POST,
      path: ApiClient.POST_GAME_URL,
      body: gameInfo,
      successFunc: (data: string) => {
        CustomNetTables.SetTableValue("ending_status", "ending_status", {
          status: 2,
        });
        print(`[Game] end game callback data ${data}`);
      },
      failureFunc: (data: string) => {
        CustomNetTables.SetTableValue("ending_status", "ending_status", {
          status: 3,
        });
        print(`[Game] end game callback data ${data}`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
