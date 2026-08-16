import { GameEndDto, GameEndPlayerDto } from '../dto/game-end-dto';
import { GA4 } from './ga4';

export class GA4DailyTaskTracker {
  /** 游戏结束时调用：仅对选择过每日任务的玩家发送选择/完成情况 */
  public static SendAtGameEnd(gameEndDto: GameEndDto): void {
    const eventName = 'game_end_daily_task';

    gameEndDto.players.forEach((player) => {
      const candidate = GameRules.DailyTask.GetSelectedCandidate(player.playerId);
      if (!candidate) return;

      const completed = this.IsCompleted(player);

      const event = GA4.BuildEvent(eventName, player.steamId, {
        steam_id: player.steamId,
        hero_name: player.heroName,
        difficulty: gameEndDto.difficulty,
        team_id: player.teamId,
        is_winner: player.teamId === gameEndDto.winnerTeamId,
        type: candidate.scope,
        tier: candidate.star,
        task_id: candidate.taskId,
        metric: candidate.metric,
        completed,
      });

      GA4.SendEvent(player.steamId, event);
    });
  }

  // 掉线玩家不结算每日任务，与 game-end.ts 的结算口径一致（spec 3.5）
  private static IsCompleted(player: GameEndPlayerDto): boolean {
    if (player.isDisconnected) return false;
    return GameRules.DailyTask.EvaluateCompletion(player.playerId) !== undefined;
  }
}
