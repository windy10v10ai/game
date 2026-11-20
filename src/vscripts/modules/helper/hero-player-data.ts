import { Player } from '../../api/player';
import { PlayerPropertyApi } from '../../api/player-property';
import { AwakenHelper } from './awaken-helper';
import { MemberHelper } from './member-helper';
import { ModifierHelper } from './modifier-helper';
import { PlayerHelper } from './player-helper';

/**
 * 把玩家数据（会员、觉醒、新手 BUFF、属性加点）作用到玩家英雄上。
 * 英雄出生早于数据到达时，数据写入后要再调用一次，所以所有步骤都可重复执行。
 */
export class HeroPlayerData {
  public static ApplyToHero(hero: CDOTA_BaseNPC_Hero) {
    MemberHelper.ApplyMemberModifier(hero);
    const steamAccountId = PlayerResource.GetSteamAccountID(hero.GetPlayerID());
    AwakenHelper.ApplyUnlockedAwaken(hero, steamAccountId);

    const seasonLevel = Player.GetSeasonLevel(steamAccountId);
    const newbieModifier =
      seasonLevel <= 5
        ? 'modifier_global_newbie'
        : seasonLevel <= 10
          ? 'modifier_global_newbie_2'
          : undefined;
    if (newbieModifier && !hero.HasModifier(newbieModifier)) {
      ModifierHelper.applyGlobalModifier(hero, newbieModifier);
    }

    PlayerPropertyApi.SetPlayerProperty(hero);
  }

  /** 玩家数据写入后，补应用到已出生的玩家英雄 */
  public static ApplyToExistingHeroes() {
    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (hero && PlayerHelper.IsHumanPlayer(hero)) {
        HeroPlayerData.ApplyToHero(hero);
      }
    });
  }
}
