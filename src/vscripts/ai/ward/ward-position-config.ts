/** Ward spots per side and kind: group, zone, spots. Structure and tiers are described in README.md. */

import type { WardTier, WardZone } from './ward-decision';

/** Seconds between passing-ward attempts. */
export const PLACE_INTERVAL = 2;

/** Max detour distance for a bot carrying an observer. */
export const WARD_DETOUR_RANGE = 2500;

/** A bot holding an observer this long without placing it may detour farther, so remote groups still get visited. */
export const WARD_LONG_DETOUR_AFTER = 45;
export const WARD_LONG_DETOUR_RANGE = 3500;

/** Detour walk cap plus cast margin: a claim whose order was lost frees itself soon after. */
export const WARD_RETRY_SECONDS = 16;

/** A drawn target is redrawn after this long, so a remote one nobody passes cannot stall its group. */
export const WARD_TARGET_SECONDS = 90;

/** Random landing offset so wards from several bots do not stack. */
export const POSITION_JITTER = 50;

export type WardSide = 'radiant' | 'dire';

/** Raw zone data: ground height is looked up at runtime. */
export interface WardZoneData {
  id: string;
  group: string;
  tier: WardTier;
  /** Fragment of the tower unit name, e.g. 'badguys_tower3_mid'. */
  tower?: string;
  spots: ReadonlyArray<readonly [number, number]>;
}

export interface WardSideData {
  /** Group id to the most wards it holds at once. */
  groupLimits: Readonly<Record<string, number>>;
  zones: readonly WardZoneData[];
}

export interface WardTypeConfig {
  /** A dispenser counts as an observer: it renames itself to a sentry once its observer charges run out. */
  itemNames: readonly string[];
  wardClassName: string;
  sides: Record<WardSide, WardSideData>;
  /** Must match AbilityCastRange in npc_items_override.txt. */
  castRange: number;
  sameWardRadius: number;
  /** Most wards of this kind team-wide that regular spots may use, leaving the rest for emergencies. */
  regularCap?: number;
}

const converted = new Map<WardTypeConfig, Record<WardSide, readonly WardZone[]>>();

/** Built lazily because Vector is not available at module load or in unit tests. */
export function getWardZones(config: WardTypeConfig, side: WardSide): readonly WardZone[] {
  let sides = converted.get(config);
  if (!sides) {
    const build = (data: readonly WardZoneData[]): readonly WardZone[] =>
      data.map((zone) => ({
        id: zone.id,
        group: zone.group,
        tier: zone.tier,
        tower: zone.tower,
        spots: zone.spots.map(([x, y]) =>
          Vector(x, y, GetGroundHeight(Vector(x, y, 0), undefined)),
        ),
      }));
    sides = {
      radiant: build(config.sides.radiant.zones),
      dire: build(config.sides.dire.zones),
    };
    converted.set(config, sides);
  }
  return sides[side];
}

