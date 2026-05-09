import { MemberHelper } from '../modules/helper/member-helper';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

export class PlayerInfoApi {
  constructor() {
    CustomGameEventManager.RegisterListener<Record<string, never>>(
      'player_info_refresh',
      (_, event) => this.onPlayerInfoRefresh(event),
    );
  }

  private onPlayerInfoRefresh(event: { PlayerID: PlayerID }) {
    const playerId = event.PlayerID;
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: `/player/${steamId}/info`,
      querys: { include: 'member' },
      successFunc: (data) => PlayerInfoApi.RefreshSuccess(data, playerId),
      failureFunc: PlayerInfoApi.RefreshFailure,
    });
  }

  private static RefreshSuccess(data: string, playerId: PlayerID) {
    const player = json.decode(data)[0] as PlayerInfoDto;
    Player.MergePlayerInfo(player);
    // 会员状态可能变化（如刚购买 / 续费），同步刷新英雄上的会员 buff
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (hero) {
      MemberHelper.ApplyMemberModifier(hero);
    }
  }

  private static RefreshFailure(data: string) {
    print(`[PlayerInfo] Refresh failed: ${data}`);
  }
}
