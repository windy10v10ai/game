import { EventBaseDto } from './event-base-dto';

export class GameEndGameOptionsDto {
  multiplierRadiant: number;
  multiplierDire: number;
  playerNumberRadiant: number;
  playerNumberDire: number;
  towerPowerPct: number;
}

export class GameEndPlayerDto {
  heroName: string;
  steamId: number;
  teamId: number;
  isDisconnected: boolean;
  level: number;
  gold: number;
  kills: number;
  deaths: number;
  assists: number;
  points: number;

  // 追加项目
  damage: number;
  damageTaken: number;
  lastHits: number;
  healing: number;
  towerKills: number;
}

export class GameEndDto extends EventBaseDto {
  gameOptions: GameEndGameOptionsDto;
  winnerTeamId: number;
  players: GameEndPlayerDto[];
}
