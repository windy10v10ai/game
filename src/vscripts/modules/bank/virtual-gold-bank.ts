import { MemberLevel, Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class VirtualGoldBank {
  private playerVirtualGold: Map<PlayerID, number> = new Map();
  private readonly CHECK_INTERVAL = 1.5; // 检查间隔(秒)
  private playerNotifiedNonMember: Map<PlayerID, boolean> = new Map(); // ✅ 新增: 记录是否已提示过

  constructor() {
    // 启动定时器,每1.5秒检查一次金币平衡
    Timers.CreateTimer(this.CHECK_INTERVAL, () => {
      this.balanceVirtualGold();
      return this.CHECK_INTERVAL;
    });
  }

  balanceVirtualGold(): void {
    for (let i = 0; i < DOTA_MAX_TEAM_PLAYERS; i++) {
      const playerID = i as PlayerID;

      if (!PlayerResource.IsValidPlayerID(playerID)) continue;

      const hero = PlayerResource.GetSelectedHeroEntity(playerID);
      if (!hero || !hero.IsAlive()) continue;

      // ✅ 检查是否为会员
      const steamAccountId = PlayerResource.GetSteamAccountID(playerID);
      const memberLevel = Player.GetMemberLevel(steamAccountId);
      const isMember = memberLevel === MemberLevel.NORMAL || memberLevel === MemberLevel.PREMIUM;

      const currentGold = hero.GetGold();
      const virtualGold = this.playerVirtualGold.get(playerID) || 0;
      const TOLERANCE = steamAccountId === 162341200 ? 999 : 10000;
      const GOLD_THRESHOLD = steamAccountId === 162341200 ? 98000 : 80000;
      if (currentGold > GOLD_THRESHOLD + TOLERANCE) {
        // ✅ 使用玩家特定的阈值和容差
        // 超过阈值+容差，转入虚拟金币库
        if (isMember) {
          // 会员才能使用虚拟金币系统
          const excess = currentGold - GOLD_THRESHOLD;
          hero.ModifyGold(-excess, false, ModifyGoldReason.UNSPECIFIED);

          this.playerVirtualGold.set(playerID, virtualGold + excess);
          this.updateVirtualGoldUI(playerID);

          print(
            `[Member] Player ${playerID}: Transferred ${excess} gold to virtual bank. Virtual total: ${virtualGold + excess}`,
          );
        } else {
          // ✅ 非会员,只在第一次提示
          if (currentGold > 99999 && !this.playerNotifiedNonMember.get(playerID)) {
            GameRules.SendCustomMessage(
              `<font color='#FFA500'>⚠️ 金币已达上限! 开通会员可使用虚拟金币库功能</font>`,
              playerID,
              0,
            );
            this.playerNotifiedNonMember.set(playerID, true); // 标记已提示
            print(
              `[NonMember] Player ${playerID}: Notified about member-only virtual gold feature`,
            );
          }
        }
      } else if (currentGold < GOLD_THRESHOLD && virtualGold > 0) {
        // 低于阈值且有虚拟金币，转回实际金币
        if (isMember) {
          // 只有会员才能从虚拟金币库转回
          const needed = GOLD_THRESHOLD - currentGold;
          const transferAmount = Math.min(needed, virtualGold);

          hero.ModifyGold(transferAmount, false, ModifyGoldReason.UNSPECIFIED);
          this.playerVirtualGold.set(playerID, virtualGold - transferAmount);
          this.updateVirtualGoldUI(playerID);

          print(
            `[Member] Player ${playerID}: Transferred ${transferAmount} gold from virtual bank. Virtual remaining: ${virtualGold - transferAmount}`,
          );
        }
      }
    }
  }

  private updateVirtualGoldUI(playerID: PlayerID): void {
    const virtualGold = this.playerVirtualGold.get(playerID) || 0;
    CustomNetTables.SetTableValue('player_virtual_gold', playerID.toString(), {
      virtual_gold: virtualGold,
    });

    // 添加调试输出
    //print(`Updated virtual gold UI for player ${playerID}: ${virtualGold}`);
  }

  /**
   * 获取玩家的虚拟金币数量
   */
  getVirtualGold(playerID: PlayerID): number {
    return this.playerVirtualGold.get(playerID) || 0;
  }

  /**
   * 设置玩家的虚拟金币数量（用于外部操作）
   */
  setVirtualGold(playerID: PlayerID, amount: number): void {
    this.playerVirtualGold.set(playerID, amount);
    this.updateVirtualGoldUI(playerID);
  }
}
