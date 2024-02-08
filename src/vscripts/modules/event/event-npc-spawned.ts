import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";

export class EventNpcSpawned {
  private roshanLevelBase = 0;
  private roshanLevelExtra = 0;
  // abiliti name list of roshan
  private roshanLevelupBaseAbilities = [
    "tidehunter_kraken_shell",
    "jack_surgery",
    "ursa_fury_swipes",
  ];

  private roshanLevelupExtraAbilities = [
    "roshan_buff",
    "generic_gold_bag_fountain",
    "generic_season_point_bag_fountain",
  ];

  constructor() {
    // 0: 1-2, 1: 3-5, 2: 6-10
    if (Player.GetPlayerCount() > 2) {
      this.roshanLevelExtra++;
    }
    if (Player.GetPlayerCount() > 5) {
      this.roshanLevelExtra++;
    }
  }

  // 单位出生
  public OnNpcSpawned(keys: GameEventProvidedProperties & NpcSpawnedEvent): void {
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
      this.OnRealHeroSpawned(hero);
    } else if (npc.IsCreep()) {
      // 小兵出生
      this.OnCreepSpawned(npc);
    }
  }

  private OnRealHeroSpawned(hero: CDOTA_BaseNPC_Hero): void {
    if (PlayerHelper.IsHumanPlayer(hero)) {
      Player.SetPlayerProperty(hero);
    } else {
      // 机器人
      // FIXME 天辉机器人未设置新AI
      if (hero.GetTeamNumber() === DotaTeam.BADGUYS) {
        GameRules.AI.EnableAI(hero);
      }
    }
  }

  private OnCreepSpawned(creep: CDOTA_BaseNPC): void {
    const creepName = creep.GetName();

    if (creepName === "npc_dota_roshan") {
      print(
        `[EventOnNpcSpawned] OnCreepSpawned ${creepName}, roshanLevel: ${this.roshanLevelBase}`,
      );
      for (const abilityName of this.roshanLevelupBaseAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        if (ability) {
          ability.SetLevel(this.roshanLevelBase);
        }
      }
      for (const abilityName of this.roshanLevelupExtraAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        if (ability) {
          ability.SetLevel(this.roshanLevelBase + this.roshanLevelExtra);
        }
      }

      if (this.roshanLevelBase < 5) {
        this.roshanLevelBase++;
      }
    }
  }
}