const OBSERVER_RADIANT: WardSideData = {
  groupLimits: {
    'base-top-obs/obs': 1,
    'base-mid-obs/obs': 1,
    'base-bot-obs/obs': 1,
    '天辉上野入口线/obs': 2,
    '天辉下野入口线/obs': 1,
    '天辉下路回撤线/obs': 1,
    '夜魇下野外围入口线/obs': 1,
    '下河道视野线/obs': 2,
    '上河道视野线/obs': 1,
    '夜魇上野绕后线/obs': 1,
    '夜魇上野靠河入口线/obs': 2,
    '夜魇下野内圈入口线/obs': 2,
    'd-exterior-east/obs': 1,
    'd-push-top/obs': 1,
    'd-push-mid/obs': 1,
    'd-push-bot/obs': 1,
    'D-fill': 3,
    'p4-d-upper-high/obs': 1,
    'p4-river-rune/obs': 2,
    'p5-top-lane-outer/obs': 1,
    'n-lane-west/obs': 1,
    'p5-top-lane-mid/obs': 1,
  },
  zones: [
    {
      id: 'base-top-obs',
      group: 'base-top-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_top',
      spots: [[-6675, -4100]],
    },
    {
      id: 'base-mid-obs',
      group: 'base-mid-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_mid',
      spots: [[-3950, -4400]],
    },
    {
      id: 'base-bot-obs',
      group: 'base-bot-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_bot',
      spots: [[-3700, -6150]],
    },
    {
      id: 'r-upper-stone',
      group: '天辉上野入口线/obs',
      tier: 'always',
      spots: [[-4350, -1025]],
    },
    {
      id: 'r-upper-north',
      group: '天辉上野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [[-4800, 668]],
    },
    {
      id: 'r-upper-mid',
      group: '天辉上野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_mid',
      spots: [[-3403, 700]],
    },
    {
      id: 'r-south-river-ramp',
      group: '天辉下野入口线/obs',
      tier: 'always',
      spots: [[1276, -3153]],
    },
    {
      id: 'r-lower-stone',
      group: '天辉下野入口线/obs',
      tier: 'always',
      spots: [[-1289, -4351]],
    },
    {
      id: 'r-lower-platform',
      group: '天辉下野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [[50, -3750]],
    },
    {
      id: 'r-south-flank',
      group: '天辉下路回撤线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [[1650, -4850]],
    },
    {
      id: 'r-lower-lane',
      group: '天辉下路回撤线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [[2500, -6600]],
    },
    {
      id: 'd-lower-road',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [[3850, -3900]],
    },
    {
      id: 'd-lower-lane',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [[6400, -3600]],
    },
    {
      id: 'r-river-entrances',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[297, -2366]],
    },
    {
      id: 's-roshan-river',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[2120, -2072]],
    },
    {
      id: 's-east-entrance',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[2788, -1288]],
    },
    {
      id: 'n-river-mid',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [[-775, 1200]],
    },
    {
      id: 'n-river-low',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [[-2200, 1800]],
    },
    {
      id: 'd-upper-lane',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [[-2850, 5300]],
    },
    {
      id: 'd-upper-jungle',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [[2400, 4232]],
    },
    {
      id: 'd-upper-ramp',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [[-400, 2400]],
    },
    {
      id: 'd-upper-outpost-edge',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [[-525, 3625]],
    },
    {
      id: 'd-upper-stone',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [[1025, 3575]],
    },
    {
      id: 'd-upper-backlane',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [[1400, 6000]],
    },
    {
      id: 'd-inner-stone-obs',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [[4600, 775]],
    },
    {
      id: 'd-lower-jungle',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [[5033, -247]],
    },
    {
      id: 'd-lower-jungle-west',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [[3652, 909]],
    },
    {
      id: 'd-lower-entrance',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [[4616, -1901]],
    },
    {
      id: 'd-lower-edge',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [[7800, 600]],
    },
    {
      id: 'd-exterior-east',
      group: 'd-exterior-east/obs',
      tier: 'attack',
      spots: [[6775, 4225]],
    },
    {
      id: 'd-push-top',
      group: 'd-push-top/obs',
      tier: 'push',
      tower: 'badguys_tower3_top',
      spots: [[3200, 5000]],
    },
    {
      id: 'd-push-mid',
      group: 'd-push-mid/obs',
      tier: 'push',
      tower: 'badguys_tower3_mid',
      spots: [[4600, 3200]],
    },
    {
      id: 'd-push-mid-b',
      group: 'd-push-mid/obs',
      tier: 'push',
      tower: 'badguys_tower3_mid',
      spots: [[3860, 3940]],
    },
    {
      id: 'd-push-bot',
      group: 'd-push-bot/obs',
      tier: 'push',
      tower: 'badguys_tower3_bot',
      spots: [[6100, 2650]],
    },
    {
      id: 'camp18',
      group: 'D-fill',
      tier: 'attack',
      spots: [[-3200, 4300]],
    },
    {
      id: 'lane_top_0',
      group: 'D-fill',
      tier: 'always',
      spots: [[-5350, -1350]],
    },
    {
      id: 'lane_mid_0',
      group: 'D-fill',
      tier: 'always',
      spots: [[-4200, -1700]],
    },
    {
      id: 'lane_mid_1',
      group: 'D-fill',
      tier: 'always',
      spots: [[-3150, -1150]],
    },
    {
      id: 'river02',
      group: 'D-fill',
      tier: 'always',
      spots: [[2250, -5550]],
    },
    {
      id: 'camp24',
      group: 'D-fill',
      tier: 'always',
      spots: [[4250, -4350]],
    },
    {
      id: 'p4-d-upper-high',
      group: 'p4-d-upper-high/obs',
      tier: 'attack',
      spots: [[-2250, 4650]],
    },
    {
      id: 'p5-river-rune-upper',
      group: 'p4-river-rune/obs',
      tier: 'always',
      spots: [[-1950, 200]],
    },
    {
      id: 'p5-river-rune-lower',
      group: 'p4-river-rune/obs',
      tier: 'always',
      spots: [[1150, -450]],
    },
    {
      id: 'p5-top-lane-outer',
      group: 'p5-top-lane-outer/obs',
      tier: 'always',
      spots: [[-6200, 5600]],
    },
    {
      id: 'n-lane-west',
      group: 'n-lane-west/obs',
      tier: 'always',
      spots: [[-5595, 3141]],
    },
    {
      id: 'p5-top-lane-mid',
      group: 'p5-top-lane-mid/obs',
      tier: 'always',
      spots: [[-4050, 3550]],
    },
  ],
};

