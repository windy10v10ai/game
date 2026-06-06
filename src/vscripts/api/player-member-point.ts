import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

/**
 * 消耗可用会员积分。fire-and-forget：调用方在发请求前已乐观更新本地状态，
 * 这里只负责发请求并用回包的服务端真实积分纠正本地值（绝大多数情况扣分成功）。
 */
export class PlayerMemberPointApi {
  public static UseMemberPoint(steamId: number, memberPoint: number, reason: string) {
    ApiClient.sendWithRetry({
      method: HttpMethod.POST,
      path: `/player/member-points/use`,
      body: {
        steamId,
        memberPoint,
        reason,
      },
      successFunc: (data) => {
        const player = json.decode(data)[0] as PlayerInfoDto;
        Player.MergePlayerInfo(player);
      },
      failureFunc: (data) => {
        print(`[PlayerMemberPoint] UseMemberPoint failed: ${data}`);
      },
    });
  }
}
