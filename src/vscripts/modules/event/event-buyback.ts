import { Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { GameConfig } from '../GameConfig';

@reloadable
export class EventDotaBuyback {
  constructor() {
    ListenToGameEvent('dota_buyback', (keys) => this.onBuyback(keys), this);
  }

  onBuyback(keys: GameEventProvidedProperties & DotaBuybackEvent): void {
    const playerId = keys.player_id as PlayerID;
    const hero = EntIndexToHScript(keys.entindex) as CDOTA_BaseNPC_Hero;
    if (!hero) {
      return;
    }
    if (!hero.IsRealHero()) {
      return;
    }
    if (hero.IsReincarnating()) {
      // 重生中不处理
      return;
    }

    // 会员买活时间上限设置
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId);
    if (Player.IsMemberStatic(steamAccountID)) {
      // 需要等待一段时间，否则GetBuybackCooldownTime()获取的值是0
      Timers.CreateTimer(0.5, () => {
        this.setBuyBackCooldownTime(hero);
      });
    }
  }

  setBuyBackCooldownTime(hero: CDOTA_BaseNPC_Hero): void {
    const buybackTime = hero.GetBuybackCooldownTime();
    if (buybackTime > GameConfig.MEMBER_BUYBACK_CD) {
      hero.SetBuybackCooldownTime(GameConfig.MEMBER_BUYBACK_CD);
    }
  }
}