const OBSERVER_DIRE: WardSideData = {
  groupLimits: {
    'r-push-top/obs': 1,
    'r-push-mid/obs': 1,
    'r-push-bot/obs': 1,
    'r-edge-north/obs': 1,
    'r-edge-south/obs': 1,
    '天辉上野入侵线/obs': 1,
    '天辉下野入侵线/obs': 1,
    '天辉下路绕行线/obs': 1,
    '下河道视野线/obs': 2,
    '上河道视野线/obs': 1,
    '上路外侧进出线/obs': 1,
    '夜魇上野入口线/obs': 1,
    '夜魇下野内圈入口线/obs': 2,
    '夜魇下野外围入口线/obs': 1,
    'base-top-obs/obs': 1,
    'base-mid-obs/obs': 1,
    'base-bot-obs/obs': 1,
    'd-exterior-east/obs': 1,
    'D-fill': 3,
    'p4-d-upper-stone/obs': 1,
    'p4-r-upper-stone/obs': 1,
    'p4-r-lower-stone/obs': 1,
    'p4-r-lower-river-high/obs': 1,
    'p4-d-river-high/obs': 1,
    'p4-r-upper-mid-high/obs': 1,
    'p4-d-upper-river-high/obs': 1,
    'p4-river-rune/obs': 2,
    'p5-bot-lane-own/obs': 1,
  },
  zones: [
    {
      id: 'r-push-top',
      group: 'r-push-top/obs',
      tier: 'push',
      tower: 'goodguys_tower3_top',
      spots: [[-6675, -4100]],
    },
    {
      id: 'r-push-mid',
      group: 'r-push-mid/obs',
      tier: 'push',
      tower: 'goodguys_tower3_mid',
      spots: [[-3950, -4400]],
    },
    {
      id: 'r-push-mid-b',
      group: 'r-push-mid/obs',
      tier: 'push',
      tower: 'goodguys_tower3_mid',
      spots: [[-4800, -3550]],
    },
    {
      id: 'r-push-bot',
      group: 'r-push-bot/obs',
      tier: 'push',
      tower: 'goodguys_tower3_bot',
      spots: [[-4530, -5890]],
    },
    {
      id: 'r-edge-north',
      group: 'r-edge-north/obs',
      tier: 'push',
      tower: 'goodguys_tower2_top',
      spots: [[-5500, -3375]],
    },
    {
      id: 'r-edge-south',
      group: 'r-edge-south/obs',
      tier: 'push',
      tower: 'goodguys_tower2_bot',
      spots: [[-3900, -5100]],
    },
    {
      id: 'r-upper-mid',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [[-3195, -1258]],
    },
    {
      id: 'r-upper-west',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [[-5314, -1483]],
    },
    {
      id: 'r-upper-outer',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [[-7550, -1550]],
    },
    {
      id: 'r-south-river-ramp',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [[1276, -3153]],
    },
    {
      id: 'r-lower-jungle',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [[-2675, -6475]],
    },
    {
      id: 'r-lower-mid',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [[-3115, -4052]],
    },
    {
      id: 'r-south-flank',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [[1650, -4850]],
    },
    {
      id: 'r-bottom-lane',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [[3275, -6139]],
    },
    {
      id: 'r-bottom-wild',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [[5218, -4806]],
    },
    {
      id: 'r-river-entrances',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[297, -2366]],
    },
    {
      id: 's-roshan-river',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[2120, -2072]],
    },
    {
      id: 's-east-entrance',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [[2788, -1288]],
    },
    {
      id: 'n-river-mid',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [[-775, 1200]],
    },
    {
      id: 'n-river-west',
      group: '上河道视野线/obs',
      tier: 'attack',
      spots: [[-4650, 800]],
    },
    {
      id: 'n-lane-entrances',
      group: '上河道视野线/obs',
      tier: 'attack',
      spots: [[-4214, 3783]],
    },
    {
      id: 'n-lane-west',
      group: '上路外侧进出线/obs',
      tier: 'attack',
      spots: [[-5595, 3141]],
    },
    {
      id: 'n-lane-north',
      group: '上路外侧进出线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_top',
      spots: [[-3998, 7138]],
    },
    {
      id: 'd-upper-jungle',
      group: '夜魇上野入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_top',
      spots: [[3275, 4600]],
    },
    {
      id: 'n-jungle-west',
      group: '夜魇上野入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_top',
      spots: [[-3200, 4300]],
    },
    {
      id: 'n-jungle-west-b',
      group: '夜魇上野入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_top',
      spots: [[-2250, 4650]],
    },
    {
      id: 'd-inner-stone-obs',
      group: '夜魇下野内圈入口线/obs',
      tier: 'always',
      spots: [[4600, 775]],
    },
    {
      id: 'd-lower-jungle',
      group: '夜魇下野内圈入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [[5033, -247]],
    },
    {
      id: 'd-lower-jungle-west',
      group: '夜魇下野内圈入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_mid',
      spots: [[3652, 909]],
    },
    {
      id: 'd-lower-entrance',
      group: '夜魇下野外围入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_bot',
      spots: [[4616, -1901]],
    },
    {
      id: 'd-lower-edge',
      group: '夜魇下野外围入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [[7800, 600]],
    },
    {
      id: 'base-top-obs',
      group: 'base-top-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_top',
      spots: [[3150, 6300]],
    },
    {
      id: 'base-mid-obs',
      group: 'base-mid-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_mid',
      spots: [[4540, 3980]],
    },
    {
      id: 'base-bot-obs',
      group: 'base-bot-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [[5850, 2650]],
    },
    {
      id: 'd-exterior-east',
      group: 'd-exterior-east/obs',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [[6625, 4175]],
    },
    {
      id: 'lane_top_1',
      group: 'D-fill',
      tier: 'attack',
      spots: [[-5950, 450]],
    },
    {
      id: 'lane_top_3',
      group: 'D-fill',
      tier: 'always',
      spots: [[-2850, 5250]],
    },
    {
      id: 'lane_mid_2',
      group: 'D-fill',
      tier: 'push',
      tower: 'goodguys_tower1_mid',
      spots: [[-1150, -450]],
    },
    {
      id: 'river02',
      group: 'D-fill',
      tier: 'attack',
      spots: [[2250, -5550]],
    },
    {
      id: 'camp24',
      group: 'D-fill',
      tier: 'attack',
      spots: [[4250, -4350]],
    },
    {
      id: 'p4-d-upper-stone',
      group: 'p4-d-upper-stone/obs',
      tier: 'always',
      spots: [[1025, 3575]],
    },
    {
      id: 'p4-r-upper-stone',
      group: 'p4-r-upper-stone/obs',
      tier: 'attack',
      spots: [[-4350, -1025]],
    },
    {
      id: 'p4-r-lower-stone',
      group: 'p4-r-lower-stone/obs',
      tier: 'attack',
      spots: [[-1289, -4351]],
    },
    {
      id: 'p4-r-lower-river-high',
      group: 'p4-r-lower-river-high/obs',
      tier: 'attack',
      spots: [[50, -3750]],
    },
    {
      id: 'p4-d-river-high',
      group: 'p4-d-river-high/obs',
      tier: 'always',
      spots: [[-400, 2400]],
    },
    {
      id: 'p4-r-upper-mid-high',
      group: 'p4-r-upper-mid-high/obs',
      tier: 'attack',
      spots: [[-3403, 700]],
    },
    {
      id: 'p4-d-upper-river-high',
      group: 'p4-d-upper-river-high/obs',
      tier: 'always',
      spots: [[-1150, 3150]],
    },
    {
      id: 'p5-river-rune-upper',
      group: 'p4-river-rune/obs',
      tier: 'always',
      spots: [[-1950, 200]],
    },
    {
      id: 'p5-river-rune-lower',
      group: 'p4-river-rune/obs',
      tier: 'always',
      spots: [[1150, -450]],
    },
    {
      id: 'p5-bot-lane-own',
      group: 'p5-bot-lane-own/obs',
      tier: 'always',
      spots: [[5900, -3300]],
    },
  ],
};

