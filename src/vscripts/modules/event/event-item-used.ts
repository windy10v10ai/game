export class EventItemUsed {
  constructor() {
    ListenToGameEvent('dota_item_used', (keys) => this.OnItemUsed(keys), this);
  }

  OnItemUsed(keys: GameEventProvidedProperties & DotaItemUsedEvent): void {
    const itemName = keys.itemname;

    if (itemName === 'item_tome_of_skill_reset') {
      print('[EventItemUsed] Skill reset item detected!');
      const playerId = keys.PlayerID as PlayerID;
      print('[EventItemUsed] Player ID: ' + playerId);
      GameRules.Lottery.initSkillReset(playerId);
    }
  }
}
