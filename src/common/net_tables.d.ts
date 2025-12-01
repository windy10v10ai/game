import { MemberDto, PlayerDto, PointInfoDto } from '../vscripts/api/player';
import { HomeStatusDto } from './dto/home-status';
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
        steamId: string;
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
      ending_data: { winner_team_id: number };
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
    home_status: {
      [steamAccountID: string]: HomeStatusDto;
    };
    lottery_active_abilities: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_passive_abilities: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_passive_abilities_2: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_status: {
      [steamAccountID: string]: LotteryStatusDto;
    };
    // 添加虚拟金币表定义
    player_virtual_gold: {
      [playerID: string]: {
        virtual_gold: number;
        transferred_back_total: number; // 从虚拟金币库转回的总金额
      };
    };
    // Bot 被动技能表
    bot_passive_abilities: {
      [playerID: string]: {
        abilityName: string; // Bot 的被动技能名称
      };
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
  force_random_hero: number;
  enable_player_attribute: number;
}