const SENTRY_RADIANT: WardSideData = {
  groupLimits: {
    'base-top-sentry/sentry': 1,
    'base-mid-sentry/sentry': 1,
    'base-bot-sentry/sentry': 1,
    '天辉上野反眼线/sentry': 1,
    '天辉下野反眼线/sentry': 1,
    '下路树林反眼线/sentry': 1,
    '下河道反眼线/sentry': 2,
    'mid-river-sentry/sentry': 1,
    '上河道反眼线/sentry': 2,
    '上路树林反眼线/sentry': 1,
    'd-inner-stone/sentry': 1,
    'p4-mid-river-sentry-a/sentry': 1,
    'p4-mid-river-sentry-b/sentry': 1,
    'p4-d-river-sentry/sentry': 1,
    'p4-r-mid-sentry/sentry': 1,
    'p4-upper-river-sentry/sentry': 1,
    'p4-lower-river-sentry/sentry': 1,
    'p4-top-river-sentry/sentry': 1,
    'p4-d-bot-sentry/sentry': 1,
    'p4-r-woods-sentry/sentry': 1,
  },
  zones: [
    {
      id: 'base-top-sentry',
      group: 'base-top-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_top',
      spots: [[-6500, -3500]],
    },
    {
      id: 'base-mid-sentry',
      group: 'base-mid-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_mid',
      spots: [[-4550, -4300]],
    },
    {
      id: 'base-bot-sentry',
      group: 'base-bot-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_bot',
      spots: [[-3850, -6000]],
    },
    {
      id: 'r-upper-stone-sentry',
      group: '天辉上野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [[-4350, -1025]],
    },
    {
      id: 'r-upper-north-sentry',
      group: '天辉上野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [[-4800, 668]],
    },
    {
      id: 'r-south-river-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'always',
      spots: [[925, -3150]],
    },
    {
      id: 'r-lower-stone-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower2_bot',
      spots: [[-1289, -4351]],
    },
    {
      id: 'bottom-woods-a',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [[5699, -4453]],
    },
    {
      id: 'bottom-woods-b',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [[6470, -5497]],
    },
    {
      id: 's-roshan-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [[2120, -2072]],
    },
    {
      id: 's-east-entrance-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [[3025, -1050]],
    },
    {
      id: 'mid-river-sentry',
      group: 'mid-river-sentry/sentry',
      tier: 'always',
      spots: [[-400, -1000]],
    },
    {
      id: 'n-river-rune',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [[-3100, 1000]],
    },
    {
      id: 'n-pit-sentry',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [[-2500, 2150]],
    },
    {
      id: 'top-woods-a',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [[-5731, 4200]],
    },
    {
      id: 'top-woods-b',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [[-6582, 5452]],
    },
    {
      id: 'd-inner-stone',
      group: 'd-inner-stone/sentry',
      tier: 'always',
      spots: [[4600, 775]],
    },
    {
      id: 'p4-mid-river-sentry-a',
      group: 'p4-mid-river-sentry-a/sentry',
      tier: 'always',
      spots: [[-1150, 650]],
    },
    {
      id: 'p4-mid-river-sentry-b',
      group: 'p4-mid-river-sentry-b/sentry',
      tier: 'always',
      spots: [[350, -750]],
    },
    {
      id: 'p4-d-river-sentry',
      group: 'p4-d-river-sentry/sentry',
      tier: 'attack',
      spots: [[350, 3850]],
    },
    {
      id: 'p4-r-mid-sentry',
      group: 'p4-r-mid-sentry/sentry',
      tier: 'always',
      spots: [[-3850, -3250]],
    },
    {
      id: 'p4-upper-river-sentry',
      group: 'p4-upper-river-sentry/sentry',
      tier: 'attack',
      spots: [[-350, 1350]],
    },
    {
      id: 'p4-lower-river-sentry',
      group: 'p4-lower-river-sentry/sentry',
      tier: 'always',
      spots: [[-450, -4350]],
    },
    {
      id: 'p4-top-river-sentry',
      group: 'p4-top-river-sentry/sentry',
      tier: 'always',
      spots: [[-5750, 3250]],
    },
    {
      id: 'p4-d-bot-sentry',
      group: 'p4-d-bot-sentry/sentry',
      tier: 'attack',
      spots: [[6250, 1650]],
    },
    {
      id: 'p4-r-woods-sentry',
      group: 'p4-r-woods-sentry/sentry',
      tier: 'always',
      spots: [[-2150, -3850]],
    },
  ],
};

