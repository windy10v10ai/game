import { ApiClient, HttpMethod } from './api-client';

class PlayerRanking {
  id: string; // YYYYMMDD
  // 排名玩家SteamId
  topSteamIds: string[];
  // 各分段分数
  rankScores: {
    top1000: number;
    top2000: number;
    top3000: number;
    top4000: number;
    top5000: number;
  };
}

export class Ranking {
  public static readonly PLAYER_RANKING_URL = '/player/ranking';
  public static LoadRankingInfo() {
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: Ranking.PLAYER_RANKING_URL,
      successFunc: Ranking.LoadRankingSuccess,
      failureFunc: Ranking.LoadRankingFailure,
      timeoutSeconds: 30,
    });
  }

  private static LoadRankingSuccess(data: string) {
    const playerRanking = json.decode(data)[0] as PlayerRanking;
    Ranking.SaveRankingToNetTable(playerRanking);
  }

  private static LoadRankingFailure(_: string) {
    print(`[Rank] LoadRanking failure`);
  }

  private static SaveRankingToNetTable(playerRanking: PlayerRanking) {
    CustomNetTables.SetTableValue('ranking_table', 'topSteamIds', playerRanking.topSteamIds);
    CustomNetTables.SetTableValue('ranking_table', 'rankScores', playerRanking.rankScores);
  }
}
