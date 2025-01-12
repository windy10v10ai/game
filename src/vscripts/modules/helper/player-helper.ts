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

  static IsBotPlayer(npc: CDOTA_BaseNPC | undefined): boolean {
    if (npc && npc.IsRealHero()) {
      return this.IsBotPlayerByPlayerId(npc.GetPlayerID());
    }
    return false;
  }

  static IsBotPlayerByPlayerId(playerId: PlayerID): boolean {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      const steamAccountID = PlayerResource.GetSteamAccountID(playerId);
      if (steamAccountID === 0) {
        return true;
      }
    }
    return false;
  }

  static ForEachPlayer(callback: (playerId: PlayerID) => void) {
    for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
      if (PlayerResource.IsValidPlayer(i)) {
        callback(i);
      }
    }
  }

  static FindHeroBySteeamAccountId(steamAccountId: number): CDOTA_BaseNPC_Hero | undefined {
    for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
      if (PlayerResource.IsValidPlayer(i)) {
        const player = PlayerResource.GetPlayer(i);
        if (player) {
          if (PlayerResource.GetSteamAccountID(i) === steamAccountId) {
            return player.GetAssignedHero();
          }
        }
      }
    }
    return undefined;
  }

  static IsGoodTeamPlayer(playerId: PlayerID): boolean {
    return PlayerResource.GetTeam(playerId) === DotaTeam.GOODGUYS;
  }

  static GetHumamPlayerCount(): number {
    let count = 0;
    this.ForEachPlayer((playerId) => {
      if (this.IsHumanPlayerByPlayerId(playerId)) {
        count++;
      }
    });
    return count;
  }
}
