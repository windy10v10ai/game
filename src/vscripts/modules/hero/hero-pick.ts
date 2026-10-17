import { PlayerHelper } from '../helper/player-helper';

export class HeroPick {
  static PickRandomHeroes() {
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        PlayerResource.GetPlayer(playerId)?.MakeRandomHeroSelection();
      }
    });
  }

  static PickHumanHeroes() {
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        if (PlayerResource.HasSelectedHero(playerId)) {
          return;
        }
        PlayerResource.GetPlayer(playerId)?.MakeRandomHeroSelection();
      }
    });
  }
}
