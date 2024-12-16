import { MemberDto, PlayerDto, PointInfoDto } from '../vscripts/api/player';
import { LotteryDto } from './dto/lottery';
import { LotteryStatusDto } from './dto/lottery-status';

declare global {
  interface CustomNetTableDeclarations {
    game_options: {
      game_options: GameOptions;
    };
    game_difficulty: {
      all: { difficulty: number };
    };
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

export interface GameOptions {
  multiplier_radiant: number;
  multiplier_dire: number;
  tower_power_pct: number;

  // FIXME currently not used
  // radiant_player_number: string;
  // dire_player_number: string;
  // respawn_time_pct: string;
  // starting_gold_player: string;
  // starting_gold_bot: string;
  // max_level: string;
  // same_hero_selection: number;
}
