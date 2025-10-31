import { Analytics } from '../../api/analytics/analytics';
import { MemberLevel, Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class VirtualGoldBank {
  private playerVirtualGold: Map<PlayerID, number> = new Map();
  private readonly CHECK_INTERVAL = 1.5; // 检查间隔(秒)
  private playerNotifiedNonMember: Map<PlayerID, boolean> = new Map(); // 记录是否已提示过
  private readonly GOLD_THRESHOLD = 80000;
  private readonly TOLERANCE = 10000;

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

      // 检查是否为高级会员，高级会员及才能使用虚拟金币系统
      const steamAccountId = PlayerResource.GetSteamAccountID(playerID);
      const memberLevel = Player.GetMemberLevel(steamAccountId);
      const isPremiumMember = memberLevel === MemberLevel.PREMIUM;

      const currentGold = hero.GetGold();
      const virtualGold = this.playerVirtualGold.get(playerID) || 0;
      if (currentGold > this.GOLD_THRESHOLD + this.TOLERANCE) {
        // 使用玩家特定的阈值和容差
        // 超过阈值+容差，转入虚拟金币库
        if (isPremiumMember) {
          const excess = currentGold - this.GOLD_THRESHOLD;
          hero.ModifyGold(-excess, false, ModifyGoldReason.UNSPECIFIED);

          this.playerVirtualGold.set(playerID, virtualGold + excess);
          this.updateVirtualGoldUI(playerID);

          print(
            `[Member] Player ${playerID}: Transferred ${excess} gold to virtual bank. Virtual total: ${virtualGold + excess}`,
          );
        } else {
          // 非会员,只在第一次提示
          if (currentGold > 99999 && !this.playerNotifiedNonMember.get(playerID)) {
            const message =
              Analytics.PLAYER_LANGUAGES.players.find((player) => player.steamId === steamAccountId)
                ?.language === 'schinese'
                ? '金币已达上限! 开通高级会员可使用虚拟金币库功能'
                : 'Gold limit reached! Open premium membership to use virtual gold bank';
            GameRules.SendCustomMessage(`<font color='#FFA500'>⚠️ ${message}</font>`, playerID, 0);
            this.playerNotifiedNonMember.set(playerID, true); // 标记已提示
            print(
              `[NonMember] Player ${playerID}: Notified about member-only virtual gold feature`,
            );
          }
        }
      } else if (currentGold < this.GOLD_THRESHOLD && virtualGold > 0) {
        // 低于阈值且有虚拟金币，转回实际金币
        if (isPremiumMember) {
          // 只有会员才能从虚拟金币库转回
          const needed = this.GOLD_THRESHOLD - currentGold;
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
