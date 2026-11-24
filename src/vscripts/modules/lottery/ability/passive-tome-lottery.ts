import { LotteryDto } from '../../../../common/dto/lottery';
import { Player } from '../../../api/player';
import { PlayerMemberPointApi } from '../../../api/player-member-point';
import { reloadable } from '../../../utils/tstl-utils';
import { AbilityLotteryHelper } from './ability-lottery-helper';
import { abilityTiersPassive } from './lottery-abilities';

interface PassiveTomeState {
  candidates: LotteryDto[];
  isRefreshed: boolean;
  paidRefreshCount: number;
  forgetting: boolean;
}

/**
 * 被动技能书抽奖：使用技能书触发后弹 4 选 1，倒计时由客户端驱动，归零自动随机选 1。
 * 同时记录每名玩家学到的被动，供遗忘技能书选择。
 */
@reloadable
export class PassiveTomeLottery {
  static readonly CANDIDATE_COUNT = 4;
  static readonly MAX_USAGE = 2;
  static readonly PAID_REFRESH_COSTS = [10, 20, 30, 50];
  static readonly MAX_PAID_REFRESH_COUNT = 5;

  private readonly usageCount = new Map<PlayerID, number>();
  private readonly ownedAbilities = new Map<PlayerID, string[]>();
  private readonly pendingForgetItem = new Map<PlayerID, CDOTA_Item>();

  constructor() {
    CustomGameEventManager.RegisterListener('lottery_pick_passive_tome', (_userId, event) => {
      this.pickAbility(event.PlayerID, event);
    });
    CustomGameEventManager.RegisterListener('lottery_refresh_passive_tome', (_userId, event) => {
      this.refreshAbility(event.PlayerID);
    });
    CustomGameEventManager.RegisterListener('lottery_forget_passive_tome', (_userId, event) => {
      this.forgetAbility(event.PlayerID, event.name);
    });
    CustomGameEventManager.RegisterListener(
      'lottery_cancel_forget_passive_tome',
      (_userId, event) => {
        this.cancelForget(event.PlayerID);
      },
    );
  }

  static getPaidRefreshCost(paidCount: number): number {
    const index = Math.min(paidCount, PassiveTomeLottery.PAID_REFRESH_COSTS.length - 1);
    return PassiveTomeLottery.PAID_REFRESH_COSTS[index];
  }

  isUsageLimitReached(playerId: PlayerID): boolean {
    return (this.usageCount.get(playerId) ?? 0) >= PassiveTomeLottery.MAX_USAGE;
  }

  hasOwnedAbility(playerId: PlayerID): boolean {
    return (this.ownedAbilities.get(playerId) ?? []).length > 0;
  }

