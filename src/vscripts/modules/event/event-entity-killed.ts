export class EventEntityKilled {
  private readonly removeGoldBagDelay = 15;
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
    }
  }
}
