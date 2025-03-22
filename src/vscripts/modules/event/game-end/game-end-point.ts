import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';

@reloadable
export class GameEndPoint {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills) * 1.3;
    const deathScore = -Math.sqrt(player.deaths) * 0.7;
    const assistScore = Math.sqrt(player.assists) * 1.5;
    const damageScore = Math.min(40, Math.sqrt(player.damage) / 200);
    const damageTakenScore = Math.min(40, Math.sqrt(player.damageTaken) / 100);
    const healingScore = Math.min(40, Math.sqrt(player.healing) / 50);
    const towerKillScore = Math.sqrt(player.towerKills) * 4;

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

  static IsPlayerAFK(player: GameEndPlayerDto, teamKills: number): boolean {
    // 如果玩家断开连接，直接判定为挂机
    if (player.isDisconnected) {
      return true;
    }

    if (teamKills <= 0) {
      return false;
    }

    // 计算总战斗参与次数（击杀+助攻）
    const totalEngagements = player.kills + player.assists;

    // 计算参战率
    const participationRate = totalEngagements / teamKills;

    // 如果参战率低于0.1（10%），判定为挂机
    return participationRate < 0.1;
  }

  static GetGameTimePoints(gameTime: number, isAFK: boolean): number {
    if (isAFK) {
      return 0;
    }
    const min = gameTime / 60;
    const points = Math.sqrt(min) * 3;
    return Math.round(points);
  }
}
