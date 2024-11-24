import { MemberDto, PlayerDto, PointInfoDto } from '../vscripts/api/player';
import { LotteryDto } from './dto/lottery';

declare global {
  interface CustomNetTableDeclarations {
    loading_status: {
      loading_status: { status: number };
    };
    ending_status: {
      ending_status: { status: number };
    };
    member_table: {
      [steamAccountID: string]: MemberDto;
    };
    player_table: {
      [steamAccountID: string]: PlayerDto;
    };
    leader_board: {
      top100SteamIds: string[];
    };
    point_info: {
      [steamAccountID: string]: PointInfoDto[];
    };
    game_difficulty: {
      all: { difficulty: number };
    };
    lottery: {
      [steamAccountID: string]: LotteryDto;
    };
  }
}
