import { Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { BotPower } from '../helper/bot-power';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class EventPlayerLevelUp {
  constructor() {
    ListenToGameEvent('dota_player_gained_level', (keys) => this.OnPlayerLevelUp(keys), this);
  }

  OnPlayerLevelUp(keys: GameEventProvidedProperties & DotaPlayerGainedLevelEvent): void {
    const hero = EntIndexToHScript(keys.hero_entindex) as CDOTA_BaseNPC_Hero | undefined;
    if (!hero) {
      print(`[Event] ERROR: OnPlayerLevelUp hero is undefined`);
      return;
    }

    if (PlayerHelper.IsHumanPlayer(hero)) {
      // 更新玩家属性
      print(`[Event] OnPlayerLevelUp SetPlayerProperty ${hero.GetUnitName()}`);
      Player.SetPlayerProperty(hero);
    }
    if (PlayerHelper.IsBotPlayer(hero)) {
      BotPower.LevelUpBotPower(hero);
    }
  }
}
