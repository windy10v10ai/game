import { Player } from '../../api/player';
import { Ranking } from '../../api/ranking';
import { modifier_fort_think } from '../../modifiers/global/fort_think';
import { GameConfig } from '../GameConfig';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';
import { HeroPick } from '../hero/hero-pick';

export class EventGameStateChange {
  constructor() {
    ListenToGameEvent('game_rules_state_change', () => this.OnGameStateChanged(), this);
  }

  OnGameStateChanged(): void {
    const state = GameRules.State_Get();
    if (state === GameState.CUSTOM_GAME_SETUP) {
      Timers.CreateTimer(1, () => {
        // 加载开局信息
        Player.LoadPlayerInfo();
        // 设置玩家颜色
        this.setPlayerColor();
      });
      // 加载排行榜信息 略微延迟
      Timers.CreateTimer(10, () => {
        Ranking.LoadRankingInfo();
      });
    } else if (state === GameState.HERO_SELECTION) {
      this.OnHeroSelection();
    } else if (state === GameState.STRATEGY_TIME) {
      this.OnStrategyTime();
    } else if (state === GameState.PRE_GAME) {
      this.OnPreGame();
    } else if (state === GameState.GAME_IN_PROGRESS) {
      this.OnGameInProgress();
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
    GameConfig.SetMaxLevelXPRequire();
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
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    for (const tower of towers) {
      this.addModifierToTowers(tower);
    }
    // 兵营BUFF
    const barracks = Entities.FindAllByClassname('npc_dota_barracks') as CDOTA_BaseNPC[];
    for (const barrack of barracks) {
      this.addModifierToTowers(barrack);
    }
    const healer = Entities.FindAllByClassname('npc_dota_healer') as CDOTA_BaseNPC[];
    for (const heal of healer) {
      this.addModifierToTowers(heal);
    }

    // 基地BUFF
    const bases = Entities.FindAllByClassname('npc_dota_fort') as CDOTA_BaseNPC[];
    for (const base of bases) {
      this.addModifierToTowers(base);
      base.AddNewModifier(base, undefined, modifier_fort_think.name, {});
    }

    this.setPlayerColor();
  }

  /**
   * 设置玩家颜色（修正小地图不显示问题）
   */
  private setPlayerColor() {
    let radiantPlayerIndex = 0;
    let direPlayerIndex = 0;
    const radiantColors = [
      [51, 117, 255],
      [102, 255, 191],
      [191, 0, 191],
      [243, 240, 11],
      [255, 107, 0],
      [135, 206, 250],
      [255, 127, 80],
      [255, 0, 255],
      [0, 255, 0],
      [255, 215, 0],
    ];
    const direColors = [
      [254, 134, 194],
      [161, 180, 71],
      [101, 217, 247],
      [0, 131, 33],
      [164, 105, 0],
      [220, 20, 60],
      [0, 128, 128],
      [0, 0, 139],
      [245, 245, 220],
      [139, 0, 0],
    ];
    PlayerHelper.ForEachPlayer((playerId) => {
      const player = PlayerResource.GetPlayer(playerId);
      if (!player) return;
      let color: number[] | undefined;
      if (player.GetTeamNumber() === DotaTeam.GOODGUYS) {
        color = radiantColors[radiantPlayerIndex];
        radiantPlayerIndex++;
      } else {
        color = direColors[direPlayerIndex];
        direPlayerIndex++;
      }

      if (!color) return;

      PlayerResource.SetCustomPlayerColor(playerId, color[0], color[1], color[2]);
    });
  }

  private addModifierToTowers(building: CDOTA_BaseNPC) {
    // 防御塔攻击
    const towerPower = GameRules.Option.towerPower;

    ModifierHelper.applyTowerModifier(
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
    } else if (percent <= 350) {
      return 6;
    } else if (percent <= 400) {
      return 7;
    }
    return 1;
  }
}
