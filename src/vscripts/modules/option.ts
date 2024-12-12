import { GameOptions } from '../../common/net_tables';

export class Option {
  constructor() {
    // initial game_options table
    CustomNetTables.SetTableValue('game_options', 'difficulty', 0);
    CustomNetTables.SetTableValue('game_options', 'multiplier_radiant', 1);
    CustomNetTables.SetTableValue('game_options', 'multiplier_dire', 1);
    CustomNetTables.SetTableValue('game_options', 'tower_power_pct', 100);

    // 监听loading画面的设置

    CustomGameEventManager.RegisterListener('game_options_change', (_, keys) => {
      return this.onGameOptionChange(keys);
    });
  }

  onGameOptionChange(keys: GameOptionsChangeEventData) {
    CustomNetTables.SetTableValue('game_options', keys.key as keyof GameOptions, keys.value);
  }

  // 金钱经验倍率
  radiantGoldXpMultiplier = 1;
  direGoldXpMultiplier = 1;

  // 玩家数量
  radiantPlayerNumber = 10;
  direPlayerNumber = 10;

  towerPower = 100;
  startingGoldPlayer = 1000;
  startingGoldBot = 1000;
  respawnTimePercentage = 100;
  maxLevel = 50;
  sameHeroSelection = false;

  gameDifficulty = 0;
}
