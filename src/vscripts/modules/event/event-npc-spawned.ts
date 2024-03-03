import { Player } from "../../api/player";
import { ModifierHelper } from "../../helper/modifier-helper";
import { PlayerHelper } from "../../helper/player-helper";

export class EventNpcSpawned {
  private roshanLevelBase = 0;
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
    ListenToGameEvent("npc_spawned", (keys) => this.OnNpcSpawned(keys), this);
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
      const hero = npc as CDOTA_BaseNPC_Hero;
      this.OnRealHeroSpawned(hero);
    }
    if (npc.IsCreep()) {
      // 小兵出生
      this.OnCreepSpawned(npc);
    }
    if (npc.IsCourier() && keys.is_respawn === 0) {
      // 信使出生
      ModifierHelper.applyGlobalModifier(npc, "modifier_global_courier_speed");
    }
  }

  // 英雄出生
  private OnRealHeroSpawned(hero: CDOTA_BaseNPC_Hero): void {
    if (
      hero.GetAttackCapability() === UnitAttackCapability.MELEE_ATTACK ||
      hero.GetName() === "npc_dota_hero_troll_warlord" ||
      hero.GetName() === "npc_dota_hero_lone_druid"
    ) {
      ModifierHelper.applyGlobalModifier(hero, "modifier_global_melee_resistance");
    }

    if (PlayerHelper.IsHumanPlayer(hero)) {
      // 设置会员
      const steamAccountId = PlayerResource.GetSteamAccountID(hero.GetPlayerID());
      if (Player.IsMemberStatic(steamAccountId)) {
        ModifierHelper.applyGlobalModifier(hero, "modifier_global_member");
      }
      // 设置玩家属性
      Player.SetPlayerProperty(hero);
    } else {
      // 机器人
      GameRules.AI.EnableAI(hero);
    }
  }

  private OnCreepSpawned(creep: CDOTA_BaseNPC): void {
    const creepName = creep.GetName();

    if (creepName === "npc_dota_roshan") {
      for (const abilityName of this.roshanLevelupBaseAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        if (ability) {
          ability.SetLevel(this.roshanLevelBase);
        }
      }
      for (const abilityName of this.roshanLevelupExtraAbilities) {
        const ability = creep.FindAbilityByName(abilityName);
        const level = this.getExtraRoshanLevel();
        if (ability) {
          ability.SetLevel(level);
        }
      }

      if (this.roshanLevelBase < 5 - 1) {
        this.roshanLevelBase++;
      }
    }
  }

  private getExtraRoshanLevel(): number {
    let extra = 0;

    if (Player.GetPlayerCount() >= 2) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 4) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 6) {
      extra++;
    }
    if (Player.GetPlayerCount() >= 8) {
      extra++;
    }
    return this.roshanLevelBase + extra;
  }
}
