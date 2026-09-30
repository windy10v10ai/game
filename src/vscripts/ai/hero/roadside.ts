/** 顺路的小事：身边有神符、肉山掉落、敌方前哨或没亮的观察者时顺手处理，不为它们专门跑一趟。 */

import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { PlayerHelper } from '../../modules/helper/player-helper';

const RUNE_RANGE = 800;
const DROP_RANGE = 800;
const OUTPOST_RANGE = 900;
const WATCHER_RANGE = 700;
// 前哨读条被打断后隔这么久再试
const OUTPOST_RETRY_SECONDS = 60;
// 观察者的队伍和状态读不出亮没亮，点过一次就等它亮完再冷却完再去
const WATCHER_RETRY_SECONDS = 420 + 120;
// 捡东西的命令常被打架打断，隔一会儿就能再捡
const PICKUP_RETRY_SECONDS = 5;

// 金币袋走过去就自动拿，不用专门捡
const ROSHAN_DROPS = ['item_aegis', 'item_cheese', 'item_refresher_shard', 'item_roshans_banner'];
const AEGIS = 'item_aegis';
// 掉落物附近这么远的队友才参与比较谁来捡
const PICKER_RANGE = 1500;
const MAIN_SLOTS = 6;
const ALL_SLOTS = 9;

/** 读条时有敌方英雄靠近就停，被打断前先交出位置。 */
export const ROADSIDE_CHANNELS = ['ability_capture', 'ability_lamp_use'];

const TRIED_PRUNE_SIZE = 100;
const triedAt = new Map<string, number>();

/**
 * 顺手能做哪些事：离要赶去的战场还远时捡符、点观察者只耽误一两秒，占前哨读条太久不做；
 * 快到战场时只捡肉山掉落，打完肉山常被马上叫去打架，盾留在地上就白打了。
 */
export type RoadsideScope = 'all' | 'quick' | 'drops';

/** 下了命令时返回走过去要的秒数，这段时间内英雄不再下别的移动命令；没事可做返回 0。 */
export function TryRoadside(
  hero: CDOTA_BaseNPC_Hero,
  scope: RoadsideScope,
  powerOf: (hero: CDOTA_BaseNPC_Hero) => number,
): number {
  const origin = hero.GetAbsOrigin();
  const team = hero.GetTeamNumber();
  const now = GameRules.GetGameTime();

  for (const drop of Entities.FindAllByClassnameWithin(
    'dota_item_drop',
    origin,
    DROP_RANGE,
  ) as CDOTA_Item_Physical[]) {
    const item = drop.GetContainedItem();
    if (
      item &&
      ROSHAN_DROPS.includes(item.GetName()) &&
      PickerOf(team, drop, item.GetName(), powerOf) === hero &&
      Try(team, drop, now, PICKUP_RETRY_SECONDS)
    ) {
      if (item.GetName() === AEGIS) {
        MakeMainSlot(hero);
      }
      return Order(hero, UnitOrder.PICKUP_ITEM, drop, item.GetName());
    }
  }

  if (scope === 'drops') {
    return 0;
  }
  for (const rune of Entities.FindAllByClassnameWithin(
    'dota_item_rune',
    origin,
    RUNE_RANGE,
  ) as CBaseEntity[]) {
    if (Try(team, rune, now, PICKUP_RETRY_SECONDS)) {
      return Order(hero, UnitOrder.PICKUP_RUNE, rune, 'rune');
    }
  }

  const capture = hero.FindAbilityByName('ability_capture');
  if (capture && scope === 'all') {
    for (const outpost of Fixed('npc_dota_watch_tower')) {
      // 前哨开局无敌，到时间才能占
      if (
        outpost.GetTeamNumber() !== team &&
        !outpost.IsInvulnerable() &&
        hero.GetRangeToUnit(outpost) <= OUTPOST_RANGE &&
        Try(team, outpost, now, OUTPOST_RETRY_SECONDS)
      ) {
        return Cast(hero, capture, outpost, 'outpost');
      }
    }
  }

  const lamp = hero.FindAbilityByName('ability_lamp_use');
  if (lamp) {
    for (const watcher of Fixed('npc_dota_lantern')) {
      if (
        hero.GetRangeToUnit(watcher) <= WATCHER_RANGE &&
        Try(team, watcher, now, WATCHER_RETRY_SECONDS)
      ) {
        return Cast(hero, lamp, watcher, 'watcher');
      }
    }
  }
  return 0;
}

/**
 * 附近队友里谁来捡：盾给挪装备损失最小的人，主栏有空位的不用挪、其中给战力最高的；其余给离得最近、还有空格的。
 * 附近有真人队友时都留给玩家。
 */
