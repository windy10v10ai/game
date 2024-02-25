import { PlayerHelper } from "../../helper/player-helper";

export class EventEntityKilled {
  constructor() {
    ListenToGameEvent("entity_killed", (keys) => this.OnEntityKilled(keys), this);
  }

  private readonly removeGoldBagDelay = 20;
  private roshanDropItemList: string[] = ["item_dragon_ball_6", "item_dragon_ball_7"];
  private roshanDropItemChance = 70;

  private roshanDropItemList2: string[] = [
    "item_dragon_ball_1",
    "item_dragon_ball_2",
    "item_dragon_ball_3",
    "item_dragon_ball_4",
    "item_dragon_ball_5",
  ];

  private roshanDropItemChance2 = 85;

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
    // TODO
  }

  private OnCreepKilled(
    creep: CDOTA_BaseNPC,
    keys: GameEventProvidedProperties & EntityKilledEvent,
  ): void {
    const creepName = creep.GetName();
    if (creepName === "npc_dota_roshan") {
      // delay to remove item item_bag_of_gold and item_bag_of_season_point on map
      Timers.CreateTimer(this.removeGoldBagDelay, () => {
        const goldBags = Entities.FindAllByClassname("dota_item_drop") as CDOTA_Item_Physical[];
        for (const goldBag of goldBags) {
          const itemName = goldBag.GetContainedItem().GetName();
          if (itemName === "item_bag_of_gold" || itemName === "item_bag_of_season_point") {
            goldBag.RemoveSelf();
          }
        }
      });

      const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;
      if (PlayerHelper.IsHumanPlayer(attacker)) {
        this.roshanDropItemList = this.roshanDropItem(
          creep,
          this.roshanDropItemList,
          this.roshanDropItemChance,
        );
        this.roshanDropItemList2 = this.roshanDropItem(
          creep,
          this.roshanDropItemList2,
          this.roshanDropItemChance2,
        );
      } else {
        print(`[EventEntityKilled] OnCreepKilled attacker is not human player, skip drop item`);
      }
    }
  }

  private roshanDropItem(creep: CDOTA_BaseNPC, dropItemList: string[], dropChance = 100): string[] {
    if (dropItemList.length === 0) {
      print(`[EventEntityKilled] OnCreepKilled dropItemList is empty`);
      return dropItemList;
    }
    if (RandomInt(0, 100) <= dropChance) {
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
