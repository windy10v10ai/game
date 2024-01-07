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
      if (keys.level % PropertyController.HERO_LEVEL_PER_POINT === 0) {
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

    // 英雄出生
    if (npc.IsRealHero() && keys.is_respawn === 0) {
      // set npc as CDOTA_BaseNPC_Hero
      const hero = npc as CDOTA_BaseNPC_Hero;

      if (Helper.IsHumanPlayer(hero)) {
        Player.SetPlayerProperty(hero);
      } else {
        // 机器人
        // FIXME 对所有机器人设置AI
        if (npc.GetTeamNumber() === DotaTeam.BADGUYS) {
          GameRules.AI.EnableAI(hero);
        }
      }
    }
  }
}
