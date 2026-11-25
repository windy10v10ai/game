/**
 * bot 插眼入口，由 bot-base 在 ActionMode 之后调用，顺路绕行见 hero/roadside.ts，被隐身敌人打到时的真眼见 OnDamaged。
 * 负责采集引擎侧数据并施法，判定逻辑全在 ward-decision。
 */

import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { CachedTowers } from '../team/building-cache';
import {
  canPlaceInZone,
  pickNearestTarget,
  regularCapReached,
  resolveTargets,
  SENTRY_TRIGGER_RADIUS,
  shouldDropSentry,
  TargetPick,
  WardTarget,
} from './ward-decision';
import {
  getWardZones,
  OBSERVER_WARD_CONFIG,
  PLACE_INTERVAL,
  POSITION_JITTER,
  SENTRY_WARD_CONFIG,
  WARD_RETRY_SECONDS,
  WARD_TARGET_SECONDS,
  WardSide,
  WardTypeConfig,
} from './ward-position-config';

const randomIndex = (n: number): number => RandomInt(0, n - 1);
// 每个 bot 上次被隐身敌人打到后插真眼的时间
// 已发出插眼命令、眼还没落地的点位，按队伍与眼种记，到期自动失效
export interface WardClaim {
  team: DotaTeam;
  wardClassName: string;
  spot: Vector;
  until: number;
}
let claims: WardClaim[] = [];
// 各队各眼种每个组当前抽定的目标区，键为 队伍|眼种|组
const targetPicks = new Map<string, TargetPick>();
// Draws are recomputed at most once per second per team and kind.
const TARGET_CACHE_SECONDS = 1;
const targetCache = new Map<string, { at: number; targets: readonly WardTarget[] }>();
const sentryDroppedAt = new Map<EntityIndex, number>();

export class WardPlacement {
  static Run(ai: BotBaseAIModifier): boolean {
    const hero = ai.GetHero();
    if (hero.IsMuted()) {
      return false;
    }
    if (ai.gameTime < ai.wardPlaceNextTime) {
      return false;
    }

    const observer = this.FindUsableWard(hero, OBSERVER_WARD_CONFIG);
    const sentry = this.FindUsableWard(hero, SENTRY_WARD_CONFIG);
    if (!observer && !sentry) {
      return false;
    }

    ai.wardPlaceNextTime = ai.gameTime + PLACE_INTERVAL;

    if (observer && this.TryPlaceWard(hero, observer, OBSERVER_WARD_CONFIG)) {
      return true;
    }
    if (sentry && this.TryPlaceWard(hero, sentry, SENTRY_WARD_CONFIG)) {
      return true;
    }
    return false;
  }

  /** 被隐身的敌方英雄打到：没有己方真眼罩着就在脚下插一个，30 秒内每人只触发一次 */
  static OnDamaged(hero: CDOTA_BaseNPC_Hero, attacker: CDOTA_BaseNPC | undefined): void {
    if (!attacker || attacker.IsNull() || !attacker.IsHero()) {
      return;
    }
    if (attacker.GetTeamNumber() === hero.GetTeamNumber() || !attacker.IsInvisible()) {
      return;
    }
    if (!hero.IsAlive() || hero.IsMuted()) {
      return;
    }
    const sentry = this.FindUsableWard(hero, SENTRY_WARD_CONFIG);
    const now = GameRules.GetGameTime();
    const origin = hero.GetAbsOrigin();
    if (
      !shouldDropSentry({
        hasSentry: sentry !== undefined,
        attackerInvisible: true,
        nearestFriendSentry: Math.min(
          this.NearestFriendlyWard(hero, SENTRY_WARD_CONFIG, SENTRY_TRIGGER_RADIUS),
          ...this.ClaimedSpots(hero.GetTeamNumber(), SENTRY_WARD_CONFIG).map((spot) =>
            spot.__sub(origin).Length2D(),
          ),
        ),
        now,
        lastTriggerAt: sentryDroppedAt.get(hero.GetEntityIndex()) ?? -Infinity,
      })
    ) {
      return;
    }
    sentryDroppedAt.set(hero.GetEntityIndex(), now);
    // Deliberately exempt from group limits and the regular cap. The claim keeps teammates from repeating it.
    this.Claim(hero.GetTeamNumber(), SENTRY_WARD_CONFIG, origin);
    this.CastWard(hero, sentry!, origin, 'invisible-attacker');
  }

  /** Claims whose ward has not landed yet. `except` leaves out the caller's own claim when re-checking. */
  static ClaimedSpots(
    team: DotaTeam,
    config: WardTypeConfig,
    except?: WardClaim,
  ): readonly Vector[] {
    const now = GameRules.GetGameTime();
    claims = claims.filter((claim) => claim.until > now);
    return claims
      .filter(
        (claim) =>
          claim !== except && claim.team === team && claim.wardClassName === config.wardClassName,
      )
      .map((claim) => claim.spot);
  }

  static Claim(team: DotaTeam, config: WardTypeConfig, spot: Vector): WardClaim {
    const claim: WardClaim = {
      team,
      wardClassName: config.wardClassName,
      spot,
      until: GameRules.GetGameTime() + WARD_RETRY_SECONDS,
    };
    claims.push(claim);
    targetCache.delete(this.CacheKey(team, config));
    return claim;
  }

  static ReleaseClaim(claim: WardClaim): void {
    claims = claims.filter((item) => item !== claim);
    targetCache.delete(this.CacheKey(claim.team, { wardClassName: claim.wardClassName }));
  }

  private static CacheKey(team: DotaTeam, config: { wardClassName: string }): string {
    return `${team}|${config.wardClassName}`;
  }

  static SideOf(team: DotaTeam): WardSide {
    return team === DotaTeam.GOODGUYS ? 'radiant' : 'dire';
  }

