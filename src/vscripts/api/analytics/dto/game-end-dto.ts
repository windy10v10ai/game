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

  /**
   * 结算界面那一行的属性、出装与抽选技能，只有真人玩家上报：机器人的没有消费方，
   * 填了只会撑大请求体。items 定长 6，下标即主物品栏槽位，空槽为空串。
   */
  strength?: number;
  agility?: number;
  intellect?: number;
  items?: string[];
  neutralItem?: string;
  neutralPassiveItem?: string;
  /** 顺序为主动、被动 1、被动 2 */
  abilities?: string[];

  /** 未完成任务时不发送；发送则四个字段必须齐全 */
  dailyTask?: DailyTaskResultDto;
}

export class GameEndDto extends EventBaseDto {
  gameOptions: GameEndGameOptionsDto;
  winnerTeamId: number;
  gameTimeMsec: number;
  countryCode: string;
  /** 全场真人数（不含机器人），后端据此做限额判断，每次结算必带 */
  playerCount: number;
  players: GameEndPlayerDto[];
}
