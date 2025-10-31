import { MemberLevel, Player } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class GoldXPFilter {
  private playerVirtualGold: Map<PlayerID, number> = new Map();
  private readonly CHECK_INTERVAL = 1.5; // 检查间隔(秒)
  private playerNotifiedNonMember: Map<PlayerID, boolean> = new Map(); // ✅ 新增: 记录是否已提示过

  constructor() {
    GameRules.GetGameModeEntity().SetModifyGoldFilter((args) => this.filterGold(args), this);
    GameRules.GetGameModeEntity().SetModifyExperienceFilter((args) => this.filterXP(args), this);
    // 启动定时器,每3秒检查一次金币平衡
    Timers.CreateTimer(this.CHECK_INTERVAL, () => {
      this.balanceVirtualGold();
      return this.CHECK_INTERVAL;
    });
  }

  private balanceVirtualGold(): void {
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

  readonly GOLD_REASON_NOT_FILTER: ModifyGoldReason[] = [
    ModifyGoldReason.UNSPECIFIED,
    ModifyGoldReason.DEATH,
    ModifyGoldReason.BUYBACK,
    ModifyGoldReason.PURCHASE_CONSUMABLE,
    ModifyGoldReason.PURCHASE_ITEM,
    ModifyGoldReason.ABANDONED_REDISTRIBUTE,
    ModifyGoldReason.SELL_ITEM,
    ModifyGoldReason.ABILITY_COST,
    ModifyGoldReason.CHEAT_COMMAND,
    ModifyGoldReason.SELECTION_PENALTY,
    ModifyGoldReason.GAME_TICK,

    // ModifyGoldReason.BUILDING,
    // ModifyGoldReason.HERO_KILL,
    // ModifyGoldReason.CREEP_KILL,
    // ModifyGoldReason.NEUTRAL_KILL,
    // ModifyGoldReason.ROSHAN_KILL,
    // ModifyGoldReason.COURIER_KILL,
    // ModifyGoldReason.BOUNTY_RUNE,
    // ModifyGoldReason.SHARED_GOLD,
    // ModifyGoldReason.ABILITY_GOLD,
    // ModifyGoldReason.WARD_KILL,
    // ModifyGoldReason.COURIER_KILLED_BY_THIS_PLAYER,
  ];

  private filterGold(args: ModifyGoldFilterEvent): boolean {
    let gold = args.gold;
    const playerID = args.player_id_const;
    const reason = args.reason_const;
    let mul = this.getPlayerGoldXpMultiplier(playerID);

    if (this.GOLD_REASON_NOT_FILTER.includes(reason)) {
      return true;
    }
    if (this.GOLD_REASON_NOT_FILTER.includes(reason)) {
      return true;
    }

    if (reason === ModifyGoldReason.HERO_KILL) {
      gold = this.filterHeroKillGold(gold);

      gold = gold * this.rewardFilterByKill(playerID);
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    args.gold = Math.floor(gold * mul);

    return true;
  }

  filterHeroKillGold(gold: number): number {
    if (gold > 3200) {
      return gold / 8 + 1000;
    } else if (gold > 1600) {
      return gold / 4 + 600;
    } else if (gold > 400) {
      return gold / 2 + 200;
    } else {
      return gold * 1;
    }
  }

  private filterXP(args: ModifyExperienceFilterEvent): boolean {
    const xp = args.experience;
    const playerID = args.player_id_const;
    const reason = args.reason_const;
    let mul = this.getPlayerGoldXpMultiplier(playerID);

    if (reason === ModifyXpReason.HERO_KILL) {
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    args.experience = Math.floor(xp * mul);

    return true;
  }

  /**
   * 根据玩家的击杀数相对于团队总击杀数计算奖励倍数。
   * 击杀数较多的玩家获得的奖励更少，击杀数较少的玩家获得的奖励更多。
   *
   * @param playerID - 要计算奖励倍数的玩家ID。
   * @returns 玩家奖励倍数。如果团队总击杀数小于10，倍数为1；
   *          否则，倍数根据玩家的击杀数与团队总击杀数计算得出。
   */
  rewardFilterByKill(playerID: PlayerID): number {
    const playerKill = PlayerResource.GetKills(playerID);
    const teamKill = PlayerResource.GetTeamKills(PlayerResource.GetTeam(playerID));
    const teamCount = PlayerResource.GetPlayerCountForTeam(PlayerResource.GetTeam(playerID));

    let rewardMulti = 1;
    if (teamKill < 10) {
      return rewardMulti;
    }
    rewardMulti = 1 + (1 / teamCount - playerKill / teamKill) / 2;
    return rewardMulti;
  }

  getPlayerGoldXpMultiplier(playerID: PlayerID): number {
    let mul = 1;

    if (PlayerHelper.IsGoodTeamPlayer(playerID)) {
      mul = GameRules.Option.radiantGoldXpMultiplier;
    } else {
      mul = GameRules.Option.direGoldXpMultiplier;
    }

    return mul;
  }

  /**
   * 降低高倍率时，击杀英雄的金钱奖励。
   *
   * @param mul - The original gold multiplier.
   * @returns The adjusted gold multiplier.
   */
  filterHeroKillGoldByMultiplier(mul: number): number {
    if (mul <= 1) {
      return mul;
    }
    const reduceRate = 0.5;
    return 1 + (mul - 1) * reduceRate;
  }
}
