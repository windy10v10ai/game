export class EventEntityKilled {
  private readonly removeGoldBagDelay = 20;
  private roshanDropItemList: string[] = ["item_dragon_ball_6", "item_dragon_ball_7"];
  private roshanDropItemChance = 75;

  OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const killedUnit = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killedUnit) {
      return;
    }

    if (killedUnit.IsRealHero()) {
      this.OnHeroKilled(killedUnit as CDOTA_BaseNPC_Hero);
    } else if (killedUnit.IsCreep()) {
      this.OnCreepKilled(killedUnit);
    }
  }

  private OnHeroKilled(_hero: CDOTA_BaseNPC_Hero): void {
    // TODO
  }

  private OnCreepKilled(creep: CDOTA_BaseNPC): void {
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

      this.roshanDropItem(creep);
    }
  }

  private roshanDropItem(creep: CDOTA_BaseNPC): void {
    if (this.roshanDropItemList.length === 0) {
      print(`[EventEntityKilled] OnCreepKilled roshanDropItemList is empty`);
      return;
    }
    if (RandomInt(0, 100) <= this.roshanDropItemChance) {
      const itemIndex = RandomInt(0, this.roshanDropItemList.length - 1);
      const itemName = this.roshanDropItemList[itemIndex];
      const item = CreateItem(itemName, undefined, undefined);
      if (item) {
        CreateItemOnPositionSync(creep.GetAbsOrigin(), item);
        item.LaunchLoot(false, 300, 0.75, creep.GetAbsOrigin(), undefined);
      }

      print(`[EventEntityKilled] OnCreepKilled drop item ${itemName}`);
      this.roshanDropItemList = this.roshanDropItemList.filter((v, i) => i !== itemIndex);
    }
  }
}
