export class Helper {
  static IsHumanPlayer(npc: CDOTA_BaseNPC): boolean {
    if (npc.IsRealHero()) {
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
}
