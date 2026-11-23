/**
 * bot 插眼入口，由 bot-base 在 ActionMode 之后调用，顺路绕行见 hero/roadside.ts，被隐身敌人打到时的真眼见 OnDamaged。
 * 负责采集引擎侧数据并施法，判定逻辑全在 ward-decision。
 */

import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { CachedTowers } from '../team/building-cache';
import {
  pickNearestTarget,
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
interface Claim {
  team: DotaTeam;
  wardClassName: string;
  spot: Vector;
  until: number;
}
let claims: Claim[] = [];
// 各队各眼种每个组当前抽定的目标区，键为 队伍|眼种|组
const targetPicks = new Map<string, TargetPick>();
// 目标列表隔 1 秒才重算一次，路过、绕路、补眼一秒内多次查询共用
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
        nearestFriendSentry: this.NearestFriendlyWard(
          hero,
          SENTRY_WARD_CONFIG,
          SENTRY_TRIGGER_RADIUS,
        ),
        now,
        lastTriggerAt: sentryDroppedAt.get(hero.GetEntityIndex()) ?? -Infinity,
      })
    ) {
      return;
    }
    sentryDroppedAt.set(hero.GetEntityIndex(), now);
    this.CastWard(hero, sentry!, origin, 'invisible-attacker');
  }

  /**
   * 已发出插眼命令但眼未落地的点位：当作已有眼参与区域去重，口径与落地后一致，相邻区域的点也不会再派人。
   * 同一区域不再派第二个人靠这个，眼真正落地由区域里有没有己方眼判定。
   */
  static ClaimedSpots(team: DotaTeam, config: WardTypeConfig): readonly Vector[] {
    const now = GameRules.GetGameTime();
    claims = claims.filter((claim) => claim.until > now);
    return claims
      .filter((claim) => claim.team === team && claim.wardClassName === config.wardClassName)
      .map((claim) => claim.spot);
  }

  static Claim(team: DotaTeam, config: WardTypeConfig, spot: Vector): void {
    claims.push({
      team,
      wardClassName: config.wardClassName,
      spot,
      until: GameRules.GetGameTime() + WARD_RETRY_SECONDS,
    });
    targetCache.clear();
  }

  static SideOf(team: DotaTeam): WardSide {
    return team === DotaTeam.GOODGUYS ? 'radiant' : 'dire';
  }

  /**
   * 本队某种眼各组的当前目标点：只含启用且未占用、组里还有空槽的区。
   * 目标抽定后一直保留到插下或超时，抽区不看英雄位置，偏僻的区也会被抽到。
   */
  static TargetsOf(team: DotaTeam, config: WardTypeConfig): readonly WardTarget[] {
    const now = GameRules.GetGameTime();
    const cacheKey = `${team}|${config.wardClassName}`;
    const cached = targetCache.get(cacheKey);
    if (cached && now - cached.at < TARGET_CACHE_SECONDS) {
      return cached.targets;
    }
    const side = this.SideOf(team);
    const targets = resolveTargets({
      zones: getWardZones(config, side),
      groupLimits: config.sides[side].groupLimits,
      aliveTowerNames: CachedTowers().map((tower) => tower.GetUnitName()),
      existingWards: [...this.FindTeamWards(team, config), ...this.ClaimedSpots(team, config)],
      sameWardRadius: config.sameWardRadius,
      now,
      ttl: WARD_TARGET_SECONDS,
      picks: targetPicks,
      stateKeyPrefix: `${cacheKey}|`,
      random: randomIndex,
    });
    targetCache.set(cacheKey, { at: now, targets });
    return targets;
  }

  private static TryPlaceWard(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    config: WardTypeConfig,
  ): boolean {
    const team = hero.GetTeamNumber();
    // 落点带抖动，判定距离要留出抖动余量，否则会超出 KV 的 cast range 导致施法失败
    const pick = pickNearestTarget(
      hero.GetAbsOrigin(),
      this.TargetsOf(team, config),
      config.castRange - POSITION_JITTER,
    );
    if (pick === undefined) {
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
