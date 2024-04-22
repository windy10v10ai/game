import { Player } from "../../api/player";
import { PlayerHelper } from "../../helper/player-helper";

export class EventEntityKilled {
  constructor() {
    ListenToGameEvent("entity_killed", (keys) => this.OnEntityKilled(keys), this);
  }

  private readonly removeGoldBagDelay = 20;

  // 神器碎片
  private dropItemListArtifactPart: string[] = ["item_light_part", "item_dark_part"];

  private dropItemChanceRoshanArtifactPart = 100;
  private dropItemChanceCreepArtifactPart = 1.0;

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
          this.dropItem(
            creep,
            this.dropItemListArtifactPart,
            this.dropItemChanceRoshanArtifactPart,
          );
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
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceAncient,
        );

        this.dropItem(creep, this.dropItemListArtifactPart, this.dropItemChanceCreepArtifactPart);
      }
    } else if (creep.IsNeutralUnitType()) {
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.dropItemListDragonBall = this.dropItem(
          creep,
          this.dropItemListDragonBall,
          this.dropItemChanceNeutral,
        );

        this.dropItem(creep, this.dropItemListArtifactPart, this.dropItemChanceCreepArtifactPart);
      }
    }
  }

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
