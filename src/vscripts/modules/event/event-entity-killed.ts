import { Player } from '../../api/player';
import { PlayerHelper } from '../helper/player-helper';

// 全局游戏状态 - 记录塔摧毁情况
export class TowerPushStatus {
  // Good是天辉摧毁的，Bad是夜魇摧毁的
  static tower1PushedBad = 0;
  static tower1PushedGood = 0;
  static tower2PushedBad = 0;
  static tower2PushedGood = 0;
  static tower3PushedBad = 0;
  static tower3PushedGood = 0;
  static tower4PushedBad = 0;
  static tower4PushedGood = 0;
  static barrackPushedBad = 0;
  static barrackPushedGood = 0;
}

export class EventEntityKilled {
  constructor() {
    ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
  }

  OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const killedUnit = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;
    if (!killedUnit) {
      return;
    }
    //print(`[EventEntityKilled] Unit killed: ${killedUnit.GetUnitName()}`);
    // ✅ 新增: 检查是否为npc_windy
    if (killedUnit.GetUnitName() === 'npc_windy') {
      //print('[EventEntityKilled] npc_windy detected, triggering respawn');
      this.onWindyKilled(killedUnit);
      return;
    }
    // 检查是否为防御塔
    if (killedUnit.IsTower()) {
      this.onTowerKilled(killedUnit);
    }
    // 检查是否为兵营
    else if (this.isBarrack(killedUnit)) {
      this.onBarrackKilled(killedUnit);
    }
    // 检查是否为英雄
    else if (killedUnit.IsRealHero() && !killedUnit.IsReincarnating()) {
      this.onHeroKilled(killedUnit as CDOTA_BaseNPC_Hero, attacker);
    }
    // 检查是否为小兵
    else if (killedUnit.IsCreep()) {
      this.onCreepKilled(killedUnit, attacker);
    }
  }

  //--------------------------------------------------------------------------------------------------------
  // 防御塔击杀
  //--------------------------------------------------------------------------------------------------------

  private onTowerKilled(tower: CDOTA_BaseNPC): void {
    const team = tower.GetTeamNumber();
    const unitName = tower.GetUnitName();

    if (unitName.indexOf('tower1') !== -1) {
      if (team === DotaTeam.GOODGUYS) {
        TowerPushStatus.tower1PushedBad++;
        print(`tower1PushedBad ${TowerPushStatus.tower1PushedBad}`);
      } else if (team === DotaTeam.BADGUYS) {
        TowerPushStatus.tower1PushedGood++;
        print(`tower1PushedGood ${TowerPushStatus.tower1PushedGood}`);
      }
    } else if (unitName.indexOf('tower2') !== -1) {
      if (team === DotaTeam.GOODGUYS) {
        TowerPushStatus.tower2PushedBad++;
        print(`tower2PushedBad ${TowerPushStatus.tower2PushedBad}`);
      } else if (team === DotaTeam.BADGUYS) {
        TowerPushStatus.tower2PushedGood++;
        print(`tower2PushedGood ${TowerPushStatus.tower2PushedGood}`);
      }
    } else if (unitName.indexOf('tower3') !== -1) {
      if (team === DotaTeam.GOODGUYS) {
        TowerPushStatus.tower3PushedBad++;
        print(`tower3PushedBad ${TowerPushStatus.tower3PushedBad}`);
        // 破高地后 给4塔和基地添加分裂箭
        if (TowerPushStatus.tower3PushedBad === 1) {
          this.addSplitShotToTowersAndFort(
            'npc_dota_goodguys_tower4',
            'npc_dota_goodguys_fort',
            1,
            3,
          );
        }
      } else if (team === DotaTeam.BADGUYS) {
        TowerPushStatus.tower3PushedGood++;
        print(`tower3PushedGood ${TowerPushStatus.tower3PushedGood}`);
        // 破高地后 给4塔和基地添加分裂箭
        if (TowerPushStatus.tower3PushedGood === 1) {
          this.addSplitShotToTowersAndFort(
            'npc_dota_badguys_tower4',
            'npc_dota_badguys_fort',
            1,
            2,
          );
        }
      }
    } else if (unitName.indexOf('tower4') !== -1) {
      if (team === DotaTeam.GOODGUYS) {
        TowerPushStatus.tower4PushedBad++;
        print(`tower4PushedBad ${TowerPushStatus.tower4PushedBad}`);
      } else if (team === DotaTeam.BADGUYS) {
        TowerPushStatus.tower4PushedGood++;
        print(`tower4PushedGood ${TowerPushStatus.tower4PushedGood}`);
      }
    }
  }

  private addSplitShotToTowersAndFort(
    towerName: string,
    fortName: string,
    towerLevel: number,
    fortLevel: number,
  ): void {
    // 给4塔添加分裂箭
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    for (const tower of towers) {
      if (tower.GetUnitName().indexOf(towerName) !== -1) {
        const splitShot = tower.AddAbility('tower_split_shot');
        if (splitShot !== undefined) {
          splitShot.SetLevel(towerLevel);
          splitShot.ToggleAbility();
        }
      }
    }

    // 给基地添加分裂箭
    const forts = Entities.FindAllByClassname('npc_dota_fort') as CDOTA_BaseNPC[];
    for (const fort of forts) {
      if (fort.GetUnitName().indexOf(fortName) !== -1) {
        const splitShot = fort.AddAbility('tower_split_shot');
        if (splitShot !== undefined) {
          splitShot.SetLevel(fortLevel);
          splitShot.ToggleAbility();
        }
      }
    }
  }

  //--------------------------------------------------------------------------------------------------------
  // 兵营击杀
  //--------------------------------------------------------------------------------------------------------

  private isBarrack(unit: CDOTA_BaseNPC): boolean {
    return unit.GetClassname() === 'npc_dota_barracks';
  }

  private onBarrackKilled(barrack: CDOTA_BaseNPC): void {
    const team = barrack.GetTeamNumber();
    if (team === DotaTeam.GOODGUYS) {
      TowerPushStatus.barrackPushedBad++;
      print(`barrackPushedBad ${TowerPushStatus.barrackPushedBad}`);
    } else if (team === DotaTeam.BADGUYS) {
      TowerPushStatus.barrackPushedGood++;
      print(`barrackPushedGood ${TowerPushStatus.barrackPushedGood}`);
    }
  }

  //--------------------------------------------------------------------------------------------------------
  // 英雄击杀
  //--------------------------------------------------------------------------------------------------------

  private onHeroKilled(hero: CDOTA_BaseNPC_Hero, _attacker: CDOTA_BaseNPC | undefined): void {
    this.setRespawnTime(hero);
  }

  private readonly dotaRespawnTime = [
    4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
    64,
  ];

  private readonly respawnTimeDefault = 60;
  private readonly respawnTimeMin = 2;
  private readonly respawnTimeMax = 100;

  private setRespawnTime(hero: CDOTA_BaseNPC_Hero): void {
    hero.SetTimeUntilRespawn(this.respawnTimeDefault);

    const level = hero.GetLevel();
    const respawnTimeRate = GameRules.Option.respawnTimePercentage / 100;

    let respawnTime = 0;
    const levelIndex = level - 1;
    if (levelIndex < this.dotaRespawnTime.length) {
      respawnTime = Math.ceil(this.dotaRespawnTime[levelIndex] * respawnTimeRate);
    } else {
      respawnTime = Math.ceil((level / 4 + 52) * respawnTimeRate);
    }

    // NEC大招 每一级增加6秒
    //const necrolyteReapersScythe = hero.FindModifierByName('modifier_necrolyte_reapers_scythe');
    //if (necrolyteReapersScythe) {
    //  respawnTime += (necrolyteReapersScythe.GetAbility()?.GetLevel() ?? 0) * 6;
    //}

    // 会员减少5s复活时间
    if (Player.IsMemberStatic(PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID()))) {
      respawnTime -= 5;
    }

    // 复活时间范围限制
    respawnTime = Math.max(this.respawnTimeMin, Math.min(this.respawnTimeMax, respawnTime));

    hero.SetTimeUntilRespawn(respawnTime);
  }

  //--------------------------------------------------------------------------------------------------------
  // 单位击杀
  //--------------------------------------------------------------------------------------------------------
  private readonly removeGoldBagDelay = 20;

  // 神器碎片
  private itemLightPartName = 'item_light_part';
  private itemDarkPartName = 'item_dark_part';

  // 技能重置书
  private itemTomeOfAbilityReset = 'item_tome_of_ability_reset';

  private dropItemChanceRoshanArtifactPart = 100;

  // 龙珠
  private dropItemListDragonBall: string[] = [
    'item_dragon_ball_1',
    'item_dragon_ball_2',
    'item_dragon_ball_3',
    'item_dragon_ball_4',
    'item_dragon_ball_5',
    'item_dragon_ball_6',
    'item_dragon_ball_7',
  ];

  private dropItemChanceRoshan = 100;
  private dropItemChanceAncient = 1.0;
  private dropItemChanceNeutral = 0.2;
  //符文
  private dropItemListFusionMaterial: string[] = [
    'item_fusion_hawkeye',
    'item_fusion_forbidden',
    'item_fusion_brutal',
    'item_fusion_beast',
    'item_fusion_life',
    'item_fusion_shadow',
    'item_fusion_magic',
    'item_fusion_agile',
  ];

  private dropItemChanceFusionRoshan = 100;
  private dropItemChanceFusionAncient = 1.0;
  private dropItemChanceFusionNeutral = 0.2;
  private calculateDropChance(baseChance: number): number {
    // 获取游戏难度

    const difficulty = GameRules.Option.direGoldXpMultiplier || 1;
    // 获取玩家人数
    const playerCount = Player.GetPlayerCount();

    // 难度系数: 难度越高,掉落概率越高
    let difficultyMultiplier = 1;
    if (difficulty >= 60) {
      difficultyMultiplier = 3.0;
    } else if (difficulty >= 40) {
      difficultyMultiplier = 2.5;
    } else if (difficulty >= 20) {
      difficultyMultiplier = 2.0;
    } else if (difficulty >= 10) {
      difficultyMultiplier = 1.5;
    } else if (difficulty >= 1) {
      difficultyMultiplier = 1;
    }

    // 人数系数: 人数过多野怪分不过来时才调高概率
    let playerMultiplier = 1;
    if (playerCount >= 6) {
      playerMultiplier = 1.5;
    } else if (playerCount >= 3) {
      playerMultiplier = 1.2;
    }

    // 最终概率 = 基础概率 × 难度系数 × 人数系数
    const finalChance = baseChance * difficultyMultiplier * playerMultiplier;

    // 设置上限,避免概率过高
    return Math.min(finalChance, 100);
  }

  private onCreepKilled(creep: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC | undefined): void {
    const creepName = creep.GetName();

    if (creepName === 'npc_dota_roshan') {
      // 击杀肉山
      if (PlayerHelper.IsGoodTeamUnit(attacker)) {
        // 龙珠掉落，不重复掉落
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceRoshan,
          true,
        );

        // 技能重置书掉落
        this.dropItem(creep, [this.itemTomeOfAbilityReset], this.dropItemChanceRoshan);

        // 融合符文掉落 - 使用神器组件的循环逻辑可重复
        const maxDropCount = Math.floor(Player.GetPlayerCount() / 4);
        const dropCount = RandomInt(1, maxDropCount);
        //print(`[EventEntityKilled] Fusion material dropCount is ${dropCount}`);
        for (let i = 0; i < dropCount; i++) {
          // 从符文列表中随机选择一个
          this.dropItem(creep, this.dropItemListFusionMaterial, this.dropItemChanceFusionRoshan);
        }
      } else {
        //print(`[EventEntityKilled] OnCreepKilled attacker is not human player, skip drop item`);
      }

      // 延迟移除无人捡取的金币袋
      Timers.CreateTimer(this.removeGoldBagDelay, () => {
        const goldBags = Entities.FindAllByClassname('dota_item_drop') as CDOTA_Item_Physical[];
        for (const goldBag of goldBags) {
          const itemName = goldBag.GetContainedItem().GetName();
          if (itemName === 'item_bag_of_gold') {
            goldBag.RemoveSelf();
          }
        }
      });
    } else if (creep.IsAncient()) {
      // 击杀远古
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        // 龙珠掉落，不重复掉落
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceAncient,
          true,
        );
        // 符文掉落 - 单次随机
        this.dropItem(
          creep,
          this.dropItemListFusionMaterial,
          this.calculateDropChance(this.dropItemChanceFusionAncient),
        );
        this.dropParts(creep, this.dropItemChanceAncient);
      }
    } else if (creep.IsNeutralUnitType()) {
      // 击杀中立单位
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        // 龙珠掉落，不重复掉落
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceNeutral,
          true,
        );
        // 符文掉落 - 单次随机
        this.dropItem(
          creep,
          this.dropItemListFusionMaterial,
          this.calculateDropChance(this.dropItemChanceFusionNeutral),
        );
        //神器组件
        this.dropParts(creep, this.dropItemChanceNeutral);
      }
    }
  }

  private dropParts(creep: CDOTA_BaseNPC, chance = 1): void {
    // 获取白天夜晚
    const isDaytime = GameRules.IsDaytime();
    if (isDaytime) {
      // 白天掉落圣光组件
      this.dropItem(creep, [this.itemLightPartName], chance);
    } else {
      // 夜晚掉落暗影组件
      this.dropItem(creep, [this.itemDarkPartName], chance);
    }
  }

  // ✅ 新增: npc_windy复活处理
  private onWindyKilled(unit: CDOTA_BaseNPC): void {
    const respawnTime = 60; // 30秒后复活
    const unitName = unit.GetUnitName();
    const position = unit.GetAbsOrigin();
    const team = unit.GetTeam();
    //print(`[Windy] npc_windy被击杀,将在${respawnTime}秒后复活`);

    // ✅ 符文掉落 - 使用远古单位2倍的概率
    const windyDropChance = this.dropItemChanceFusionAncient * 2; // 1.5 * 3 * 5 = 18
    this.dropItem(
      unit, // 修正: 使用 unit 而不是 npc_windy
      this.dropItemListFusionMaterial,
      this.calculateDropChance(windyDropChance),
    );

    //print(`[Windy] Fusion rune drop chance: ${this.calculateDropChance(windyDropChance)}%`);
    const goldmultiplier = GameRules.Option.direGoldXpMultiplier || 2;
    // ✅ 新增: 10%概率掉落经验书
    const baseChance = 30;
    // 线性插值公式: 在 goldmultiplier 10-100 之间，从 10% 增长到 20%
    // 公式: baseChance * (1 + (goldmultiplier - 10) / 90)
    const expBookDropChance = baseChance * (1 + Math.max(0, goldmultiplier - 10) / 90);
    if (RandomFloat(0, 100) <= expBookDropChance) {
      const expBook = CreateItem('item_tome_of_knowledge', undefined, undefined);
      if (expBook) {
        CreateItemOnPositionSync(position, expBook);
        expBook.LaunchLoot(
          false,
          300,
          0.75,
          position.__add(Vector(RandomInt(-100, 100), RandomInt(-100, 100), 0)),
          undefined,
        );
        //print(`[Windy] npc_windy掉落经验书`);
      }
    }
    // ✅ 新增: 10%概率掉落金币包，数量基于难度动态计算概率
    const goldBagDropChance = baseChance * (1 + Math.max(0, goldmultiplier - 10) / 90);

    if (RandomFloat(0, 100) <= goldBagDropChance) {
      let dropCount = 1; // 默认至少掉1个

      // 根据 goldmultiplier (2-100) 动态计算第2个金币袋的掉落概率
      // 公式: 基础概率 = (goldmultiplier - 2) / 98 * 100，范围 0%-100%
      const secondBagChance = Math.min(((goldmultiplier - 2) / 98) * 100, 100);
      if (RandomFloat(0, 100) <= secondBagChance) {
        dropCount = 2;

        // 根据 goldmultiplier 动态计算第3个金币袋的掉落概率
        // 公式: 只有在 goldmultiplier >= 30 时才有机会掉第3个
        // 概率 = (goldmultiplier - 30) / 70 * 100，范围 0%-100%
        const thirdBagChance = Math.min(Math.max(0, ((goldmultiplier - 30) / 70) * 100), 100);
        if (RandomFloat(0, 100) <= thirdBagChance) {
          dropCount = 3;
        }
      }

      // print(
      //   `[Windy] npc_windy will drop ${dropCount} gold bags (difficulty: ${goldmultiplier}x, 2nd chance: ${secondBagChance.toFixed(1)}%)`,
      // );

      // 掉落对应数量的金币包
      for (let i = 0; i < dropCount; i++) {
        const goldBag = CreateItem('item_bag_of_gold', undefined, undefined);
        if (goldBag) {
          CreateItemOnPositionSync(position, goldBag);
          goldBag.LaunchLoot(
            false,
            300,
            0.75,
            position.__add(Vector(RandomInt(-100, 100), RandomInt(-100, 100), 0)),
            undefined,
          );
        }
      }

      // print(`[Windy] npc_windy dropped ${dropCount} gold bags`);
    }

    Timers.CreateTimer(respawnTime, () => {
      const newUnit = CreateUnitByName(unitName, position, true, undefined, undefined, team);

      if (newUnit !== undefined) {
        newUnit.AddNewModifier(newUnit, undefined, 'modifier_rooted', {});
        // print('[Windy] npc_windy已复活');
      }
    });
  }

  /**
   * 从指定list中随机掉落一件物品
   */
  private dropItem(
    creep: CDOTA_BaseNPC,
    dropItemList: string[],
    dropChance = 100,
    dropOnce = false,
  ): string[] {
    if (dropItemList.length === 0) {
      //print(`[EventEntityKilled] OnCreepKilled dropItemList is empty`);
      return dropItemList;
    }
    if (RandomFloat(0, 100) <= dropChance) {
      const itemIndex = RandomInt(0, dropItemList.length - 1);
      const itemName = dropItemList[itemIndex];
      const item = CreateItem(itemName, undefined, undefined);
      if (item) {
        CreateItemOnPositionSync(creep.GetAbsOrigin(), item);
        item.LaunchLoot(
          false,
          300,
          0.75,
          creep.GetAbsOrigin().__add(Vector(RandomInt(-100, 100), RandomInt(-100, 100), 0)),
          undefined,
        );
      }

      //print(`[EventEntityKilled] OnCreepKilled drop item ${itemName}`);
      if (dropOnce) {
        // 从物品列表中移除，不再掉落
        return dropItemList.filter((v, i) => i !== itemIndex);
      } else {
        return dropItemList;
      }
    }
    return dropItemList;
  }
}
