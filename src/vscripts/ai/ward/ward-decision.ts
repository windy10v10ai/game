/** bot 插眼的判定逻辑。输入全部由适配层采集后传入，不查询引擎。 */

/** 一律用平面距离：高台眼位的 z 差异不应影响施法距离与去重 */
export function hasPointWithin(center: Vector, points: readonly Vector[], radius: number): boolean {
  for (const point of points) {
    if (point.__sub(center).Length2D() <= radius) {
      return true;
    }
  }
  return false;
}

export type WardTier = 'always' | 'defend' | 'attack' | 'push';

export interface WardZone {
  id: string;
  /** 组：同一路线上互相替代的区，同时占用的眼数受组上限约束 */
  group: string;
  /** always 与 attack 随时启用，defend 绑定己方塔、push 绑定敌方塔，塔倒后才启用 */
  tier: WardTier;
  /** defend 与 push 绑定的防御塔单位名片段 */
  tower?: string;
  /** 区内的备选点：互相都够近，区里已有己方眼时整个区视为占用 */
  spots: readonly Vector[];
}

/** 区是否启用：defend 与 push 要等绑定的塔不在存活名单里，其余随时。aliveTowerNames 是存活防御塔的单位名 */
export function isZoneEnabled(zone: WardZone, aliveTowerNames: readonly string[]): boolean {
  if (zone.tier !== 'defend' && zone.tier !== 'push') {
    return true;
  }
  const tower = zone.tower;
  return tower === undefined || !aliveTowerNames.some((name) => name.includes(tower));
}

/** 取 [0, n) 的整数，测试时换成固定序列 */
export type RandomIndex = (n: number) => number;

/** 区域内没有任何己方同类眼：判定半径内有眼就算占用，哪怕是玩家插的 */
export function isZoneFree(
  zone: WardZone,
  existingWards: readonly Vector[],
  sameWardRadius: number,
): boolean {
  for (const spot of zone.spots) {
    if (hasPointWithin(spot, existingWards, sameWardRadius)) {
      return false;
    }
  }
  return true;
}

/** 组的当前目标：电脑顺路插眼只去这些点 */
export interface WardTarget {
  zoneId: string;
  group: string;
  spot: Vector;
}

/** 组里已抽定的目标区与备选点，记到插下、失效或超时为止 */
export interface TargetPick {
  zoneId: string;
  spotIndex: number;
  until: number;
}

export interface ResolveTargetsInput {
  zones: readonly WardZone[];
  /** 组 id → 同时最多几只眼，缺省按 1 */
  groupLimits: Readonly<Record<string, number>>;
  aliveTowerNames: readonly string[];
  /** 本方同种眼的位置，要把已认领未落地的点位也算进去 */
  existingWards: readonly Vector[];
  sameWardRadius: number;
  now: number;
  /** 目标抽出后多久还没插下就重抽 */
  ttl: number;
  /** 抽定的目标，键为 stateKeyPrefix + 组 id，函数会直接更新它 */
  picks: Map<string, TargetPick>;
  stateKeyPrefix: string;
  random: RandomIndex;
}

/**
 * 每个还有空槽的组给出一个当前目标：沿用没过期、仍启用且仍空闲的旧目标，否则从组里已启用且未占用的区中等概率抽一个区，
 * 再在区内等概率抽备选点。不按离英雄远近挑，偏僻的区也有同样的机会被抽到。
 * 空槽数是组上限减去组内已占用的区数，组满则没有目标。
 */
export function resolveTargets(input: ResolveTargetsInput): WardTarget[] {
  const groups = new Map<string, WardZone[]>();
  for (const zone of input.zones) {
    const list = groups.get(zone.group);
    if (list) {
      list.push(zone);
    } else {
      groups.set(zone.group, [zone]);
    }
  }
  const targets: WardTarget[] = [];
  for (const [group, zones] of groups) {
    const key = input.stateKeyPrefix + group;
    const free = zones.filter((zone) =>
      isZoneFree(zone, input.existingWards, input.sameWardRadius),
    );
    const occupied = zones.length - free.length;
    const candidates = free.filter((zone) => isZoneEnabled(zone, input.aliveTowerNames));
    if (occupied >= (input.groupLimits[group] ?? 1) || candidates.length === 0) {
      input.picks.delete(key);
      continue;
    }
    const old = input.picks.get(key);
    let zone =
      old && old.until > input.now ? candidates.find((item) => item.id === old.zoneId) : undefined;
    let spotIndex = old?.spotIndex ?? 0;
    if (!zone) {
      zone = candidates[input.random(candidates.length)];
      spotIndex = input.random(zone.spots.length);
      input.picks.set(key, { zoneId: zone.id, spotIndex, until: input.now + input.ttl });
    }
    targets.push({ zoneId: zone.id, group, spot: zone.spots[spotIndex] });
  }
  return targets;
}

