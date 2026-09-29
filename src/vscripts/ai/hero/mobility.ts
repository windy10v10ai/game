/**
 * 英雄的主动位移：跳刀、能点地跳的技能与推推登记在一张表里，赶路、撤退与切入都从表里按顺序找能用的一件。
 * 加一种位移只需在表里加一行。
 */

import { CheckFacingFailure } from '../action/cast-condition';
import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { Point } from '../team/lane-geometry';
import { engageLanding, landingToward } from './mobility-landing';

export type MoveReason = 'move' | 'escape';

export interface MoveContext {
  hero: CDOTA_BaseNPC_Hero;
  /** 撤退时身边最近的敌方英雄，推推要背对它才推 */
  nearestEnemy?: CDOTA_BaseNPC;
  /** 调试日志里带上当时的打/撤决定 */
  stance: string;
}

interface Mover {
  names: string[];
  item: boolean;
  /** 能位移的距离 */
  range: (hero: CDOTA_BaseNPC_Hero, castable: CDOTABaseAbility) => number;
  /** 有 A 杖才能点地跳的技能 */
  scepter?: boolean;
  /** 推自己：只能沿朝向推，对不准方向就不交 */
  push?: boolean;
  /** 花蓝的位移赶路时蓝不多就留着 */
  costsMana?: boolean;
  /** 能用来跳到敌人身边切入 */
  engage?: boolean;
  trace: string;
}

// 推动方向取朝向，赶路时朝向偏离目的地超过约 30° 就会推歪
const PUSH_TRAVEL_MIN_COS = 0.87;
// 赶路推一下、跳一下省不了多少时间，蓝紧张时留给撤退和施法
const TRAVEL_MIN_MANA_PERCENT = 50;
// 切入：濒死时不往里跳；远程落在离敌人这么远的地方
const ENGAGE_MIN_HEALTH_PERCENT = 20;
const RANGED_STAND_OFF = 600;

const blinkRangeCache = new Map<string, number>();

/** 施法距离读数对部分跳刀为 0，与闪烁距离取大；同名跳刀数值不变，读一次缓存。 */
function BlinkRange(hero: CDOTA_BaseNPC_Hero, blink: CDOTABaseAbility): number {
  const name = blink.GetAbilityName();
  let base = blinkRangeCache.get(name);
  if (base === undefined) {
    base = Math.max(
      blink.GetCastRange(hero.GetAbsOrigin(), undefined),
      blink.GetSpecialValueFor('blink_range'),
    );
    blinkRangeCache.set(name, base);
  }
  return base + hero.GetCastRangeBonus();
}

// 顺序即优先级：跳刀最远也不花蓝，推推距离最短留到最后
const MOVERS: Mover[] = [
  {
    names: [
      'item_blink',
      'item_arcane_blink',
      'item_arcane_blink_2',
      'item_overwhelming_blink',
      'item_overwhelming_blink_2',
      'item_swift_blink',
      'item_swift_blink_2',
      'item_jump_jump_jump',
    ],
    item: true,
    range: BlinkRange,
    engage: true,
    trace: 'blink',
  },
  {
    // 撼地者 强化图腾
    names: ['earthshaker_enchant_totem'],
    item: false,
    range: (hero, castable) =>
      castable.GetSpecialValueFor('distance_scepter') + hero.GetCastRangeBonus(),
    scepter: true,
    costsMana: true,
    trace: 'jump',
  },
  {
    names: [
      'item_force_staff',
      'item_force_staff_2',
      'item_force_staff_3',
      'item_hurricane_pike',
      'item_hurricane_pike_2',
    ],
    item: true,
    range: (_hero, castable) => castable.GetSpecialValueFor('push_length'),
    push: true,
    costsMana: true,
    trace: 'force_staff',
  },
];

const BLINK = MOVERS[0];

