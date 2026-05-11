import { MemberLevel, Player } from '../../api/player';
import { ModifierHelper } from './modifier-helper';
import { PlayerHelper } from './player-helper';

const MEMBER_NORMAL_MODIFIER = 'modifier_global_member_normal';
const MEMBER_PREMIUM_MODIFIER = 'modifier_global_member_premium';

export class MemberHelper {
  /**
   * 根据玩家当前会员等级，给英雄上对应等级的全局会员 buff。
   * 仅当英雄当前没有目标等级的 buff 时才添加；不主动移除已有 buff
   * （降级/失效场景概率极低，不做处理）。
   * 用于 npc_spawned 与 player_info_refresh 后同步会员状态到英雄身上。
   */
  static ApplyMemberModifier(hero: CDOTA_BaseNPC_Hero): void {
    if (!PlayerHelper.IsHumanPlayer(hero)) return;
    const steamAccountId = PlayerResource.GetSteamAccountID(hero.GetPlayerID());
    const memberLevel = Player.GetMemberLevel(steamAccountId);

    if (memberLevel === MemberLevel.NORMAL && !hero.HasModifier(MEMBER_NORMAL_MODIFIER)) {
      ModifierHelper.applyGlobalModifier(hero, MEMBER_NORMAL_MODIFIER);
    } else if (memberLevel === MemberLevel.PREMIUM && !hero.HasModifier(MEMBER_PREMIUM_MODIFIER)) {
      ModifierHelper.applyGlobalModifier(hero, MEMBER_PREMIUM_MODIFIER);
    }
  }
}
