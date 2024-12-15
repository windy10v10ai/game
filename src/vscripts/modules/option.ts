import { GameOptions } from '../../common/net_tables';

export class Option {
  constructor() {
    CustomGameEventManager.RegisterListener('game_options_change', (_, keys) => {
      return this.onGameOptionChange(keys);
    });
  }

  onGameOptionChange(keys: GameOptions & CustomGameEventDataBase) {
    CustomNetTables.SetTableValue('game_options', 'game_options', keys);
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
