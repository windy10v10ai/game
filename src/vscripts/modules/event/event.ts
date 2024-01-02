import { Player } from "../../api/player";
import { Helper } from "../helper/helper";
import { PropertyController } from "../property/property_controller";

export class Event {
  constructor() {
    ListenToGameEvent("dota_player_gained_level", (keys) => this.OnPlayerLevelUp(keys), this);
    //  OnNPCSpawned
    ListenToGameEvent("npc_spawned", (keys) => this.OnNpcSpawned(keys), this);
  }

  OnPlayerLevelUp(keys: GameEventProvidedProperties & DotaPlayerGainedLevelEvent): void {
    const hero = EntIndexToHScript(keys.hero_entindex) as CDOTA_BaseNPC_Hero | undefined;

    // 更新玩家属性
    if (Helper.IsHumanPlayer(hero)) {
      if (keys.level % PropertyController.HERO_LEVEL_PER_POINT == 1) {
        print(`[Event] OnPlayerLevelUp SetPlayerProperty ${hero.GetUnitName()}`);
        Player.SetPlayerProperty(hero);
      }
    }
  }

  OnNpcSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
    if (GameRules.State_Get() < GameState.PRE_GAME) {
      Timers.CreateTimer(1, () => {
        this.OnNpcSpawned(keys);
      });
      return;
    }

    const npc = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC | undefined;
    if (!npc) {
      return;
    }

    if (keys.is_respawn == 0) {
      // is human player
      if (Helper.IsHumanPlayer(npc)) {
        print(`[Event] OnNpcSpawned SetPlayerProperty ${npc.GetUnitName()}`);
        Player.SetPlayerProperty(npc as CDOTA_BaseNPC_Hero);
      }
    }
  }
}
