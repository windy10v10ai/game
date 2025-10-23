import { Player } from '../../api/player';
import { PlayerHelper } from '../helper/player-helper';

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
    // ✅ 新增: 检查是否为npc_windy
    if (killedUnit.GetUnitName() === 'npc_windy') {
      this.onWindyKilled(killedUnit);
      return;
    }
    if (killedUnit.IsRealHero() && !killedUnit.IsReincarnating()) {
      this.onHeroKilled(killedUnit as CDOTA_BaseNPC_Hero, attacker);
    } else if (killedUnit.IsCreep()) {
      this.onCreepKilled(killedUnit, attacker);
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
    const necrolyteReapersScythe = hero.FindModifierByName('modifier_necrolyte_reapers_scythe');
    if (necrolyteReapersScythe) {
      respawnTime += (necrolyteReapersScythe.GetAbility()?.GetLevel() ?? 0) * 6;
    }

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
      difficultyMultiplier = 3.0; // 60难度: 3倍概率
    } else if (difficulty >= 30) {
      difficultyMultiplier = 2.0; // 20难度: 2倍概率
    } else if (difficulty >= 17) {
      difficultyMultiplier = 1.6; // 20难度: 2倍概率
    } else if (difficulty >= 12) {
      difficultyMultiplier = 1.2; // 12难度: 1.4倍概率
    } else if (difficulty >= 1) {
      difficultyMultiplier = 1; // N2难度: 1.2倍概率
    }
    // 人数系数: 人数越多概率越高
    let playerMultiplier = 1;
    if (playerCount >= 6) {
      playerMultiplier = 1.3; // 6人: 2倍概率
    } else if (playerCount >= 4) {
      playerMultiplier = 1.2; // 4-5人: 1.0倍概率
    } else if (playerCount >= 2) {
      playerMultiplier = 1.0; // 2-3人: 1.5倍概率
    } else if (playerCount <= 1) {
      playerMultiplier = 1.1; // 1人: 2倍概率
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

        // 融合符文掉落 - 使用神器组件的循环逻辑可重复
        const maxDropCount = Math.floor(Player.GetPlayerCount() / 4);
        const dropCount = RandomInt(1, maxDropCount);
        print(`[EventEntityKilled] Fusion material dropCount is ${dropCount}`);
        for (let i = 0; i < dropCount; i++) {
          // 从符文列表中随机选择一个
          this.dropItem(creep, this.dropItemListFusionMaterial, this.dropItemChanceFusionRoshan);
        }

        // 神器组件掉落，掉落数量 1 ~ 3 的随机数
        for (let i = 0; i < dropCount; i++) {
          const isDaytime = GameRules.IsDaytime();
          if (isDaytime) {
            this.dropItem(creep, [this.itemLightPartName], this.dropItemChanceRoshanArtifactPart);
          } else {
            this.dropItem(creep, [this.itemDarkPartName], this.dropItemChanceRoshanArtifactPart);
          }
        }
      } else {
        print(`[EventEntityKilled] OnCreepKilled attacker is not human player, skip drop item`);
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
    const respawnTime = 30; // 30秒后复活
    const unitName = unit.GetUnitName();
    const position = unit.GetAbsOrigin();
    const team = unit.GetTeam();

    print(`[Windy] npc_windy被击杀,将在${respawnTime}秒后复活`);

    Timers.CreateTimer(respawnTime, () => {
      const newUnit = CreateUnitByName(unitName, position, true, undefined, undefined, team);

      if (newUnit !== undefined) {
        newUnit.AddNewModifier(newUnit, undefined, 'modifier_rooted', {});
        print('[Windy] npc_windy已复活');
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
      print(`[EventEntityKilled] OnCreepKilled dropItemList is empty`);
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

      print(`[EventEntityKilled] OnCreepKilled drop item ${itemName}`);
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
