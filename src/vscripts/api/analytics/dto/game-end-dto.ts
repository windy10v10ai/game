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
  playerId: PlayerID;
  teamId: number;
  isDisconnected: boolean;
  level: number;
  gold: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  battlePoints: number;

  // 追加项目
  damage: number;
  damageTaken: number;
  lastHits: number;
  healing: number;
  towerKills: number;
  facetId: number;
}

export class GameEndDto extends EventBaseDto {
  gameOptions: GameEndGameOptionsDto;
  winnerTeamId: number;
  gameTimeMsec: number;
  players: GameEndPlayerDto[];
}
