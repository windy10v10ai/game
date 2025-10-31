import { MemberLevel, Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class VirtualGoldBank {
  private playerVirtualGold: Map<PlayerID, number> = new Map();
  private playerTransferredBackTotal: Map<PlayerID, number> = new Map(); // 记录从虚拟金币库转回的总额
  private readonly CHECK_INTERVAL = 1.5; // 检查间隔(秒)
  private readonly GOLD_THRESHOLD = 80000;

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

      const currentGold = hero.GetGold();
      const virtualGold = this.playerVirtualGold.get(playerID) || 0;
      const isPremiumMember = this.isPremiumMember(playerID);

      if (!isPremiumMember) {
        continue;
      }

      if (currentGold > this.GOLD_THRESHOLD) {
        // 超过阈值+容差，转入虚拟金币库
        this.transferToVirtualBank(playerID, hero, currentGold, virtualGold);
      } else if (currentGold < this.GOLD_THRESHOLD && virtualGold > 0) {
        // 低于阈值且有虚拟金币，转回实际金币
        this.transferFromVirtualBank(playerID, hero, currentGold, virtualGold);
      }
    }
  }

  /**
   * 检查玩家是否为高级会员
   */
  private isPremiumMember(playerID: PlayerID): boolean {
    const steamAccountId = PlayerResource.GetSteamAccountID(playerID);
    const memberLevel = Player.GetMemberLevel(steamAccountId);
    return memberLevel === MemberLevel.PREMIUM;
  }

  /**
   * 将超出阈值的金币转入虚拟金币库（仅限会员）
   */
  transferToVirtualBank(
    playerID: PlayerID,
    hero: CDOTA_BaseNPC_Hero,
    currentGold: number,
    virtualGold: number,
  ): void {
    const excess = currentGold - this.GOLD_THRESHOLD;
    hero.ModifyGold(-excess, false, ModifyGoldReason.UNSPECIFIED);

    this.playerVirtualGold.set(playerID, virtualGold + excess);
    this.updateVirtualGoldUI(playerID);

    print(
      `[Member] Player ${playerID}: Transferred ${excess} gold to virtual bank. Virtual total: ${virtualGold + excess}`,
    );
  }

  /**
   * 从虚拟金币库转回实际金币（仅限会员）
   */
  transferFromVirtualBank(
    playerID: PlayerID,
    hero: CDOTA_BaseNPC_Hero,
    currentGold: number,
    virtualGold: number,
  ): void {
    const needed = this.GOLD_THRESHOLD - currentGold;
    const transferAmount = Math.min(needed, virtualGold);

    hero.ModifyGold(transferAmount, false, ModifyGoldReason.UNSPECIFIED);
    this.playerVirtualGold.set(playerID, virtualGold - transferAmount);

    // 累加转回的总金额
    const currentTransferTotal = this.playerTransferredBackTotal.get(playerID) || 0;
    this.playerTransferredBackTotal.set(playerID, currentTransferTotal + transferAmount);

    this.updateVirtualGoldUI(playerID);

    print(
      `[Member] Player ${playerID}: Transferred ${transferAmount} gold from virtual bank. Virtual remaining: ${virtualGold - transferAmount}, Total transferred back: ${currentTransferTotal + transferAmount}`,
    );
  }

  private updateVirtualGoldUI(playerID: PlayerID): void {
    const virtualGold = this.playerVirtualGold.get(playerID) || 0;
    const transferredBackTotal = this.playerTransferredBackTotal.get(playerID) || 0;
    CustomNetTables.SetTableValue('player_virtual_gold', playerID.toString(), {
      virtual_gold: virtualGold,
      transferred_back_total: transferredBackTotal,
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