const SENTRY_DIRE: WardSideData = {
  groupLimits: {
    'r-upper-stone-sentry/sentry': 1,
    '天辉下野反眼线/sentry': 1,
    '下路树林反眼线/sentry': 1,
    '下河道反眼线/sentry': 2,
    'mid-river-sentry/sentry': 1,
    '上河道反眼线/sentry': 2,
    '上路树林反眼线/sentry': 1,
    'd-inner-stone/sentry': 1,
    'base-top-sentry/sentry': 1,
    'base-mid-sentry/sentry': 1,
    'base-bot-sentry/sentry': 1,
    'p4-mid-river-sentry-a/sentry': 1,
    'p4-mid-river-sentry-b/sentry': 1,
    'p4-d-river-sentry/sentry': 1,
    'p4-r-mid-sentry/sentry': 1,
    'p4-upper-river-sentry/sentry': 1,
    'p4-lower-river-sentry/sentry': 1,
  },
  zones: [
    {
      id: 'r-upper-stone-sentry',
      group: 'r-upper-stone-sentry/sentry',
      tier: 'attack',
      spots: [[-4350, -1025]],
    },
    {
      id: 'r-south-river-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'attack',
      spots: [[1025, -3400]],
    },
    {
      id: 'r-lower-stone-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'attack',
      spots: [[-1289, -4351]],
    },
    {
      id: 'bottom-woods-a',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [[5699, -4453]],
    },
    {
      id: 'bottom-woods-b',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [[6200, -5925]],
    },
    {
      id: 's-roshan-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [[2120, -2072]],
    },
    {
      id: 's-east-entrance-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [[3025, -1050]],
    },
    {
      id: 'mid-river-sentry',
      group: 'mid-river-sentry/sentry',
      tier: 'always',
      spots: [[-325, -890]],
    },
    {
      id: 'n-river-rune',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [[-3100, 1000]],
    },
    {
      id: 'n-pit-sentry',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [[-2500, 2150]],
    },
    {
      id: 'top-woods-a',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [[-5731, 4200]],
    },
    {
      id: 'top-woods-b',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [[-6582, 5452]],
    },
    {
      id: 'd-inner-stone',
      group: 'd-inner-stone/sentry',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [[4600, 775]],
    },
    {
      id: 'base-top-sentry',
      group: 'base-top-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_top',
      spots: [[3500, 5450]],
    },
    {
      id: 'base-mid-sentry',
      group: 'base-mid-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_mid',
      spots: [[4650, 3400]],
    },
    {
      id: 'base-bot-sentry',
      group: 'base-bot-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [[6100, 2700]],
    },
    {
      id: 'p4-mid-river-sentry-a',
      group: 'p4-mid-river-sentry-a/sentry',
      tier: 'always',
      spots: [[-1150, 650]],
    },
    {
      id: 'p4-mid-river-sentry-b',
      group: 'p4-mid-river-sentry-b/sentry',
      tier: 'always',
      spots: [[350, -750]],
    },
    {
      id: 'p4-d-river-sentry',
      group: 'p4-d-river-sentry/sentry',
      tier: 'always',
      spots: [[350, 3850]],
    },
    {
      id: 'p4-r-mid-sentry',
      group: 'p4-r-mid-sentry/sentry',
      tier: 'push',
      tower: 'goodguys_tower2_mid',
      spots: [[-3850, -3250]],
    },
    {
      id: 'p4-upper-river-sentry',
      group: 'p4-upper-river-sentry/sentry',
      tier: 'always',
      spots: [[-350, 1350]],
    },
    {
      id: 'p4-lower-river-sentry',
      group: 'p4-lower-river-sentry/sentry',
      tier: 'attack',
      spots: [[-450, -4350]],
    },
  ],
};

export const OBSERVER_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_observer', 'item_ward_dispenser'],
  wardClassName: 'npc_dota_ward_base',
  sides: { radiant: OBSERVER_RADIANT, dire: OBSERVER_DIRE },
  castRange: 600,
  sameWardRadius: 900,
};

export const SENTRY_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_sentry'],
  wardClassName: 'npc_dota_ward_base_truesight',
  sides: { radiant: SENTRY_RADIANT, dire: SENTRY_DIRE },
  castRange: 600,
  sameWardRadius: 900,
  regularCap: 2,
};
