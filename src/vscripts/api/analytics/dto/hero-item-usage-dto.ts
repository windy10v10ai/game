export interface ItemUsageDto {
  itemName: string;
  durationSec: number;
}

export interface HeroItemUsageDto {
  customMatchId: string;
  version: string;
  difficulty: number;
  dotaTimeMsec: number;
  playerCount: number;
  playerId: PlayerID;
  steamId: number;
  heroName: string;
  teamId: number;
  isWin: boolean;
  items: ItemUsageDto[];
}