/** 朝目的地位移一段：赶路时省时间，撤退时拉开距离。 */
export function MoveToward(context: MoveContext, position: Vector, reason: MoveReason): boolean {
  const hero = context.hero;
  if (hero.IsRooted()) {
    return false;
  }
  const here = hero.GetAbsOrigin();
  for (const mover of MOVERS) {
    if (reason === 'move' && mover.costsMana && hero.GetManaPercent() < TRAVEL_MIN_MANA_PERCENT) {
      continue;
    }
    const castable = FindReady(hero, mover);
    if (!castable) {
      continue;
    }
    const landing = landingToward(here, position, mover.range(hero, castable));
    if (!landing || (mover.push && !CanPushToward(context, position, reason))) {
      continue;
    }
    Trace(context, mover, reason, castable);
    if (mover.push) {
      hero.CastAbilityOnTarget(hero, castable, hero.GetPlayerOwnerID());
    } else {
      hero.CastAbilityOnPosition(ToVector(landing, here), castable, hero.GetPlayerOwnerID());
    }
    return true;
  }
  return false;
}

/** 跳到敌人身边切入。 */
export function EngageToward(context: MoveContext, target: CDOTA_BaseNPC): boolean {
  const hero = context.hero;
  if (hero.GetHealthPercent() < ENGAGE_MIN_HEALTH_PERCENT || hero.IsRooted()) {
    return false;
  }
  const blink = FindReady(hero, BLINK);
  if (!blink) {
    return false;
  }
  const standOff = hero.IsRangedAttacker()
    ? Math.min(hero.Script_GetAttackRange(), RANGED_STAND_OFF)
    : 0;
  const here = hero.GetAbsOrigin();
  const landing = engageLanding(here, target.GetAbsOrigin(), BlinkRange(hero, blink), standOff);
  if (!landing) {
    return false;
  }
  Trace(context, BLINK, 'engage', blink);
  hero.CastAbilityOnPosition(ToVector(landing, here), blink, hero.GetPlayerOwnerID());
  return true;
}

/** 主物品栏里闪烁匕首升级链上的任意一件。 */
export function FindBlinkItem(hero: CDOTA_BaseNPC_Hero): CDOTA_Item | undefined {
  return FindItem(hero, BLINK.names);
}

function FindReady(hero: CDOTA_BaseNPC_Hero, mover: Mover): CDOTABaseAbility | undefined {
  let castable: CDOTABaseAbility | undefined;
  if (mover.item) {
    if (hero.IsMuted()) {
      return undefined;
    }
    castable = FindItem(hero, mover.names);
  } else {
    if (hero.IsSilenced() || (mover.scepter && !hero.HasScepter())) {
      return undefined;
    }
    for (const name of mover.names) {
      castable = hero.FindAbilityByName(name);
      if (castable) {
        break;
      }
    }
  }
  return castable && castable.IsFullyCastable() ? castable : undefined;
}

function FindItem(hero: CDOTA_BaseNPC_Hero, names: string[]): CDOTA_Item | undefined {
  for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
    const item = hero.GetItemInSlot(slot);
    if (item && names.includes(item.GetName())) {
      return item;
    }
  }
  return undefined;
}

/** 推推只能沿朝向推：撤退时最近的敌人要在身后，赶路时朝向要基本对准目的地。 */
function CanPushToward(context: MoveContext, position: Vector, reason: MoveReason): boolean {
  const here = context.hero.GetAbsOrigin();
  const forward = context.hero.GetForwardVector();
  const offset = position.__sub(here);
  if (reason === 'escape') {
    const enemy = context.nearestEnemy;
    return (
      enemy !== undefined &&
      !CheckFacingFailure('back', forward, enemy.GetAbsOrigin().__sub(here)) &&
      !CheckFacingFailure('front', forward, offset)
    );
  }
  return (forward.x * offset.x + forward.y * offset.y) / offset.Length2D() >= PUSH_TRAVEL_MIN_COS;
}

function ToVector(point: Point, here: Vector): Vector {
  return Vector(point.x, point.y, here.z);
}

function Trace(
  context: MoveContext,
  mover: Mover,
  reason: MoveReason | 'engage',
  castable: CDOTABaseAbility,
): void {
  if (!IS_DEBUG_RUN) {
    return;
  }
  const name = context.hero.GetUnitName().replace('npc_dota_hero_', '');
  const what = mover.item ? '' : ` ${castable.GetAbilityName()}`;
  print(`[bot-ai] ${name} ${mover.trace}=${reason}${what} stance=${context.stance}`);
}
