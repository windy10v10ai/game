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

  static IsGoodTeamUnit(unit: CDOTA_BaseNPC | undefined): boolean {
    if (!unit) {
      return false;
    }
    return unit.GetTeamNumber() === DotaTeam.GOODGUYS;
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

  static GetDamageTaken(playerId: PlayerID): number {
    let damageTaken = 0;
    for (let victimID = 0; victimID < DOTA_MAX_TEAM_PLAYERS; victimID++) {
      if (
        PlayerResource.IsValidPlayerID(victimID) &&
        PlayerResource.IsValidPlayer(victimID) &&
        PlayerResource.GetSelectedHeroEntity(victimID)
      ) {
        if (PlayerResource.GetTeam(victimID) !== PlayerResource.GetTeam(playerId)) {
          damageTaken += PlayerResource.GetDamageDoneToHero(victimID, playerId);
        }
      }
    }
    return damageTaken;
  }

  // 扣除从虚拟金币库转回的金额，与 end_screen_2.js money 列口径一致
  static GetTotalGoldEarned(playerId: PlayerID): number {
    const virtualGoldData = CustomNetTables.GetTableValue(
      'player_virtual_gold',
      playerId.toString(),
    );
    const transferredBackTotal = virtualGoldData?.transferred_back_total ?? 0;
    return Math.max(0, PlayerResource.GetTotalEarnedGold(playerId) - transferredBackTotal);
  }
}
