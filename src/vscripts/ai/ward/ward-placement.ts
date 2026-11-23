/**
 * bot 插眼入口，由 bot-base 在 ActionMode 之后调用，顺路绕行见 hero/roadside.ts，被隐身敌人打到时的真眼见 OnDamaged。
 * 负责采集引擎侧数据并施法，判定逻辑全在 ward-decision。
 */

import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { CachedTowers } from '../team/building-cache';
import {
  isZoneEnabled,
  pickPassingSpot,
  SENTRY_TRIGGER_RADIUS,
  shouldDropSentry,
  WardZone,
} from './ward-decision';
import {
  getWardZones,
  OBSERVER_WARD_CONFIG,
  PLACE_INTERVAL,
  POSITION_JITTER,
  SENTRY_WARD_CONFIG,
  WARD_RETRY_SECONDS,
  WardSide,
  WardTypeConfig,
} from './ward-position-config';

const randomIndex = (n: number): number => RandomInt(0, n - 1);
// 每个 bot 上次被隐身敌人打到后插真眼的时间
// 区域被认领到的时间，key 为 team:zoneId
const claimedUntil = new Map<string, number>();
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

  /** 已发出插眼命令的区域：命令发出后一段时间内不再派第二个人，眼真正落地由「区域里已有己方眼」判定，两者分开记 */
  static IsClaimed(team: DotaTeam, zoneId: string): boolean {
    return GameRules.GetGameTime() < (claimedUntil.get(`${team}:${zoneId}`) ?? -Infinity);
  }

  static Claim(team: DotaTeam, zoneId: string): void {
    claimedUntil.set(`${team}:${zoneId}`, GameRules.GetGameTime() + WARD_RETRY_SECONDS);
  }

  static SideOf(team: DotaTeam): WardSide {
    return team === DotaTeam.GOODGUYS ? 'radiant' : 'dire';
  }

  static ZonesOf(hero: CDOTA_BaseNPC_Hero, config: WardTypeConfig): readonly WardZone[] {
    const aliveTowerNames = CachedTowers().map((tower) => tower.GetUnitName());
    return getWardZones(config, this.SideOf(hero.GetTeamNumber())).filter((zone) =>
      isZoneEnabled(zone, aliveTowerNames),
    );
  }

  private static TryPlaceWard(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    config: WardTypeConfig,
  ): boolean {
    const existingWards = this.FindFriendlyWards(
      hero,
      config,
      config.castRange + 2 * config.sameWardRadius,
    );
    // 落点带抖动，判定距离要留出抖动余量，否则会超出 KV 的 cast range 导致施法失败
    const team = hero.GetTeamNumber();
    const pick = pickPassingSpot(
      hero.GetAbsOrigin(),
      this.ZonesOf(hero, config),
      config.castRange - POSITION_JITTER,
      existingWards,
      config.sameWardRadius,
      (zoneId) => this.IsClaimed(team, zoneId),
      randomIndex,
    );
    if (pick === undefined) {
      return false;
    }
    this.Claim(team, pick.zoneId);
    return this.CastWard(hero, item, pick.spot, 'passing');
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
