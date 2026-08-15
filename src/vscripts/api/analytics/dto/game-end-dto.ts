import { DailyTaskResultDto } from '../../../../common/dto/daily-task';
import { EventBaseDto } from './event-base-dto';

export class GameEndGameOptionsDto {
  multiplierRadiant: number;
  multiplierDire: number;
  playerNumberRadiant: number;
  playerNumberDire: number;
  towerPowerPct: number;
  respawnTimePct: number;
}

export class GameEndPlayerDto {
  heroName: string;
  steamId: number;
  playerId: PlayerID;
  teamId: number;
  isDisconnected: boolean;
  level: number;
  totalGoldEarned: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  battlePoints: number;

  // 追加项目
  heroDamage: number;
  damageTaken: number;
  lastHits: number;
  healing: number;
  towerKills: number;
  stuns: number;
  roshanKills: number;

  /** 0=未觉醒 1=已觉醒。用数值而非布尔，为将来多阶觉醒等档位留扩展余地 */
  awaken: number;

  /** 未完成任务时不发送；发送则三个字段必须齐全 */
  dailyTask?: DailyTaskResultDto;
}

export class GameEndDto extends EventBaseDto {
  gameOptions: GameEndGameOptionsDto;
  winnerTeamId: number;
  gameTimeMsec: number;
  countryCode: string;
  players: GameEndPlayerDto[];
  /** 本局归属的任务日，取自 /game/start 响应 */
  dailyTaskDayId?: string;
}
