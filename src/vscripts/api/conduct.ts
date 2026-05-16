import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

export class ConductApi {
  constructor() {
    CustomGameEventManager.RegisterListener<{ toPlayerId: PlayerID; type: string }>(
      'player_conduct',
      (_, event) => this.onPlayerConduct(event),
    );
  }

  private onPlayerConduct(event: { PlayerID: PlayerID; toPlayerId: PlayerID; type: string }) {
    const fromPlayerId = event.PlayerID;
    const fromSteamId = PlayerResource.GetSteamAccountID(fromPlayerId);
    const toSteamId = PlayerResource.GetSteamAccountID(event.toPlayerId);
    const type = event.type;

    if (fromSteamId === 0 || toSteamId === 0) {
      print(`[ConductApi] Invalid steamId: from=${fromSteamId} to=${toSteamId}`);
      return;
    }
    if (fromSteamId === toSteamId) {
      print(`[ConductApi] Cannot conduct self`);
      return;
    }

    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: '/player/conduct',
      body: { fromSteamId, toSteamId, type },
      successFunc: (data) => ConductApi.onSuccess(data),
      failureFunc: (data) => print(`[ConductApi] Failed: ${data}`),
      retryTimes: 1,
    });
  }

  private static onSuccess(data: string) {
    const targetPlayer = json.decode(data) as unknown as PlayerInfoDto;
    Player.MergePlayerInfo(targetPlayer);
    print(`[ConductApi] Success, updated conductPoint=${targetPlayer.conductPoint}`);
  }
}
