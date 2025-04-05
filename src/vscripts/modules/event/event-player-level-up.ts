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

    this.UpdatePlayerProperty(hero);
    this.SetDeathXP(hero, keys.level);
  }

  private UpdatePlayerProperty(hero: CDOTA_BaseNPC_Hero): void {
    if (PlayerHelper.IsHumanPlayer(hero)) {
      print(`[Event] OnPlayerLevelUp SetPlayerProperty ${hero.GetUnitName()}`);
      Player.SetPlayerProperty(hero);
    }
    if (PlayerHelper.IsBotPlayer(hero)) {
      BotPower.LevelUpBotPower(hero);
    }
  }

  private SetDeathXP(hero: CDOTA_BaseNPC_Hero, level: number): void {
    Timers.CreateTimer(0.5, () => {
      if (hero.IsNull()) {
        return;
      }
      if (level <= 30) {
        hero.SetCustomDeathXP(40 + hero.GetCurrentXP() * 0.08);
      } else {
        hero.SetCustomDeathXP(3000 + hero.GetCurrentXP() * 0.03);
      }
    });
  }
}
