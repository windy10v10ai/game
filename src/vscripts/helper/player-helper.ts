export class PlayerHelper {
  static IsHumanPlayer(npc: CDOTA_BaseNPC | undefined): boolean {
    if (npc && npc.IsRealHero()) {
      // is human player
      if (npc.GetPlayerOwnerID() >= 0) {
        const player = PlayerResource.GetPlayer(npc.GetPlayerOwnerID());
        if (player) {
          const steamAccountID = PlayerResource.GetSteamAccountID(npc.GetPlayerOwnerID());
          if (steamAccountID > 0) {
            return true;
          }
        }
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
