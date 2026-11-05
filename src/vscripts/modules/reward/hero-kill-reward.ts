import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

// 助攻经验以受害者死亡经验为基准
const ASSIST_XP_RATE = 0.3;

// 击杀者周围这个范围内有敌方防御塔，或没有其他友方真人，就不算安全的以多打少
const NEARBY_RADIUS = 1500;

// 助攻事件与死亡事件的先后顺序由引擎决定，短暂缓冲后仍能配到同一次击杀
const ORPHAN_ASSIST_TTL = 1;

/** 每名助攻者额外获得的经验。 */
export function assistXpReward(deathXp: number): number {
  return Math.floor(deathXp * ASSIST_XP_RATE);
}

/** 补发经验要经过经验过滤器，按当前倍率折算成过滤器输入值，落地后正好是扣掉的量。 */
export function refundKillXpInput(cutXp: number, mul: number): number {
  return mul > 0 ? Math.round(cutXp / mul) : cutXp;
}

/** 被扣的击杀奖励是否补回：满足条件时全部补回，否则只保留击杀者自己的那份。 */
export function shouldRefundCut(
  restoreReward: boolean,
  cutPlayerId: PlayerID,
  killerPlayerId: PlayerID | undefined,
): boolean {
  return restoreReward || cutPlayerId !== killerPlayerId;
}

interface PendingKill {
  killerPlayerId: PlayerID | undefined;
  deathXp: number;
  deathAt: number;
  restoreReward: boolean;
  assisters: Set<PlayerID>;
}

interface OrphanAssist {
  assisterPlayerId: PlayerID;
  at: number;
}

/**
 * 多人局的助攻与击杀收益：助攻者额外拿经验，击杀者前期击杀金币与经验按附近塔和真人情况决定是否减半。
 * 引擎在金币/经验过滤器之后才给出击杀信息，所以衰减在过滤器里做，这里只做击杀后的补回。
 */
@reloadable
export class HeroKillReward {
  private readonly SETTLE_DELAY = 0.3;

  private readonly pendingKills = new Map<PlayerID, PendingKill>();
  private readonly orphanAssists = new Map<PlayerID, OrphanAssist[]>();

  constructor() {
    ListenToGameEvent('entity_killed', (keys) => this.OnEntityKilled(keys), this);
    ListenToGameEvent('dota_assist_earned', (keys) => this.OnAssistEarned(keys), this);
  }

  private OnEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    if (!PlayerHelper.IsMultiplayerGame() || !keys.entindex_killed) {
      return;
    }
    const victim = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC_Hero | undefined;
    if (!victim || !victim.IsRealHero() || victim.IsReincarnating()) {
      return;
    }
    const victimPlayerId = victim.GetPlayerID();
    if (victimPlayerId < 0) {
      return;
    }

    const killerPlayerId = this.getKillerPlayerId(keys, victim);
    const pending: PendingKill = {
      killerPlayerId,
      deathXp: victim.GetDeathXP(),
      deathAt: GameRules.GetGameTime(),
      restoreReward: this.canRestoreReward(killerPlayerId),
      assisters: new Set<PlayerID>(),
    };
    this.pendingKills.set(victimPlayerId, pending);

