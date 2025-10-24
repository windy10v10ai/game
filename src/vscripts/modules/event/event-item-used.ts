export class EventItemUsed {
  constructor() {
    ListenToGameEvent('dota_item_used', (keys) => this.OnItemUsed(keys), this);
  }

  OnItemUsed(keys: GameEventProvidedProperties & DotaItemUsedEvent): void {
    const itemName = keys.itemname;

    if (itemName === 'item_tome_of_ability_reset') {
      const playerId = keys.PlayerID as PlayerID;
      GameRules.Lottery.initAbilityReset(playerId);
    }
  }
}