  private static Occupancy(team: DotaTeam, config: WardTypeConfig, except?: WardClaim) {
    const side = this.SideOf(team);
    return {
      groupLimits: config.sides[side].groupLimits,
      aliveTowerNames: CachedTowers().map((tower) => tower.GetUnitName()),
      wards: this.FindTeamWards(team, config),
      claims: this.ClaimedSpots(team, config, except),
      sameWardRadius: config.sameWardRadius,
    };
  }

  private static RegularCapReached(
    config: WardTypeConfig,
    input: { wards: readonly Vector[]; claims: readonly Vector[] },
  ): boolean {
    return regularCapReached(config.regularCap, input.wards, input.claims, config.sameWardRadius);
  }

  /** Current target per group. The cache holds the draw only, never a permission to cast. */
  static TargetsOf(team: DotaTeam, config: WardTypeConfig): readonly WardTarget[] {
    const now = GameRules.GetGameTime();
    const cacheKey = this.CacheKey(team, config);
    const cached = targetCache.get(cacheKey);
    if (cached && now - cached.at < TARGET_CACHE_SECONDS) {
      return cached.targets;
    }
    const input = this.Occupancy(team, config);
    const targets = this.RegularCapReached(config, input)
      ? []
      : resolveTargets({
          ...input,
          zones: getWardZones(config, this.SideOf(team)),
          now,
          ttl: WARD_TARGET_SECONDS,
          picks: targetPicks,
          stateKeyPrefix: `${cacheKey}|`,
          random: randomIndex,
        });
    targetCache.set(cacheKey, { at: now, targets });
    return targets;
  }

  /** Fresh occupancy check right before casting. */
  static CanPlace(
    team: DotaTeam,
    config: WardTypeConfig,
    zoneId: string,
    except?: WardClaim,
  ): boolean {
    const input = this.Occupancy(team, config, except);
    return (
      !this.RegularCapReached(config, input) &&
      canPlaceInZone(getWardZones(config, this.SideOf(team)), zoneId, input)
    );
  }

  private static TryPlaceWard(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    config: WardTypeConfig,
  ): boolean {
    const team = hero.GetTeamNumber();
    // The landing jitter must fit inside the KV cast range or the cast fails.
    const pick = pickNearestTarget(
      hero.GetAbsOrigin(),
      this.TargetsOf(team, config),
      config.castRange - POSITION_JITTER,
    );
    if (pick === undefined || !this.CanPlace(team, config, pick.zoneId)) {
      return false;
    }
    this.Claim(team, config, pick.spot);
    return this.CastWard(hero, item, pick.spot, `passing:${pick.zoneId}`);
  }

  /** 查找可用眼：备用栏里的也算，施放前由 CastWard 换进主物品栏 */
  static FindUsableWard(hero: CDOTA_BaseNPC_Hero, config: WardTypeConfig): CDOTA_Item | undefined {
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_9; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item || !item.IsFullyCastable()) {
        continue;
      }
      if (config.itemNames.includes(item.GetAbilityName())) {
        return item;
      }
    }
    return undefined;
  }

  /** 本队全部同类眼的位置 */
  static FindTeamWards(team: DotaTeam, config: WardTypeConfig): readonly Vector[] {
    const result: Vector[] = [];
    for (const ward of Entities.FindAllByClassname(config.wardClassName) as CBaseEntity[]) {
      if (ward.GetTeamNumber() === team) {
        result.push(ward.GetAbsOrigin());
      }
    }
    return result;
  }

  /** 英雄周围 radius 内己方同类眼的位置 */
  static FindFriendlyWards(
    hero: CDOTA_BaseNPC_Hero,
    config: WardTypeConfig,
    radius: number,
  ): readonly Vector[] {
    const wards = Entities.FindAllByClassnameWithin(
      config.wardClassName,
      hero.GetAbsOrigin(),
      radius,
    ) as CBaseEntity[];
    const result: Vector[] = [];
    for (const ward of wards) {
      if (ward.GetTeamNumber() === hero.GetTeamNumber()) {
        result.push(ward.GetAbsOrigin());
      }
    }
    return result;
  }

  private static NearestFriendlyWard(
    hero: CDOTA_BaseNPC_Hero,
    config: WardTypeConfig,
    radius: number,
  ): number {
    const origin = hero.GetAbsOrigin();
    let nearest = Infinity;
    for (const position of this.FindFriendlyWards(hero, config, radius)) {
      nearest = Math.min(nearest, position.__sub(origin).Length2D());
    }
    return nearest;
  }

  /** 落点在 POSITION_JITTER 半径的圆内随机偏移，绕路和路过两种插法共用 */
  static CastWard(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    position: Vector,
    via: string,
  ): boolean {
    // 备用栏的物品不能施放，和 ConsumeItem 一样挤开主栏末位换入，用完后物品整理会把被挤开的挪回来
    if (item.GetItemSlot() > InventorySlot.SLOT_6) {
      hero.SwapItems(item.GetItemSlot(), InventorySlot.SLOT_6);
    }
    const angle = RandomFloat(0, 2 * Math.PI);
    const radius = RandomFloat(0, POSITION_JITTER);
    const target = position.__add(Vector(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    hero.CastAbilityOnPosition(target, item, hero.GetPlayerOwnerID());
    if (IS_DEBUG_RUN) {
      print(
        `[bot-ward] t=${Math.floor(GameRules.GetGameTime())} team=${hero.GetTeamNumber()} hero=${hero.GetUnitName().replace('npc_dota_hero_', '')} item=${item.GetAbilityName()} via=${via} pos=${Math.floor(target.x)},${Math.floor(target.y)}`,
      );
    }
    return true;
  }
}
