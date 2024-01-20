import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";
import { PropertyController } from "../property/property_controller";

export class Event {
  constructor() {
    ListenToGameEvent("dota_player_gained_level", (keys) => this.OnPlayerLevelUp(keys), this);
    ListenToGameEvent("npc_spawned", (keys) => this.OnNpcSpawned(keys), this);
    // game_rules_state_change
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

  // 单位出生
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

      if (PlayerHelper.IsHumanPlayer(hero)) {
        Player.SetPlayerProperty(hero);
      } else {
        // 机器人
        // FIXME 天辉机器人未设置新AI
        if (npc.GetTeamNumber() === DotaTeam.BADGUYS) {
          GameRules.AI.EnableAI(hero);
        }
      }
    }
  }

  OnGameStateChanged(): void {
    const state = GameRules.State_Get();
    if (state === GameState.GAME_IN_PROGRESS) {
    }
  }
}
