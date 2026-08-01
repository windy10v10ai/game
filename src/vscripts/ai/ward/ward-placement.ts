/**
 * bot 插眼入口，由 bot-base 在 ActionMode 之后调用。
 * 负责采集引擎侧数据并施法，判定逻辑全在 ward-decision。
 */

import { isInWardNoCastZone } from '../../abilities/ts_abilities/ward_slot/ward-no-cast-zone';
import { ActionFind } from '../action/action-find';
import type { BotBaseAIModifier } from '../hero/bot-base';
import { canPlaceAtHeroPosition, findAvailableCandidates } from './ward-decision';
import {
  OBSERVER_WARD_CONFIG,
  PLACE_INTERVAL,
  POSITION_JITTER,
  SENTRY_WARD_CONFIG,
  WardTypeConfig,
} from './ward-position-config';

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

  private static TryPlaceWard(
    hero: CDOTA_BaseNPC_Hero,
    item: CDOTA_Item,
    config: WardTypeConfig,
  ): boolean {
    const origin = hero.GetAbsOrigin();
    const existingWards = this.FindFriendlyWards(hero, config);

    // 落点带抖动，判定距离要留出抖动余量，否则会超出 KV 的 cast range 导致施法失败
    const candidates = findAvailableCandidates(
      origin,
      config.positions,
      config.castRange - POSITION_JITTER,
      existingWards,
      config.sameWardRadius,
    );
    if (candidates.length > 0) {
      return this.CastWard(hero, item, candidates[RandomInt(0, candidates.length - 1)]);
    }

    // 概率只作用于脚下插眼，预设眼位必然插；先掷概率能省掉下面的塔与基地查询
    if (RandomFloat(0, 1) > config.placeChance) {
      return false;
    }
    if (!this.CanPlaceAtHero(hero, existingWards, config)) {
      return false;
    }
    return this.CastWard(hero, item, origin);
  }

  private static CanPlaceAtHero(
    hero: CDOTA_BaseNPC_Hero,
    existingWards: readonly Vector[],
    config: WardTypeConfig,
  ): boolean {
    const origin = hero.GetAbsOrigin();
    const friendTowers: Vector[] = [];
    const enemyTowers: Vector[] = [];
    // 塔不走 ActionFind：Entities 查询不经过 unit filter，无敌塔与迷雾中的敌方塔都能拿到
    // API 声明的返回类型是 object，运行时是数组
    const towers = Entities.FindAllByClassnameWithin(
      'npc_dota_tower',
      origin,
      Math.max(config.friendTowerRadius, config.enemyTowerRadius),
    ) as CBaseEntity[];
    for (const tower of towers) {
      if (tower.GetTeamNumber() === hero.GetTeamNumber()) {
        friendTowers.push(tower.GetAbsOrigin());
      } else {
        enemyTowers.push(tower.GetAbsOrigin());
      }
    }

    const friendForts: Vector[] = [];
    // 必须用含无敌的查询：兵营未破时基地是无敌的，普通建筑查询会把它过滤掉
    for (const building of ActionFind.FindTeamBuildingsInvulnerable(
      hero,
      config.friendFortRadius,
    )) {
      if (building.GetUnitName().includes('fort')) {
        friendForts.push(building.GetAbsOrigin());
      }
    }

    return canPlaceAtHeroPosition({
      heroPos: origin,
      config,
      existingWards,
      friendTowers,
      friendForts,
      enemyTowers,
      inNoCastZone: isInWardNoCastZone(origin),
    });
  }

  /** 从主物品栏查找可用眼，bot会自动把眼挪到主物品栏不用做 SwapItems 挪位 */
  private static FindUsableWard(
    hero: CDOTA_BaseNPC_Hero,
    config: WardTypeConfig,
  ): CDOTA_Item | undefined {
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
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

  /** 一次查询覆盖所有候选点的去重：最远候选在 castRange 处，其去重半径再向外延伸 */
  private static FindFriendlyWards(
    hero: CDOTA_BaseNPC_Hero,
    config: WardTypeConfig,
  ): readonly Vector[] {
    const wards = Entities.FindAllByClassnameWithin(
      config.wardClassName,
      hero.GetAbsOrigin(),
      config.castRange + config.sameWardRadius,
    ) as CBaseEntity[];
    const result: Vector[] = [];
    for (const ward of wards) {
      if (ward.GetTeamNumber() === hero.GetTeamNumber()) {
        result.push(ward.GetAbsOrigin());
      }
    }
    return result;
  }

  private static CastWard(hero: CDOTA_BaseNPC_Hero, item: CDOTA_Item, position: Vector): boolean {
    const target = position.__add(
      Vector(
        RandomInt(-POSITION_JITTER, POSITION_JITTER),
        RandomInt(-POSITION_JITTER, POSITION_JITTER),
        0,
      ),
    );
    hero.CastAbilityOnPosition(target, item, hero.GetPlayerOwnerID());
    return true;
  }
}
