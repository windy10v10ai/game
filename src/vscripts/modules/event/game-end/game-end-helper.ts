import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';

@reloadable
export class GameEndHelper {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills) * 1.2;
    const deathScore = -Math.sqrt(player.deaths) * 0.5;
    const assistScore = Math.sqrt(player.assists) * 1.2;
    const damageScore = Math.min(40, Math.sqrt(player.damage) / 180);
    const damageTakenScore = Math.min(40, Math.sqrt(player.damageTaken) / 90);
    const healingScore = Math.min(40, Math.sqrt(player.healing) / 50);
    const towerKillScore = Math.sqrt(player.towerKills) * 3;

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
    const points = Math.sqrt(min) * 4;
    return Math.round(points);
  }
}
