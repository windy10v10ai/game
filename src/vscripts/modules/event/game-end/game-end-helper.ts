import { GameEndPlayerDto } from '../../../api/analytics/dto/game-end-dto';
import { reloadable } from '../../../utils/tstl-utils';

@reloadable
export class GameEndHelper {
  static CalculatePlayerScore(player: GameEndPlayerDto): number {
    const killScore = Math.sqrt(player.kills);
    const deathScore = -Math.sqrt(player.deaths) / 2;
    const assistScore = Math.sqrt(player.assists);
    const damageScore = Math.sqrt(player.damage) / 100;
    const damageTakenScore = Math.sqrt(player.damageTaken) / 100;
    const healingScore = Math.sqrt(player.healing) / 50;
    const towerKillScore = player.towerKills;

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
    const points = Math.sqrt(min) * 5;
    return Math.round(points);
  }
}