/** range 内离英雄最近的目标，路过与绕路共用 */
export function pickNearestTarget(
  heroPos: Vector,
  targets: readonly WardTarget[],
  range: number,
): WardTarget | undefined {
  let best: WardTarget | undefined;
  let bestGap = Infinity;
  for (const target of targets) {
    const gap = target.spot.__sub(heroPos).Length2D();
    if (gap <= range && gap < bestGap) {
      best = target;
      bestGap = gap;
    }
  }
  return best;
}

export interface SentryTriggerInput {
  hasSentry: boolean;
  attackerInvisible: boolean;
  /** 己方真眼到脚下的最近距离，没有则 Infinity */
  nearestFriendSentry: number;
  now: number;
  lastTriggerAt: number;
}

export const SENTRY_TRIGGER_RADIUS = 900;
export const SENTRY_TRIGGER_COOLDOWN = 30;

/** 被隐身敌人打到时是否在脚下插真眼 */
export function shouldDropSentry(input: SentryTriggerInput): boolean {
  return (
    input.hasSentry &&
    input.attackerInvisible &&
    input.nearestFriendSentry > SENTRY_TRIGGER_RADIUS &&
    input.now - input.lastTriggerAt >= SENTRY_TRIGGER_COOLDOWN
  );
}

export type WardKind = 'observer' | 'sentry';

export interface HeldItem {
  name: string;
  charges: number;
  /** 组合守卫里的真眼充能，脚本用不出去，目前只记录 */
  secondaryCharges: number;
}

const WARD_ITEM_NAMES = ['item_ward_observer', 'item_ward_sentry', 'item_ward_dispenser'];

/**
 * 物品栏里某一种眼的数量，以及是否带着另一种眼。
 * 组合守卫整件按假眼处理：假眼数读当前充能，里面的真眼放不出去，不计入真眼数，持有者算「带假眼」。
 * 两种眼并进同一格组合守卫后，脚本施放插出的只会是假眼，所以补给时一个电脑只带一种眼。
 */
export function countHeldWards(
  kind: WardKind,
  items: readonly HeldItem[],
): { total: number; canStack: boolean; holdsOtherKind: boolean } {
  let total = 0;
  let canStack = false;
  let holdsOtherKind = false;
  for (const item of items) {
    if (!WARD_ITEM_NAMES.includes(item.name)) {
      continue;
    }
    // 身上有任一种眼，新买的眼都能并进去
    canStack = true;
    const isSentry = item.name === 'item_ward_sentry';
    if (isSentry !== (kind === 'sentry')) {
      holdsOtherKind = true;
    }
    if (kind === 'observer' && !isSentry) {
      total +=
        item.name === 'item_ward_dispenser' ? Math.max(0, item.charges) : Math.max(1, item.charges);
    } else if (kind === 'sentry' && isSentry) {
      total += Math.max(1, item.charges);
    }
  }
  return { total, canStack, holdsOtherKind };
}

export interface WardBuyer {
  id: number;
  power: number;
  gold: number;
  /** 身上已有同种眼可以叠放，或随身格子没满 */
  hasRoom: boolean;
  /** 身上带着另一种眼（含组合守卫）：两种眼会并成组合守卫，插出的只会是假眼，所以不再发这一种 */
  holdsOtherKind: boolean;
}

export interface WardSupply {
  /** 本队插着的加 bot 手里的 */
  owned: number;
  cap: number;
  stock: number;
  /** 商店里留给玩家的数量 */
  reserve: number;
  cost: number;
}

/** 本队的眼不够时，挑战力最低、买得起且有地方放的 bot 买一个：辅助插眼，核心留着钱出装。 */
export function pickWardBuyer(
  buyers: readonly WardBuyer[],
  supply: WardSupply,
): number | undefined {
  if (supply.owned >= supply.cap || supply.stock <= supply.reserve) {
    return undefined;
  }
  let best: WardBuyer | undefined;
  for (const buyer of buyers) {
    if (buyer.gold < supply.cost || !buyer.hasRoom || buyer.holdsOtherKind) {
      continue;
    }
    if (!best || buyer.power < best.power) {
      best = buyer;
    }
  }
  return best?.id;
}