  onTriggered(hero: CDOTA_BaseNPC_Hero): void {
    const playerId = hero.GetPlayerOwnerID();
    if (playerId < 0) return;

    this.usageCount.set(playerId, (this.usageCount.get(playerId) ?? 0) + 1);
    const candidates = AbilityLotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      PassiveTomeLottery.CANDIDATE_COUNT,
      hero,
      [],
      true,
    );
    this.publish(playerId, {
      candidates,
      isRefreshed: false,
      paidRefreshCount: 0,
      forgetting: false,
    });
  }

  pickAbility(playerId: PlayerID, event: LotteryPickItemEventData): void {
    const state = this.read(playerId);
    if (state === undefined) {
      print('[PassiveTomeLottery] no pending lottery for player ' + playerId);
      return;
    }
    const matched = state.candidates.find((c) => c.name === event.name && c.level === event.level);
    if (!matched) {
      print('[PassiveTomeLottery] candidate not found for player ' + playerId + ': ' + event.name);
      return;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[PassiveTomeLottery] hero not found for player ' + playerId);
      return;
    }

    hero.AddAbility(matched.name);
    const owned = this.ownedAbilities.get(playerId) ?? [];
    owned.push(matched.name);
    this.ownedAbilities.set(playerId, owned);
    print('[PassiveTomeLottery] player ' + playerId + ' picked ' + matched.name);

    // 清空候选（写空数组，客户端 candidates.length === 0 → UI collapse）。
    // 不能传 nil：Dota 引擎对 SetTableValue 传 nil 是 noop，不会删除行。
    this.publish(playerId, {
      candidates: [],
      isRefreshed: false,
      paidRefreshCount: 0,
      forgetting: state.forgetting,
    });
  }

  refreshAbility(playerId: PlayerID): void {
    const state = this.read(playerId);
    if (state === undefined || state.candidates.length === 0) {
      print('[PassiveTomeLottery] refresh denied, no pending lottery, player ' + playerId);
      return;
    }

    const steamAccountID = PlayerResource.GetSteamAccountID(playerId);
    if (state.isRefreshed) {
      if (state.paidRefreshCount >= PassiveTomeLottery.MAX_PAID_REFRESH_COUNT) {
        print('[PassiveTomeLottery] refresh denied, limit reached, player ' + playerId);
        return;
      }
      const cost = PassiveTomeLottery.getPaidRefreshCost(state.paidRefreshCount);
      if (Player.GetUseableMemberPoint(steamAccountID) < cost) {
        print('[PassiveTomeLottery] refresh denied, insufficient points, player ' + playerId);
        return;
      }
      Player.DeductUseableMemberPoint(steamAccountID, cost);
      PlayerMemberPointApi.UseMemberPoint(steamAccountID, cost, 'lottery_refresh_passive_tome');
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const candidates = AbilityLotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      PassiveTomeLottery.CANDIDATE_COUNT,
      hero,
      state.candidates.map((c) => c.name),
      true,
    );
    this.publish(playerId, {
      candidates,
      isRefreshed: true,
      paidRefreshCount: state.isRefreshed ? state.paidRefreshCount + 1 : 0,
      forgetting: state.forgetting,
    });
  }

  /** 遗忘技能书使用：打开选择窗口，书在玩家确认遗忘后才消耗 */
  openForget(hero: CDOTA_BaseNPC_Hero, item: CDOTA_Item): void {
    const playerId = hero.GetPlayerOwnerID();
    if (playerId < 0 || !this.hasOwnedAbility(playerId)) return;

    this.pendingForgetItem.set(playerId, item);
    const state = this.read(playerId);
    this.publish(playerId, {
      candidates: state?.candidates ?? [],
      isRefreshed: state?.isRefreshed ?? false,
      paidRefreshCount: state?.paidRefreshCount ?? 0,
      forgetting: true,
    });
  }

  cancelForget(playerId: PlayerID): void {
    this.pendingForgetItem.delete(playerId);
    const state = this.read(playerId);
    if (state === undefined || !state.forgetting) return;
    this.publish(playerId, { ...state, forgetting: false });
  }

  forgetAbility(playerId: PlayerID, name: string): void {
    const state = this.read(playerId);
    const owned = this.ownedAbilities.get(playerId) ?? [];
    const index = owned.indexOf(name);
    const item = this.pendingForgetItem.get(playerId);
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (state === undefined || !state.forgetting || index < 0 || !hero) {
      print('[PassiveTomeLottery] forget denied for player ' + playerId + ': ' + name);
      return;
    }
    if (item === undefined || !IsValidEntity(item)) {
      print('[PassiveTomeLottery] forget denied, tome item gone, player ' + playerId);
      this.cancelForget(playerId);
      return;
    }

    const ability = hero.FindAbilityByName(name);
    if (ability) {
      const level = ability.GetLevel();
      // 先销毁该技能产生的全部 modifier，避免 RemoveAbility 后法球、光环等效果残留
      for (const modifier of hero.FindAllModifiers()) {
        if (modifier.GetAbility()?.GetAbilityName() === name) {
          modifier.Destroy();
        }
      }
      hero.RemoveAbility(name);
      if (level > 0) {
        hero.SetAbilityPoints(hero.GetAbilityPoints() + level);
      }
    }
    owned.splice(index, 1);
    this.usageCount.set(playerId, Math.max(0, (this.usageCount.get(playerId) ?? 0) - 1));
    print('[PassiveTomeLottery] player ' + playerId + ' forgot ' + name);

    item.SpendCharge(1);
    if (item.GetCurrentCharges() === 0) {
      item.RemoveSelf();
    }
    this.pendingForgetItem.delete(playerId);
    this.publish(playerId, { ...state, forgetting: false });
  }

  private read(playerId: PlayerID): PassiveTomeState | undefined {
    const raw = CustomNetTables.GetTableValue('lottery_passive_tome', playerId.toString());
    if (!raw) return undefined;
    // TSTL 把 array 编码成 object 同步给客户端，读回时也是 object，按值列出
    // boolean 写入后引擎可能同步为 0/1，宽松匹配两种值
    const refreshed = raw.isRefreshed as unknown as boolean | number | undefined;
    const forgetting = raw.forgetting as unknown as boolean | number | undefined;
    return {
      candidates: Object.values(raw.candidates ?? {}) as unknown as LotteryDto[],
      isRefreshed: refreshed === true || refreshed === 1,
      paidRefreshCount: raw.paidRefreshCount ?? 0,
      forgetting: forgetting === true || forgetting === 1,
    };
  }

  private publish(playerId: PlayerID, state: PassiveTomeState): void {
    CustomNetTables.SetTableValue('lottery_passive_tome', playerId.toString(), {
      candidates: state.candidates,
      isRefreshed: state.isRefreshed,
      paidRefreshCount: state.paidRefreshCount,
      forgetting: state.forgetting,
      owned: [...(this.ownedAbilities.get(playerId) ?? [])],
    });
  }
}
