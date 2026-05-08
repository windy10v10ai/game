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
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: `/player/${steamId}/info`,
      querys: { include: 'member' },
      successFunc: PlayerInfoApi.RefreshSuccess,
      failureFunc: PlayerInfoApi.RefreshFailure,
    });
  }

  private static RefreshSuccess(data: string) {
    const player = json.decode(data)[0] as PlayerInfoDto;
    Player.MergePlayerInfo(player);
  }

  private static RefreshFailure(data: string) {
    print(`[PlayerInfo] Refresh failed: ${data}`);
  }
}
