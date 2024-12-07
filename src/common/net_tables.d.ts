import { MemberDto, PlayerDto, PointInfoDto } from '../vscripts/api/player';
import { LotteryDto } from './dto/lottery';
import { LotteryStatusDto } from './dto/lottery-status';

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
    lottery_items: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_abilities: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_status: {
      [steamAccountID: string]: LotteryStatusDto;
    };
  }
}
