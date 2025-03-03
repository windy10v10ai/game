import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';

@reloadable
export class GameEndPoint {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills) * 1.2;
    const deathScore = -Math.sqrt(player.deaths) * 0.6;
    const assistScore = Math.sqrt(player.assists) * 1.2;
    const damageScore = Math.min(40, Math.sqrt(player.damage) / 200);
    const damageTakenScore = Math.min(40, Math.sqrt(player.damageTaken) / 100);
    const healingScore = Math.min(40, Math.sqrt(player.healing) / 50);
    const towerKillScore = Math.sqrt(player.towerKills) * 3.6;

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

  static GetGameTimePoints(gameTime: number): number {
    const min = gameTime / 60;
    const points = Math.sqrt(min) * 3.6;
    return Math.round(points);
  }
}
