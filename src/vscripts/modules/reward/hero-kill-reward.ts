import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

// 助攻收益以受害者压缩后的赏金和死亡经验为基准，数字与开局击杀衰减配套调整
const ASSIST_GOLD_RATE = 0.2;
const ASSIST_XP_RATE = 0.4;
const KILLER_ASSIST_GOLD_RATE = 0.2;
const MAX_COUNTED_ASSISTS = 2;

// 助攻事件与死亡事件的先后顺序由引擎决定，短暂缓冲后仍能配到同一次击杀
const ORPHAN_ASSIST_TTL = 1;

/** 每名助攻者额外获得的金币。 */
export function assistGoldReward(baseBounty: number): number {
  return Math.floor(baseBounty * ASSIST_GOLD_RATE);
}

/** 每名助攻者额外获得的经验。 */
export function assistXpReward(deathXp: number): number {
  return Math.floor(deathXp * ASSIST_XP_RATE);
}

/** 击杀者按助攻人数获得的额外金币，超出上限的助攻不再计入。 */
export function killerAssistGoldReward(baseBounty: number, assistCount: number): number {
  const counted = Math.min(assistCount, MAX_COUNTED_ASSISTS);
  return Math.floor(baseBounty * KILLER_ASSIST_GOLD_RATE * counted);
}

interface PendingKill {
  killerPlayerId: PlayerID | undefined;
  baseBounty: number;
  deathXp: number;
  assisters: Set<PlayerID>;
}

interface OrphanAssist {
  assisterPlayerId: PlayerID;
  at: number;
}

/**
 * 多人局的助攻与击杀收益：助攻者额外拿金币经验，击杀者按助攻人数补金币。
 * 引擎在金币过滤器之后才给出击杀信息，所以击杀金币的衰减在过滤器里做，这里只做击杀后的补发。
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

    const pending: PendingKill = {
      killerPlayerId: this.getKillerPlayerId(keys, victim),
      baseBounty: GameRules.GoldXPFilter.filterHeroKillGold(victim.GetGoldBounty()),
      deathXp: victim.GetDeathXP(),
      assisters: new Set<PlayerID>(),
    };
    this.pendingKills.set(victimPlayerId, pending);

    this.consumeOrphanAssists(victimPlayerId, pending);
    Timers.CreateTimer(this.SETTLE_DELAY, () => this.settleKiller(victimPlayerId));
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

    const gold = Math.floor(
      assistGoldReward(pending.baseBounty) *
        GameRules.GoldXPFilter.getModeGoldXpMultiplier(assisterPlayerId),
    );
    if (gold > 0) {
      hero.ModifyGold(gold, false, ModifyGoldReason.UNSPECIFIED);
    }

    const xp = assistXpReward(pending.deathXp);
    if (xp > 0) {
      hero.AddExperience(xp, ModifyXpReason.HERO_KILL, false, true, 0);
    }
  }

  private settleKiller(victimPlayerId: PlayerID): void {
    const pending = this.pendingKills.get(victimPlayerId);
    if (pending === undefined) {
      return;
    }
    this.pendingKills.delete(victimPlayerId);

    const killerPlayerId = pending.killerPlayerId;
    if (killerPlayerId === undefined) {
      return;
    }
    const hero = PlayerResource.GetSelectedHeroEntity(killerPlayerId);
    if (!hero) {
      return;
    }

    const gold = Math.floor(
      killerAssistGoldReward(pending.baseBounty, pending.assisters.size) *
        GameRules.GoldXPFilter.getModeGoldXpMultiplier(killerPlayerId),
    );
    if (gold > 0) {
      hero.ModifyGold(gold, true, ModifyGoldReason.UNSPECIFIED);
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
