import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';

@reloadable
export class GameEndPoint {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills) * 1.5;
    const deathScore = -Math.sqrt(player.deaths) * 0.6;
    const assistScore = Math.sqrt(player.assists) * 1.5;
    const damageScore = Math.min(40, Math.sqrt(player.damage) / 200);
    const damageTakenScore = Math.min(40, Math.sqrt(player.damageTaken) / 100);
    const healingScore = Math.min(40, Math.sqrt(player.healing) / 50);
    const towerKillScore = Math.sqrt(player.towerKills) * 3.5;

    const totalScore =
      killScore +
      deathScore +
      assistScore +
      damageScore +
      damageTakenScore +
      healingScore +
      towerKillScore;

    return Math.round(totalScore);
  }

  static GetParticipationRateMultiplier(player: GameEndPlayerDto, teamKills: number): number {
    if (teamKills <= 0) {
      return 1;
    }

    // 计算总战斗参与次数（击杀+助攻）
    const totalEngagements = player.kills + player.assists;

    // 计算参战率
    const participationRate = totalEngagements / teamKills;

    // 如果参战率低于0.05（5%），获得0分
    if (participationRate < 0.05) {
      return 0;
    }
    // 参战率低于0.1（10%），获得一半时间分
    if (participationRate < 0.1) {
      return 0.5;
    }

    // 参战率高于0.1（10%），获得完整时间分
    return 1;
  }

  static GetGameTimePoints(gameTime: number): number {
    const min = gameTime / 60;
    const points = Math.sqrt(min) * 3;
    return Math.round(points);
  }
}
