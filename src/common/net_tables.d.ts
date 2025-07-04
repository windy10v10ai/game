import { MemberDto, PlayerDto, PointInfoDto } from '../vscripts/api/player';
import { LotteryDto } from './dto/lottery';
import { LotteryStatusDto } from './dto/lottery-status';

declare global {
  interface CustomNetTableDeclarations {
    difficulty_choice: {
      [playerId: string]: { difficulty: number };
    };
    game_options: {
      game_options: GameOptions;
      point_multiplier: {
        point_multiplier: number;
      };
    };
    game_difficulty: {
      all: { difficulty: number };
    };
    player_stats: {
      [playerId: string]: {
        damage: number;
        damagereceived: number;
        healing: number;
        points: number;
        str: number;
        agi: number;
        int: number;
        towerKills: number;
      };
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
    ranking_table: {
      topSteamIds: string[];
      rankScores: {
        top1000: number;
        top2000: number;
        top3000: number;
        top4000: number;
        top5000: number;
      };
    };
    point_info: {
      [steamAccountID: string]: PointInfoDto[];
    };
    lottery_active_abilities: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_passive_abilities: {
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
  player_number_radiant: number;
  player_number_dire: number;
  tower_power_pct: number;
  respawn_time_pct: number;
  starting_gold_player: number;
  starting_gold_bot: number;
  max_level: number;
  same_hero_selection: number;
  enable_player_attribute: number;
}
