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
  game_options_change: GameOptionsChangeEventData;
  loading_set_options: LoadingSetOptionsEventData;
  ui_panel_closed: UIPanelClosedEventData;
  lottery_pick_item: LotteryPickEventData;
  lottery_pick_ability: LotteryPickEventData;
  lottery_refresh_item: LotteryRefreshEventData;
  lottery_refresh_ability: LotteryRefreshEventData;
}

interface CustomGameEventDataBase {
  PlayerID: PlayerID;
}

interface GameOptionsChangeEventData {
  key: string;
  value: string | number;
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
    same_hero_selection: boolean;
  };
}

// This event has no data
interface UIPanelClosedEventData {}

interface LotteryPickEventData {
  name: string;
}

interface LotteryRefreshEventData {}
