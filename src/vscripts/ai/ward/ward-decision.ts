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

export interface WardZone {
  id: string;
  /** 同一区域的备选点：互相都够近，区域里已有己方眼时整个区域视为占用 */
  spots: readonly Vector[];
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

/**
 * 路过时能直接插的点：空闲区域里 reach 内的全部备选点，随机取一个。
 * 先汇总再随机，避免眼位表靠前的点总被优先选中。
 */
export function pickPassingSpot(
  heroPos: Vector,
  zones: readonly WardZone[],
  reach: number,
  existingWards: readonly Vector[],
  sameWardRadius: number,
  random: RandomIndex,
): Vector | undefined {
  const reachable: Vector[] = [];
  for (const zone of zones) {
    if (!isZoneFree(zone, existingWards, sameWardRadius)) {
      continue;
    }
    for (const spot of zone.spots) {
      if (spot.__sub(heroPos).Length2D() <= reach) {
        reachable.push(spot);
      }
    }
  }
  return reachable.length > 0 ? reachable[random(reachable.length)] : undefined;
}

export interface DetourPick {
  zoneId: string;
  spot: Vector;
}

/** 绕路去插：range 内最近的空闲、没被别人认领的区域，区域里随机一个备选点。 */
export function pickDetourSpot(
  heroPos: Vector,
  zones: readonly WardZone[],
  range: number,
  existingWards: readonly Vector[],
  sameWardRadius: number,
  isClaimed: (zoneId: string) => boolean,
  random: RandomIndex,
): DetourPick | undefined {
  let best: WardZone | undefined;
  let bestGap = Infinity;
  for (const zone of zones) {
    if (!isZoneFree(zone, existingWards, sameWardRadius) || isClaimed(zone.id)) {
      continue;
    }
    for (const spot of zone.spots) {
      const gap = spot.__sub(heroPos).Length2D();
      if (gap <= range && gap < bestGap) {
        best = zone;
        bestGap = gap;
      }
    }
  }
  if (!best) {
    return undefined;
  }
  return { zoneId: best.id, spot: best.spots[random(best.spots.length)] };
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

export interface WardBuyer {
  id: number;
  power: number;
  gold: number;
  /** 身上已有同种眼可以叠放，或随身格子没满 */
  hasRoom: boolean;
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
    if (buyer.gold < supply.cost || !buyer.hasRoom) {
      continue;
    }
    if (!best || buyer.power < best.power) {
      best = buyer;
    }
  }
  return best?.id;
}