function PickerOf(
  team: DotaTeam,
  drop: CDOTA_Item_Physical,
  itemName: string,
  powerOf: (hero: CDOTA_BaseNPC_Hero) => number,
): CDOTA_BaseNPC_Hero | undefined {
  const pos = drop.GetAbsOrigin();
  const heroes = FindUnitsInRadius(
    team,
    pos,
    undefined,
    PICKER_RANGE,
    UnitTargetTeam.FRIENDLY,
    UnitTargetType.HERO,
    UnitTargetFlags.NONE,
    FindOrder.CLOSEST,
    false,
  ) as CDOTA_BaseNPC_Hero[];
  let best: CDOTA_BaseNPC_Hero | undefined;
  let bestCost = Infinity;
  for (const unit of heroes) {
    if (!unit.IsRealHero() || !unit.IsAlive()) {
      continue;
    }
    if (PlayerHelper.IsHumanPlayer(unit)) {
      return undefined;
    }
    if (itemName === AEGIS) {
      const cost = AegisCost(unit);
      if (
        cost < bestCost ||
        (cost === bestCost && cost < Infinity && powerOf(unit) > powerOf(best!))
      ) {
        best = unit;
        bestCost = cost;
      }
    } else if (!best && CountItems(unit, ALL_SLOTS) < ALL_SLOTS) {
      best = unit;
    }
  }
  return best;
}

function CountItems(hero: CDOTA_BaseNPC_Hero, slots: number): number {
  let count = 0;
  for (let slot = 0; slot < slots; slot++) {
    if (hero.GetItemInSlot(slot)) {
      count++;
    }
  }
  return count;
}

/**
 * 捡盾要付出的代价：盾只能进主物品栏，主栏满时最便宜的一件要暂时挪进备用栏失效；
 * 盾用掉或过期后物品整理会把它挪回来。主栏和备用栏都满时捡不了。
 */
function AegisCost(hero: CDOTA_BaseNPC_Hero): number {
  if (CountItems(hero, MAIN_SLOTS) < MAIN_SLOTS) {
    return 0;
  }
  if (CountItems(hero, ALL_SLOTS) === ALL_SLOTS) {
    return Infinity;
  }
  return hero.GetItemInSlot(CheapestMainSlot(hero))!.GetCost();
}

function CheapestMainSlot(hero: CDOTA_BaseNPC_Hero): number {
  let cheapest = 0;
  for (let slot = 1; slot < MAIN_SLOTS; slot++) {
    if (hero.GetItemInSlot(slot)!.GetCost() < hero.GetItemInSlot(cheapest)!.GetCost()) {
      cheapest = slot;
    }
  }
  return cheapest;
}

/** 主栏满时把最便宜的一件挪进备用栏，给盾腾位。 */
function MakeMainSlot(hero: CDOTA_BaseNPC_Hero): void {
  if (CountItems(hero, MAIN_SLOTS) < MAIN_SLOTS) {
    return;
  }
  for (let slot = MAIN_SLOTS; slot < ALL_SLOTS; slot++) {
    if (!hero.GetItemInSlot(slot)) {
      hero.SwapItems(CheapestMainSlot(hero), slot);
      return;
    }
  }
}

const fixed = new Map<string, CDOTA_BaseNPC[]>();

/** 前哨和观察者开局就在、位置不变，全图找一次记下来。 */
function Fixed(className: string): CDOTA_BaseNPC[] {
  let units = fixed.get(className);
  if (!units || units.length === 0) {
    units = Entities.FindAllByClassname(className) as CDOTA_BaseNPC[];
    fixed.set(className, units);
  }
  return units.filter((unit) => IsValidEntity(unit));
}

/** 同一队对同一个目标隔一段时间才试一次，几个 bot 路过时也不会一起挤过去。 */
function Try(team: DotaTeam, entity: CBaseEntity, now: number, retry: number): boolean {
  // 神符与掉落物用完就没了，记录只增不减，隔一阵清掉过期的
  if (triedAt.size > TRIED_PRUNE_SIZE) {
    const expired = [...triedAt].filter(([, until]) => until < now);
    for (const [key] of expired) {
      triedAt.delete(key);
    }
  }
  const key = `${team}:${entity.GetEntityIndex()}`;
  if (now < (triedAt.get(key) ?? -Infinity)) {
    return false;
  }
  triedAt.set(key, now + retry);
  return true;
}

function Order(
  hero: CDOTA_BaseNPC_Hero,
  order: UnitOrder,
  target: CBaseEntity,
  what: string,
): number {
  ExecuteOrderFromTable({
    OrderType: order,
    UnitIndex: hero.GetEntityIndex(),
    TargetIndex: target.GetEntityIndex(),
    Queue: false,
  });
  return WalkSeconds(hero, target, what);
}

function Cast(
  hero: CDOTA_BaseNPC_Hero,
  ability: CDOTABaseAbility,
  target: CDOTA_BaseNPC,
  what: string,
): number {
  if (ability.GetLevel() < 1) {
    ability.SetLevel(1);
  }
  hero.CastAbilityOnTarget(target, ability, hero.GetPlayerOwnerID());
  return WalkSeconds(hero, target, what);
}

function WalkSeconds(hero: CDOTA_BaseNPC_Hero, target: CBaseEntity, what: string): number {
  if (IS_DEBUG_RUN) {
    print(`[bot-ai] ${hero.GetUnitName().replace('npc_dota_hero_', '')} roadside=${what}`);
  }
  const gap = hero.GetAbsOrigin().__sub(target.GetAbsOrigin()).Length2D();
  return gap / Math.max(hero.GetIdealSpeed(), 1) + 0.5;
}
