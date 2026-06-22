import { AI } from '../ai/AI';
import { AlipayApi } from '../api/alipay';
import { GA4PlayerLanguageTracker } from '../api/analytics/ga4/ga4-player-language-tracker';
import { ConductApi } from '../api/conduct';
import { PlayerHeroAwakeningApi } from '../api/player-hero-awakening';
import { PlayerInfoApi } from '../api/player-info';
import { PlayerPropertyApi } from '../api/player-property';
import { PlayerGamePresetApi, PlayerSettingApi } from '../api/player-setting';
import { GameConfig } from './GameConfig';
import { VirtualGoldBank } from './bank/virtual-gold-bank';
import { Debug } from './debug/Debug';
import { HeroDebugPanel } from './debug-panel/hero-debug-panel';
import { Event } from './event/event';
import { GoldXPFilter } from './filter/gold-xp-filter';
import { Lottery } from './lottery/lottery';
import { Option } from './option';
import { PropertyController } from './property/property_controller';
import { Treasure } from './treasure/treasure';
import { WardSlot } from './ward-slot/ward-slot';

declare global {
  interface CDOTAGameRules {
    // 声明所有的GameRules模块，这个主要是为了方便其他地方的引用（保证单例模式）
    AI: AI;
    GameConfig: GameConfig;
    Option: Option;
    Lottery: Lottery;
    Event: Event;
    GoldXPFilter: GoldXPFilter;
    Treasure: Treasure;
    WardSlot: WardSlot;
  }
}

/**
 * 这个方法会在game_mode实体生成之后调用，且仅调用一次
 * 因此在这里作为单例模式使用
 **/
export function ActivateModules() {
  // 初始化所有的GameRules模块

  if (GameRules.GameConfig == null) {
    // 如果某个模块不需要在其他地方使用，那么直接在这里使用即可
    new Debug();

    // 英雄调试面板，内部自带 IsInToolsMode 守卫，正式环境不注册任何监听
    new HeroDebugPanel();

    new PropertyController();

    new VirtualGoldBank();

    // 玩家相关事件监听：property 升级/重置 + setting 保存 + player info 刷新
    new PlayerInfoApi();
    new PlayerPropertyApi();
    new PlayerSettingApi();
    new PlayerGamePresetApi();
    new PlayerHeroAwakeningApi();
    new AlipayApi();
    new ConductApi();

    // 玩家语言统计：监听 player_language 事件，收到即发 GA4 并缓存供 mid-only-mode 查询
    new GA4PlayerLanguageTracker();
  }

  if (GameRules.AI == null) GameRules.AI = new AI();

  if (GameRules.GameConfig == null) GameRules.GameConfig = new GameConfig();

  if (GameRules.Option == null) GameRules.Option = new Option();

  if (GameRules.Lottery == null) GameRules.Lottery = new Lottery();

  if (GameRules.Event == null) GameRules.Event = new Event();

  if (GameRules.GoldXPFilter == null) GameRules.GoldXPFilter = new GoldXPFilter();

  if (GameRules.Treasure == null) GameRules.Treasure = new Treasure();

  GameRules.WardSlot = new WardSlot();
}
