import { PickDto } from './pick-ability-dto';

export class PickListDto {
  matchId: string;

  version: string;

  difficulty: number;

  isWin: boolean;

  picks: PickDto[];
}
