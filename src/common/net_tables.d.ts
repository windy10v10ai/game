import { PlayerInfoDto, PointInfoDto } from '../vscripts/api/player';
import { LotteryDto } from './dto/lottery';
import { ItemLotteryDto } from './dto/lottery-item';
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
        heroDamage: number;
        damagereceived: number;
        healing: number;
        points: number;
        pointModifier: number;
        conductPoint: number;
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
    player_table: {
      [steamAccountID: string]: PlayerInfoDto;
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
    lottery_passive_abilities_2: {
      [steamAccountID: string]: LotteryDto[];
    };
    lottery_status: {
      [steamAccountID: string]: LotteryStatusDto;
    };
    // 物品抽奖（藏宝箱触发，瞬时事件，key = playerId）
    item_lottery: {
      [playerId: string]: ItemLotteryDto;
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
        passiveAbilityName1: string; // Bot 的第一个被动技能名称
        passiveAbilityName2: string; // Bot 的第二个被动技能名称
      };
    };
    alipay_order: {
      [steamAccountID: string]: AlipayOrderState;
    };
  }
}

export type AlipayOrderStatus =
  | 'IDLE'
  | 'CREATING'
  | 'WAITING'
  | 'SUCCESS'
  | 'CLOSED'
  | 'FAILED'
  | 'ERROR'
  | 'RATE_LIMITED';

export interface AlipayOrderState {
  status: AlipayOrderStatus;
  outTradeNo?: string;
  qrCode?: string;
  totalAmount?: string;
  subject?: string;
  expiresAt?: string;
  errorMessage?: string;
  updatedAt: number;
  clientEpoch: number; // 客户端为本次订阅生成的递增编号；前端用它过滤旧订单残留
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
  mid_only_mode: number;
}
