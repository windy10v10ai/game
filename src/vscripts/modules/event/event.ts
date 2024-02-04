import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";
import { PropertyController } from "../property/property_controller";
import { EventOnNpcSpawned } from "./event-on-npc-spawned";

export class Event {
  EventOnNpcSpawned: EventOnNpcSpawned;
  constructor() {
    this.EventOnNpcSpawned = new EventOnNpcSpawned();
    ListenToGameEvent("dota_player_gained_level", (keys) => this.OnPlayerLevelUp(keys), this);
    ListenToGameEvent("npc_spawned", (keys) => this.EventOnNpcSpawned.OnNpcSpawned(keys), this);
    ListenToGameEvent("game_rules_state_change", () => this.OnGameStateChanged(), this);
  }

  OnPlayerLevelUp(keys: GameEventProvidedProperties & DotaPlayerGainedLevelEvent): void {
    const hero = EntIndexToHScript(keys.hero_entindex) as CDOTA_BaseNPC_Hero | undefined;
    if (!hero) {
      print(`[Event] ERROR: OnPlayerLevelUp hero is undefined`);
      return;
    }

    // 更新玩家属性
    if (PlayerHelper.IsHumanPlayer(hero)) {
      if (keys.level % PropertyController.HERO_LEVEL_PER_POINT === 0) {
        print(`[Event] OnPlayerLevelUp SetPlayerProperty ${hero.GetUnitName()}`);
        Player.SetPlayerProperty(hero);
      }
    }
  }

  OnGameStateChanged(): void {
    const state = GameRules.State_Get();
    if (state === GameState.GAME_IN_PROGRESS) {
    }
  }
}
