import { FusionRuneManager } from '../../ai/item/fusion-rune-manager';
import { GA4 } from '../../api/analytics/ga4';
import { Player } from '../../api/player';
import { Ranking } from '../../api/ranking';
import { modifier_fort_think } from '../../modifiers/global/fort_think';
import { GameConfig } from '../GameConfig';
import { ModifierHelper } from '../helper/modifier-helper';
import { PlayerHelper } from '../helper/player-helper';
import { HeroPick } from '../hero/hero-pick';
import { CreepBuffManager } from './game-in-progress/creep-buff-manager';
import { HeroManager } from './game-in-progress/hero-manager';
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

  private OnGameInProgress(): void {
    // 记录游戏开始时间用于 GA4 统计
    GA4.RecordGameStartTime();
    // 初始化融合符文
    FusionRuneManager.InitializeFusion();
  }

  /**
   * 选择英雄时间
   */
  private OnHeroSelection(): void {
    GameRules.Option.SetDefaultDifficulty();
    if (GameRules.Option.forceRandomHero) {
      HeroPick.PickRandomHeroes();
    }
  }

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

    // 初始化团队策略（推进策略、买活策略）
    new CreepBuffManager();
    new HeroManager();

    // 防御塔BUFF
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    for (const tower of towers) {
      this.addModifierToTowers(tower);
      // 删除重复的技能添加代码
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
      // 删除重复的技能添加代码
      base.AddNewModifier(base, undefined, modifier_fort_think.name, {});
    }

    // FIXME 泉水守卫windy实装未同步，暂时保留以缓解代码冲突
    // ✅ 新增: 生成泉水守卫windy
    // this.SpawnFountainGuard();
    //this.SpawnFountainGuardDire();

    // 延迟为泉水设置技能等级
    Timers.CreateTimer(1, () => {
      const fountains = Entities.FindAllByClassname('ent_dota_fountain') as CDOTA_BaseNPC[];
      //print('[fountain] found', fountains.length, 'fountains');

      for (const fountain of fountains) {
        const towerPower = GameRules.Option.towerPower;
        const towerLevel = this.getTowerLevel(towerPower);
        //print('[fountain] level', towerLevel);

        // 查找并设置技能等级
        const furySwipes = fountain.FindAbilityByName('tower_ursa_fury_swipes');
        if (furySwipes !== undefined) {
          furySwipes.SetLevel(towerLevel);
          //print('[fountain] furySwipes SetLevel', towerLevel);
        }

        const manaBreak = fountain.FindAbilityByName('tower_antimage_mana_break');
        if (manaBreak !== undefined) {
          manaBreak.SetLevel(towerLevel);
          //print('[fountain] manaBreak SetLevel', towerLevel);
        }
      }
    });
    this.setPlayerColor();
  }

  private SpawnFountainGuard(): void {
    // 天辉泉水位置
    const fountainPosition = Vector(-5820, -6580, 384) as Vector;

    const guard = CreateUnitByName(
      'npc_windy',
      fountainPosition,
      true,
      undefined,
      undefined,
      DotaTeam.BADGUYS,
    );

    if (guard !== undefined && guard !== null) {
      guard.AddNewModifier(guard, undefined, 'modifier_rooted', {});
      // print('[Fountain Guard] 泉水守卫已生成');
    } else {
      //print('[Fountain Guard] ERROR: 生成失败');
    }
  }

  private SpawnFountainGuardDire(): void {
    // 天辉泉水位置
    const fountainPosition = Vector(5820, 6580, 384) as Vector;

    const guard = CreateUnitByName(
      'npc_windy',
      fountainPosition,
      true,
      undefined,
      undefined,
      DotaTeam.BADGUYS,
    );

    if (guard !== undefined && guard !== null) {
      guard.AddNewModifier(guard, undefined, 'modifier_rooted', {});
      // print('[Fountain Guard] 泉水守卫已生成');
    } else {
      //print('[Fountain Guard] ERROR: 生成失败');
    }
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
    const towerLevel = this.getTowerLevel(towerPower);

    ModifierHelper.applyTowerModifier(building, `modifier_tower_power`, towerLevel);

    // 防御塔血量
    const newHealth = Math.floor((towerPower / 100) * building.GetMaxHealth());
    building.SetMaxHealth(newHealth);
    building.SetBaseMaxHealth(newHealth);
    building.SetHealth(newHealth);

    // 添加防御塔技能
    const buildingName = building.GetUnitName();

    // 检查是否是三塔或四塔
    if (buildingName.includes('tower3') || buildingName.includes('tower4')) {
      this.addTowerAbilities(building, towerLevel);
    }

    // 检查是否是基地
    if (buildingName.includes('fort')) {
      this.addTowerAbilities(building, towerLevel);
      // 基地额外添加法力破坏
      const manaBreak = building.AddAbility('tower_antimage_mana_break');
      if (manaBreak !== undefined) {
        // 修改这里
        manaBreak.SetLevel(towerLevel);
      }
    }
  }

  private addTowerAbilities(building: CDOTA_BaseNPC, level: number) {
    const abilities = [
      'tower_ursa_fury_swipes',
      'tower_shredder_reactive_armor',
      'tower_troll_warlord_fervor',
    ];

    for (const abilityName of abilities) {
      const ability = building.AddAbility(abilityName);
      if (ability !== undefined) {
        // 修改这里
        ability.SetLevel(level);
      }
    }
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
    } else if (percent <= 500) {
      return 8;
    } else if (percent <= 600) {
      return 9;
    } else if (percent <= 700) {
      return 10;
    }
    return 10;
  }
}
