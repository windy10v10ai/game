import { PropertyController } from '../modules/property/property_controller';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

export class PlayerPropertyApi {
  constructor() {
    // 玩家属性升级
    CustomGameEventManager.RegisterListener<{ name: string; level: string }>(
      'player_property_levelup',
      (_, event) => this.onPlayerPropertyLevelup(event),
    );
    // 玩家属性重置
    CustomGameEventManager.RegisterListener<{ useMemberPoint: number }>(
      'player_property_reset',
      (_, event) => this.onPlayerPropertyReset(event),
    );
  }

  // 英雄出生/升级时，把玩家属性应用到英雄
  public static SetPlayerProperty(hero: CDOTA_BaseNPC_Hero) {
    if (!hero) {
      return;
    }
    const steamId = PlayerResource.GetSteamAccountID(hero.GetPlayerOwnerID());
    const playerInfo = Player.playerInfoMap.get(steamId.toString());

    if (playerInfo?.properties) {
      for (const property of playerInfo.properties) {
        PropertyController.LevelupHeroProperty(hero, property);
      }
    }
  }

  /**
   * 把 properties 列表内的属性 modifier 应用到对应玩家。
   * 与 MergePlayerInfo 解耦：仅在 property 升级/重置回调中显式调用，避免会员等无关更新误触发。
   */
  public static ApplyPropertyModifiers(player: PlayerInfoDto) {
    if (!player.properties) return;
    for (const property of player.properties) {
      PropertyController.LevelupPlayerProperty(property);
    }
  }

  private onPlayerPropertyLevelup(event: { PlayerID: PlayerID; name: string; level: string }) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);

    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/property`,
      body: {
        name: event.name,
        level: +event.level,
      },
      successFunc: PlayerPropertyApi.PropertyLevelupSuccess,
      failureFunc: PlayerPropertyApi.PropertyLevelupFailure,
    });
  }

  private static PropertyLevelupSuccess(data: string) {
    const player = json.decode(data)[0] as PlayerInfoDto;
    Player.MergePlayerInfo(player);
    PlayerPropertyApi.ApplyPropertyModifiers(player);
  }

  private static PropertyLevelupFailure(_data: string) {
    // noop：失败不需要回写 net table，原值已经是最新
  }

  // 初始化属性，洗点
  private onPlayerPropertyReset(event: { PlayerID: PlayerID; useMemberPoint: number }) {
    const steamId = PlayerResource.GetSteamAccountID(event.PlayerID);

    ApiClient.sendWithRetry({
      method: HttpMethod.DELETE,
      path: `/player/${steamId}/property`,
      querys: { useMemberPoint: event.useMemberPoint === 1 ? 'true' : 'false' },
      successFunc: PlayerPropertyApi.PropertyResetSuccess,
      failureFunc: PlayerPropertyApi.PropertyResetFailure,
    });
  }

  private static PropertyResetSuccess(data: string) {
    print(`[PlayerProperty] Reset Success data ${data}`);
    const player = json.decode(data)[0] as PlayerInfoDto;

    // 必须在 merge 前移除：RemoveAllPlayerProperty 依赖现存 properties 列表定位 modifier。
    PropertyController.RemoveAllPlayerProperty(Number(player.id));
    Player.MergePlayerInfo(player);
    PlayerPropertyApi.ApplyPropertyModifiers(player);
  }

  private static PropertyResetFailure(data: string) {
    print(`[PlayerProperty] Reset Failure data ${data}`);
  }
}
