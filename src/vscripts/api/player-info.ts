import { AwakenHelper } from '../modules/helper/awaken-helper';
import { MemberHelper } from '../modules/helper/member-helper';
import { PropertyController } from '../modules/property/property_controller';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';
import { PlayerPropertyApi } from './player-property';

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
      querys: { include: 'member,property,heroAwakening' },
      successFunc: (data) => PlayerInfoApi.RefreshSuccess(data, playerId, steamId),
      failureFunc: PlayerInfoApi.RefreshFailure,
    });
  }

  /** 同步网站上的会员，加点与觉醒改动，并立即作用到当前英雄 */
  private static RefreshSuccess(data: string, playerId: PlayerID, steamId: number) {
    const player = json.decode(data)[0] as PlayerInfoDto;
    const previousProperties = Player.playerInfoMap.get(player.id)?.properties ?? [];
    const propertiesChanged = !PlayerInfoApi.HasSamePropertyLevels(
      previousProperties,
      player.properties ?? [],
    );

    // 属性未变时不重挂，避免只刷新会员也去卸装英雄身上的属性效果
    if (propertiesChanged) {
      // 必须在 merge 前移除：依赖现存 properties 列表定位 modifier
      PropertyController.RemoveAllPlayerProperty(steamId);
    }
    Player.MergePlayerInfo(player);
    if (propertiesChanged) {
      PlayerPropertyApi.ApplyPropertyModifiers(player);
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (hero) {
      MemberHelper.ApplyMemberModifier(hero);
      AwakenHelper.ApplyUnlockedAwaken(hero, steamId);
    }
  }

  private static HasSamePropertyLevels(
    a: { name: string; level: number }[],
    b: { name: string; level: number }[],
  ): boolean {
    if (a.length !== b.length) return false;
    return a.every((pa) => b.some((pb) => pb.name === pa.name && pb.level === pa.level));
  }

  private static RefreshFailure(data: string) {
    print(`[PlayerInfo] Refresh failed: ${data}`);
  }
}
