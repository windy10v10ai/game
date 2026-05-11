import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerSetting } from './player';

export class PlayerSettingApi {
  constructor() {
    // 发送快捷键设置
    CustomGameEventManager.RegisterListener<SaveBindAbilityKeyEventData>(
      'save_bind_ability_key',
      (_, event) => this.SendBindAbilityKey(event),
    );
  }

  private SendBindAbilityKey(
    event: NetworkedData<SaveBindAbilityKeyEventData & { PlayerID: PlayerID }>,
  ) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const playerSetting: PlayerSetting = {
      isRememberAbilityKey: event.isRememberAbilityKey === 1,
      activeAbilityKey: event.activeAbilityKey,
      passiveAbilityKey: event.passiveAbilityKey,
      passiveAbilityKey2: event.passiveAbilityKey2,
      activeAbilityQuickCast: event.activeAbilityQuickCast === 1,
      passiveAbilityQuickCast: event.passiveAbilityQuickCast === 1,
      passiveAbilityQuickCast2: event.passiveAbilityQuickCast2 === 1,
    };

    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/setting`,
      body: playerSetting,
      successFunc: (data: string) => {
        const updatedSetting = json.decode(data)[0] as PlayerSetting;
        Player.MergePlayerInfo({ id: steamId.toString(), playerSetting: updatedSetting });
      },
    });
  }
}
