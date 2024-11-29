export class PlayerHelper {
  static IsHumanPlayer(npc: CDOTA_BaseNPC | undefined): boolean {
    if (npc && npc.IsRealHero()) {
      const playerId = npc.GetPlayerOwnerID();
      if (playerId >= 0) {
        return this.IsHumanPlayerByPlayerId(playerId);
      }
    }
    return false;
  }

  static IsHumanPlayerByPlayerId(playerId: PlayerID): boolean {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      const steamAccountID = PlayerResource.GetSteamAccountID(playerId);
      if (steamAccountID > 0) {
        return true;
      }
    }
    return false;
  }

  static ForEachPlayer(callback: (playerId: PlayerID) => void) {
    for (let i = 0; i < PlayerResource.GetPlayerCount(); i++) {
      if (PlayerResource.IsValidPlayer(i)) {
        callback(i);
      }
    }
  }
}
