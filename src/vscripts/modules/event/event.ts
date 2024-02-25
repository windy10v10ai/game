import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";
import { PropertyController } from "../property/property_controller";
import { CustomEvent } from "./custom-event";
import { EventEntityKilled } from "./event-entity-killed";
import { EventNpcSpawned } from "./event-npc-spawned";
import { EventGameStateChange } from "./evnet-game-state-change";

export class Event {
  EventNpcSpawned: EventNpcSpawned;
  EventEntityKilled: EventEntityKilled;
  EventGameStateChange: EventGameStateChange;

  CustomEvent: CustomEvent;
  constructor() {
    this.EventNpcSpawned = new EventNpcSpawned();
    this.EventEntityKilled = new EventEntityKilled();
    this.EventGameStateChange = new EventGameStateChange();
    ListenToGameEvent("dota_player_gained_level", (keys) => this.OnPlayerLevelUp(keys), this);

    this.CustomEvent = new CustomEvent();
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
}
