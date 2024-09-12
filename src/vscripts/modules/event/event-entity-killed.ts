import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";

export class EventEntityKilled {
  constructor() {
    ListenToGameEvent("entity_killed", (keys) => this.OnEntityKilled(keys), this);
  }

  private readonly removeGoldBagDelay = 20;

  // 神器碎片
  private itemLightPartName = "item_light_part";
  private itemDarkPartName = "item_dark_part";

  private dropItemChanceRoshanArtifactPart = 100;

  // 龙珠
  private dropItemListDragonBall: string[] = [
    "item_dragon_ball_1",
    "item_dragon_ball_2",
    "item_dragon_ball_3",
    "item_dragon_ball_4",
    "item_dragon_ball_5",
    "item_dragon_ball_6",
    "item_dragon_ball_7",
  ];

  private dropItemChanceRoshan = 100;
  private dropItemChanceAncient = 1.0;
  private dropItemChanceNeutral = 0.15;

  OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const killedUnit = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killedUnit) {
      return;
    }

    if (killedUnit.IsRealHero()) {
      this.OnHeroKilled(killedUnit as CDOTA_BaseNPC_Hero);
    } else if (killedUnit.IsCreep()) {
      this.OnCreepKilled(killedUnit, keys);
    }
  }

  private OnHeroKilled(_hero: CDOTA_BaseNPC_Hero): void {
    // FIXME 重写lua的OnHeroKilled
  }

  private OnCreepKilled(
    creep: CDOTA_BaseNPC,
    keys: GameEventProvidedProperties & EntityKilledEvent,
  ): void {
    const creepName = creep.GetName();
    const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;

    if (creepName === "npc_dota_roshan") {
      // 击杀肉山
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceRoshan,
        );

        // 神器组件掉落，掉落数量 2 ~ (玩家数量 + 1) 的随机数
        const maxDropCount = Player.GetPlayerCount() + 1;
        const dropCount = RandomInt(2, maxDropCount);
        print(`[EventEntityKilled] OnCreepKilled dropCount is ${dropCount}`);
        for (let i = 0; i < dropCount; i++) {
          const isDaytime = GameRules.IsDaytime();
          if (isDaytime) {
            // 白天掉落圣光组件
            this.dropItem(creep, [this.itemLightPartName], this.dropItemChanceRoshanArtifactPart);
          } else {
            // 夜晚掉落暗影组件
            this.dropItem(creep, [this.itemDarkPartName], this.dropItemChanceRoshanArtifactPart);
          }
        }
      } else {
        print(`[EventEntityKilled] OnCreepKilled attacker is not human player, skip drop item`);
      }

      // 延迟移除无人捡取的金币袋
      Timers.CreateTimer(this.removeGoldBagDelay, () => {
        const goldBags = Entities.FindAllByClassname("dota_item_drop") as CDOTA_Item_Physical[];
        for (const goldBag of goldBags) {
          const itemName = goldBag.GetContainedItem().GetName();
          if (itemName === "item_bag_of_gold") {
            goldBag.RemoveSelf();
          }
        }
      });
    } else if (creep.IsAncient()) {
      // 击杀远古
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceAncient,
        );

        this.dropParts(creep);
      }
    } else if (creep.IsNeutralUnitType()) {
      // 击杀中立单位
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceNeutral,
        );

        this.dropParts(creep);
      }
    }
  }

  private dropParts(creep: CDOTA_BaseNPC): void {
    // 组件掉落概率随游戏时长而增加
    const dotaTime = GameRules.GetDOTATime(false, false);
    let dropItemChanceCreepArtifactPart = 0;
    if (dotaTime < 600) {
      dropItemChanceCreepArtifactPart = 0.5;
    } else if (dotaTime < 1200) {
      dropItemChanceCreepArtifactPart = 1;
    } else if (dotaTime < 1800) {
      dropItemChanceCreepArtifactPart = 1.5;
    } else {
      dropItemChanceCreepArtifactPart = 2;
    }

    // 获取白天夜晚
    const isDaytime = GameRules.IsDaytime();
    if (isDaytime) {
      // 白天掉落圣光组件
      this.dropItem(creep, [this.itemLightPartName], dropItemChanceCreepArtifactPart);
    } else {
      // 夜晚掉落暗影组件
      this.dropItem(creep, [this.itemDarkPartName], dropItemChanceCreepArtifactPart);
    }
  }

  /**
   * 从指定list中随机掉落一件物品
   */
  private dropItem(creep: CDOTA_BaseNPC, dropItemList: string[], dropChance = 100): string[] {
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
      return dropItemList.filter((v, i) => i !== itemIndex);
    }
    return dropItemList;
  }
}