    this.consumeOrphanAssists(victimPlayerId, pending);
    Timers.CreateTimer(this.SETTLE_DELAY, () => this.settleKillRewards(victimPlayerId));
  }

  private OnAssistEarned(keys: GameEventProvidedProperties & DotaAssistEarnedEvent): void {
    if (!PlayerHelper.IsMultiplayerGame() || !keys.entindex_hero) {
      return;
    }
    const assister = EntIndexToHScript(keys.entindex_hero) as CDOTA_BaseNPC_Hero | undefined;
    if (!assister || !assister.IsRealHero()) {
      return;
    }
    const assisterPlayerId = assister.GetPlayerOwnerID();
    if (assisterPlayerId < 0) {
      return;
    }

    const pending = this.pendingKills.get(keys.playerid_victim);
    if (pending === undefined) {
      this.bufferOrphanAssist(keys.playerid_victim, assisterPlayerId);
      return;
    }
    this.rewardAssist(pending, assisterPlayerId);
  }

  private getKillerPlayerId(
    keys: GameEventProvidedProperties & EntityKilledEvent,
    victim: CDOTA_BaseNPC_Hero,
  ): PlayerID | undefined {
    if (!keys.entindex_attacker) {
      return undefined;
    }
    const attacker = EntIndexToHScript(keys.entindex_attacker) as CDOTA_BaseNPC | undefined;
    if (!attacker) {
      return undefined;
    }
    const killerPlayerId = attacker.GetPlayerOwnerID();
    if (killerPlayerId < 0) {
      return undefined;
    }
    const victimPlayerId = victim.GetPlayerID();
    if (
      killerPlayerId === victimPlayerId ||
      PlayerResource.GetTeam(killerPlayerId) === PlayerResource.GetTeam(victimPlayerId)
    ) {
      return undefined;
    }
    return killerPlayerId;
  }

  // 击杀者周围没有敌方防御塔、且有其他友方真人玩家一起，才按原收益结算；否则前期击杀奖励减半
  private canRestoreReward(killerPlayerId: PlayerID | undefined): boolean {
    if (killerPlayerId === undefined) {
      return false;
    }
    const killer = PlayerResource.GetSelectedHeroEntity(killerPlayerId);
    if (!killer || !killer.IsAlive()) {
      return false;
    }
    if (this.hasEnemyTowerNearby(killer)) {
      return false;
    }
    return this.hasFriendlyHumanNearby(killerPlayerId, killer);
  }

  private hasEnemyTowerNearby(killer: CDOTA_BaseNPC): boolean {
    const towers = FindUnitsInRadius(
      killer.GetTeamNumber(),
      killer.GetAbsOrigin(),
      undefined,
      NEARBY_RADIUS,
      UnitTargetTeam.ENEMY,
      UnitTargetType.BUILDING,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    return towers.some((tower) => tower.IsTower() && tower.IsAlive());
  }

  private hasFriendlyHumanNearby(killerPlayerId: PlayerID, killer: CDOTA_BaseNPC): boolean {
    let found = false;
    PlayerHelper.ForEachPlayer((playerId) => {
      if (found || playerId === killerPlayerId) {
        return;
      }
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      if (PlayerResource.GetTeam(playerId) !== killer.GetTeamNumber()) {
        return;
      }
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero || !hero.IsAlive()) {
        return;
      }
      if (hero.GetAbsOrigin().__sub(killer.GetAbsOrigin()).Length2D() <= NEARBY_RADIUS) {
        found = true;
      }
    });
    return found;
  }

  private rewardAssist(pending: PendingKill, assisterPlayerId: PlayerID): void {
    if (pending.killerPlayerId === undefined || assisterPlayerId === pending.killerPlayerId) {
      return;
    }
    if (pending.assisters.has(assisterPlayerId)) {
      return;
    }
    pending.assisters.add(assisterPlayerId);

    const hero = PlayerResource.GetSelectedHeroEntity(assisterPlayerId);
    if (!hero) {
      return;
    }

    const xp = assistXpReward(pending.deathXp);
    if (xp > 0) {
      hero.AddExperience(xp, ModifyXpReason.HERO_KILL, false, true, 0);
    }
  }

  private settleKillRewards(victimPlayerId: PlayerID): void {
    const pending = this.pendingKills.get(victimPlayerId);
    if (pending === undefined) {
      return;
    }
    this.pendingKills.delete(victimPlayerId);

    this.refundKillGold(pending);
    this.refundKillXp(pending);
  }

  // 过滤器分不出击杀者，先把拿到击杀金币的人整体扣一半；这里把队友补回，击杀者只在满足条件时补满
  private refundKillGold(pending: PendingKill): void {
    for (const cut of GameRules.GoldXPFilter.TakeKillGoldCuts(pending.deathAt - 0.5)) {
      if (!shouldRefundCut(pending.restoreReward, cut.playerId, pending.killerPlayerId)) {
        continue;
      }
      const hero = PlayerResource.GetSelectedHeroEntity(cut.playerId);
      if (!hero) {
        continue;
      }
      hero.ModifyGold(cut.gold, true, ModifyGoldReason.UNSPECIFIED);
    }
  }

  // 经验同理：队友补回原值，击杀者保留一半的扣减
  private refundKillXp(pending: PendingKill): void {
    for (const cut of GameRules.GoldXPFilter.TakeKillXpCuts(pending.deathAt - 0.5)) {
      if (!shouldRefundCut(pending.restoreReward, cut.playerId, pending.killerPlayerId)) {
        continue;
      }
      const hero = PlayerResource.GetSelectedHeroEntity(cut.playerId);
      if (!hero) {
        continue;
      }
      const mul = GameRules.GoldXPFilter.getPlayerGoldXpMultiplier(cut.playerId);
      hero.AddExperience(
        refundKillXpInput(cut.xp, mul),
        ModifyXpReason.UNSPECIFIED,
        false,
        true,
        0,
      );
    }
  }

  private bufferOrphanAssist(victimPlayerId: PlayerID, assisterPlayerId: PlayerID): void {
    if (victimPlayerId < 0) {
      return;
    }
    const now = GameRules.GetGameTime();
    const existing = this.orphanAssists.get(victimPlayerId) ?? [];
    const alive = existing.filter((entry) => now - entry.at <= ORPHAN_ASSIST_TTL);
    alive.push({ assisterPlayerId, at: now });
    this.orphanAssists.set(victimPlayerId, alive);
  }

  private consumeOrphanAssists(victimPlayerId: PlayerID, pending: PendingKill): void {
    const buffered = this.orphanAssists.get(victimPlayerId);
    this.orphanAssists.delete(victimPlayerId);
    if (buffered === undefined) {
      return;
    }
    for (const entry of buffered) {
      this.rewardAssist(pending, entry.assisterPlayerId);
    }
  }
}
