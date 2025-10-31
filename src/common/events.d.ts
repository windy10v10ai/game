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
  same_hero_selection: number;
  enable_player_attribute: number;
  extra_passive_abilities: number;
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
    same_hero_selection: boolean;
    enable_player_attribute: boolean;
    extra_passive_abilities: boolean;
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

// 注意：Home 相关事件已注释，需要时取消注释
// interface HomeExampleEventData {
//   // 在这里添加事件数据字段
//   // 例如：
//   // action: string;
//   // value: number;
// }
