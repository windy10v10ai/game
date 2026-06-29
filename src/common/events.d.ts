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
  save_game_preset: SaveGamePresetEventData;
  lottery_reset_ability: LotteryRefreshEventData;
  lottery_pick_item: LotteryPickItemEventData;
  lottery_refresh_item: Record<string, never>;
  lottery_pick_passive_tome: LotteryPickItemEventData;
  player_info_refresh: Record<string, never>;
  awaken_unlock_hero: AwakenUnlockHeroEventData;
  awaken_unlock_result: Record<string, never>;
  awaken_random_request: Record<string, never>;
  awaken_random_confirm: AwakenUnlockHeroEventData;

  alipay_order_create: AlipayOrderCreateEventData;
  alipay_order_query: AlipayOrderQueryEventData;
  alipay_order_clear: Record<string, never>;

  hud_open_page: HudOpenPageEventData;

  player_conduct: PlayerConductEventData;

  debug_panel_add_to_unit: DebugPanelAddToUnitEventData;
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

interface LotteryPickItemEventData {
  name: string;
  level: number;
}

interface AlipayOrderCreateEventData {
  productCode: string;
  quantity: number;
  clientEpoch: number;
}

interface AlipayOrderQueryEventData {
  outTradeNo: string;
}

interface HudOpenPageEventData {
  page: string;
  param?: string;
  playerId: PlayerID;
}

interface AwakenUnlockHeroEventData {
  heroName: string;
}

interface PlayerConductEventData {
  toPlayerId: PlayerID;
  type: string; // 'commend' | 'report'
}

// 调试面板「添加物品/技能」：对指定单位添加物品或技能。kind 预留 'modifier' 扩展。
interface DebugPanelAddToUnitEventData {
  entindex: number;
  kind: string; // 'item' | 'ability'
  name: string;
}


// 按地图记住/清除游戏预设的意图开关。仅传 remember，
// 服务端在 PRE_GAME 用已有数据（难度票 / GameRules.Option）按地图持久化。
interface SaveGamePresetEventData {
  mapName: string;
  remember: boolean;
}

interface SaveBindAbilityKeyEventData {
  isRememberAbilityKey: boolean;
  activeAbilityKey: string;
  passiveAbilityKey: string;
  passiveAbilityKey2?: string;
  activeAbilityQuickCast: boolean;
  passiveAbilityQuickCast: boolean;
  passiveAbilityQuickCast2?: boolean;
  wardObserverKey?: string;
  wardObserverQuickCast?: boolean;
  wardSentryKey?: string;
  wardSentryQuickCast?: boolean;
}

