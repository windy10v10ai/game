import { GA4 } from './ga4';

export class GA4PickItemTracker {
  private static readonly EVENT_NAME = 'pick_item';

  /** 玩家从藏宝箱抽奖中选择物品时调用 */
  public static SendPick(playerId: PlayerID, itemName: string, tier: number): void {
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);

    const event = GA4.BuildEvent(this.EVENT_NAME, steamId, {
      steam_id: steamId,
      item_name: itemName,
      tier,
      hero_name: hero ? hero.GetUnitName() : 'unknown',
      team_id: hero ? hero.GetTeamNumber() : 0,
      dota_duration: Math.floor(GameRules.GetDOTATime(false, true)),
    });

    GA4.SendEvent(steamId, event);
  }
}
