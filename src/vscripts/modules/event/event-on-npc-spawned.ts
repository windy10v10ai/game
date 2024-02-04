import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";

export class EventOnNpcSpawned {
  private roshanNumber = 1;
  constructor() {}

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
      print(`[EventOnNpcSpawned] OnCreepSpawned ${creepName}, roshanNumber: ${this.roshanNumber}`);
      const abilityRoshanBuff = creep.FindAbilityByName("roshan_buff");
      if (abilityRoshanBuff) {
        abilityRoshanBuff.SetLevel(this.roshanNumber);
      }
      const abilityGoldBag = creep.FindAbilityByName("generic_gold_bag_fountain");
      if (abilityGoldBag) {
        abilityGoldBag.SetLevel(this.roshanNumber);
      }

      if (this.roshanNumber < 5) {
        this.roshanNumber++;
      }
    }
  }
}
