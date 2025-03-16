export class PlayerLanguageDto {
  steamId: number;
  language: string;
}

export class PlayerLanguageListDto {
  matchId: string;
  version: string;
  players: PlayerLanguageDto[];
}
