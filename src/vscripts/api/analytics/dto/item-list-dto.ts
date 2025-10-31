import { ItemBuildDto } from './item-build-dto';

export class ItemListDto {
  matchId: string;

  version: string;

  difficulty: number;

  isWin: boolean;

  items: ItemBuildDto[];
}
