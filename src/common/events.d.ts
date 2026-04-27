/**
 * This file contains types for the events you want to send between the UI (Panorama)
 * and the server (VScripts).
 *
 * IMPORTANT:
 *
 * The dota engine will change the type of event data slightly when it is sent, so on the
 * Panorama side your event handlers will have to handle NetworkedData<EventType>, changes are:
 *   - Booleans are turned to 0 | 1
 *   - Arrays are automatically translated to objects when sending them as event. You have
 *     to change them back into arrays yourself! See 'toArray()' in src/panorama/hud.ts
 */

// To declare an event for use, add it to this table with the type of its data
interface CustomGameEventDeclarations {
  choose_difficulty: ChooseDifficultyEventData;
  game_options_change: GameOptionsChangeEventData;
  loading_set_options: LoadingSetOptionsEventData; // 仅在lua中使用，在js中使用game_options_change
  player_language: PlayerLanguageEventData;

  lottery_pick_ability: LotteryPickEventData;
  lottery_refresh_ability: LotteryRefreshEventData;
  save_bind_ability_key: SaveBindAbilityKeyEventData;
  lottery_reset_ability: LotteryRefreshEventData;

  // 跨 entry UI 事件（仅在客户端 SendEventClientSide 使用，不发送到服务器）
  hud_open_page: HudOpenPageEventData;
}

interface CustomGameEventDataBase {
  PlayerID: PlayerID;
}

interface ChooseDifficultyEventData {
  difficulty: number;
}

interface GameOptionsChangeEventData {
  multiplier_radiant: number;
  multiplier_dire: number;
  player_number_radiant: number;
  player_number_dire: number;
  tower_power_pct: number;
  respawn_time_pct: number;
  starting_gold_player: number;
  starting_gold_bot: number;
  max_level: number;
  fixed_ability: string;
  force_random_hero: number;
  enable_player_attribute: number;
  mid_only_mode: number;
}

interface LoadingSetOptionsEventData {
  host_privilege: boolean;
  game_options: {
    player_gold_xp_multiplier: string;
    bot_gold_xp_multiplier: string;
    radiant_player_number: string;
    dire_player_number: string;
    respawn_time_percentage: string;
    tower_power: string;
    starting_gold_player: string;
    starting_gold_bot: string;
    max_level: string;
    fixed_ability: string;
    force_random_hero: boolean;
    enable_player_attribute: boolean;
  };
}

interface PlayerLanguageEventData {
  language: string;
}

interface LotteryPickEventData {
  name: string;
  type: string;
  level: number;
}

interface LotteryRefreshEventData {
  type: string;
}

interface SaveBindAbilityKeyEventData {
  isRememberAbilityKey: boolean;
  activeAbilityKey: string;
  passiveAbilityKey: string;
  passiveAbilityKey2?: string;
  activeAbilityQuickCast: boolean;
  passiveAbilityQuickCast: boolean;
  passiveAbilityQuickCast2?: boolean;
}

// hud_main 路由可达的页面 ID。
// 新增页面时在此追加，并在 hud_main/router/routes.ts 中实现对应 Page 组件。
type HudPageId = 'profile' | 'shop' | 'leaderboard';

interface HudOpenPageEventData {
  page: HudPageId;
  // 可选页面参数，例如 profile 内的子 tab。Panorama 事件序列化要求扁平结构。
  param?: string;
}
