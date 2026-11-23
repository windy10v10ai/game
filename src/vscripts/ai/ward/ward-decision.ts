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
  group: string;
  tier: WardTier;
  /** Unit-name fragment of the tower a defend (own) or push (enemy) zone waits on. */
  tower?: string;
  spots: readonly Vector[];
}

/**
 * defend and push zones open only once their tower is confirmed gone. An empty tower list means
 * the tower cache is not ready, which must not read as "all towers dead".
 */
export function isZoneEnabled(zone: WardZone, aliveTowerNames: readonly string[]): boolean {
  if (zone.tier !== 'defend' && zone.tier !== 'push') {
    return true;
  }
  const tower = zone.tower;
  if (tower === undefined || aliveTowerNames.length === 0) {
    return false;
  }
  return !aliveTowerNames.some((name) => name.includes(tower));
}

export type RandomIndex = (n: number) => number;

/** A ward anywhere near any spot counts, including ones placed by players. */
export function isZoneFree(zone: WardZone, units: readonly Vector[], radius: number): boolean {
  for (const spot of zone.spots) {
    if (hasPointWithin(spot, units, radius)) {
      return false;
    }
  }
  return true;
}

/**
 * Placed wards plus claims that have not landed yet. A claim next to a placed ward is that ward
 * landing, so it is not counted twice.
 */
export function wardUnits(
  wards: readonly Vector[],
  claims: readonly Vector[],
  radius: number,
): Vector[] {
  const units = [...wards];
  for (const claim of claims) {
    if (!hasPointWithin(claim, wards, radius)) {
      units.push(claim);
    }
  }
  return units;
}

/** Regular spots may use at most `cap` wards team-wide, the rest stay free for emergencies. */
export function regularCapReached(
  cap: number | undefined,
  wards: readonly Vector[],
  claims: readonly Vector[],
  radius: number,
): boolean {
  return cap !== undefined && wardUnits(wards, claims, radius).length >= cap;
}

/** Each ward counts once however many zones of the group it covers. */
export function groupUsed(zones: readonly WardZone[], units: readonly Vector[], radius: number) {
  let used = 0;
  for (const unit of units) {
    if (zones.some((zone) => hasPointWithin(unit, zone.spots, radius))) {
      used++;
    }
  }
  return used;
}

export interface WardTarget {
  zoneId: string;
  group: string;
  spot: Vector;
}

export interface TargetPick {
  zoneId: string;
  spotIndex: number;
  until: number;
}

export interface ResolveTargetsInput {
  zones: readonly WardZone[];
  /** Missing groups default to 1. */
  groupLimits: Readonly<Record<string, number>>;
  aliveTowerNames: readonly string[];
  wards: readonly Vector[];
  claims: readonly Vector[];
  sameWardRadius: number;
  now: number;
  ttl: number;
  /** Keyed by stateKeyPrefix + group, updated in place. */
  picks: Map<string, TargetPick>;
  stateKeyPrefix: string;
  random: RandomIndex;
}

const groupIndex = new WeakMap<readonly WardZone[], Map<string, WardZone[]>>();

function groupsOf(zones: readonly WardZone[]): Map<string, WardZone[]> {
  let groups = groupIndex.get(zones);
  if (!groups) {
    groups = new Map<string, WardZone[]>();
    for (const zone of zones) {
      const list = groups.get(zone.group);
      if (list) {
        list.push(zone);
      } else {
        groups.set(zone.group, [zone]);
      }
    }
    groupIndex.set(zones, groups);
  }
  return groups;
}

/**
 * One target per group with a free slot, drawn uniformly over its enabled free zones and then
 * over the zone's spots. Distance to heroes must not enter the draw, or near zones always win.
 */
export function resolveTargets(input: ResolveTargetsInput): WardTarget[] {
  const units = wardUnits(input.wards, input.claims, input.sameWardRadius);
  const targets: WardTarget[] = [];
  for (const [group, zones] of groupsOf(input.zones)) {
    const key = input.stateKeyPrefix + group;
    const full = groupUsed(zones, units, input.sameWardRadius) >= (input.groupLimits[group] ?? 1);
    const candidates = full
      ? []
      : zones.filter(
          (zone) =>
            isZoneFree(zone, units, input.sameWardRadius) &&
            isZoneEnabled(zone, input.aliveTowerNames),
        );
    if (candidates.length === 0) {
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

/** Fresh check before casting: the cached draw is not a permission to cast. */
export function canPlaceInZone(
  zones: readonly WardZone[],
  zoneId: string,
  input: Omit<ResolveTargetsInput, 'zones' | 'picks' | 'stateKeyPrefix' | 'random' | 'now' | 'ttl'>,
): boolean {
  const zone = zones.find((item) => item.id === zoneId);
  if (!zone) {
    return false;
  }
  const units = wardUnits(input.wards, input.claims, input.sameWardRadius);
  const groupZones = groupsOf(zones).get(zone.group) ?? [zone];
  return (
    isZoneEnabled(zone, input.aliveTowerNames) &&
    isZoneFree(zone, units, input.sameWardRadius) &&
    groupUsed(groupZones, units, input.sameWardRadius) < (input.groupLimits[zone.group] ?? 1)
  );
}

/** Detour range: widens once the bot has carried a ward for `after` seconds without placing it. */
export function detourRange(
  heldSince: number,
  now: number,
  base: number,
  extended: number,
  after: number,
): number {
  return now - heldSince >= after ? extended : base;
}

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
