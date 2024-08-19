import { Player } from "../../api/player";
import { ModifierHelper } from "../../helper/modifier-helper";
import { HeroPick } from "../hero/hero-pick";

export class EventGameStateChange {
  constructor() {
    ListenToGameEvent("game_rules_state_change", () => this.OnGameStateChanged(), this);
  }

  OnGameStateChanged(): void {
    const state = GameRules.State_Get();
    if (state === GameState.CUSTOM_GAME_SETUP) {
      Timers.CreateTimer(1, () => {
        Player.LoadPlayerInfo();
      });
    } else if (state === GameState.GAME_IN_PROGRESS) {
      this.OnGameInProgress();
    } else if (state === GameState.HERO_SELECTION) {
      this.OnHeroSelection();
    } else if (state === GameState.STRATEGY_TIME) {
      this.OnStrategyTime();
    } else if (state === GameState.PRE_GAME) {
      this.OnPreGame();
    }
  }

  private OnGameInProgress(): void {}

  /**
   * 选择英雄时间
   */
  private OnHeroSelection(): void {}

  /**
   * 策略时间
   */
  private OnStrategyTime(): void {
    HeroPick.PickHumanHeroes();
    HeroPick.PickBotHeroes();
  }

  /**
   * 地图载入后，游戏开始前
   */
  private OnPreGame(): void {
    // 初始化游戏
    print(`[EventGameStateChange] OnPreGame`);

    // 防御塔BUFF
    const towers = Entities.FindAllByClassname("npc_dota_tower") as CDOTA_BaseNPC[];
    for (const tower of towers) {
      this.addModifierToTowers(tower);
    }
    // 兵营BUFF
    const barracks = Entities.FindAllByClassname("npc_dota_barracks") as CDOTA_BaseNPC[];
    for (const barrack of barracks) {
      this.addModifierToTowers(barrack);
    }
    const healer = Entities.FindAllByClassname("npc_dota_healer") as CDOTA_BaseNPC[];
    for (const heal of healer) {
      this.addModifierToTowers(heal);
    }

    // 基地BUFF
    const bases = Entities.FindAllByClassname("npc_dota_fort") as CDOTA_BaseNPC[];
    for (const base of bases) {
      this.addModifierToTowers(base);
    }
  }

  private addModifierToTowers(building: CDOTA_BaseNPC) {
    // 防御塔攻击
    let towerPower = GameRules.Option.towerPower;

    // 1塔最高200%攻击
    const towerName = building.GetName();
    if (towerName.includes("tower1")) {
      if (towerPower > 200) {
        towerPower = 200;
      }
    }
    ModifierHelper.appleTowerModifier(
      building,
      `modifier_tower_power`,
      this.getTowerLevel(towerPower),
    );

    // 防御塔血量
    const newHealth = Math.floor((towerPower / 100) * building.GetMaxHealth());
    building.SetMaxHealth(newHealth);
    building.SetBaseMaxHealth(newHealth);
    building.SetHealth(newHealth);
  }

  private getTowerLevel(percent: number): number {
    if (percent <= 100) {
      return 1;
    } else if (percent <= 150) {
      return 2;
    } else if (percent <= 200) {
      return 3;
    } else if (percent <= 250) {
      return 4;
    } else if (percent <= 300) {
      return 5;
    } else if (percent <= 400) {
      return 6;
    }
    return 1;
  }
}
