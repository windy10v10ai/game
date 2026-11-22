/**
 * bot 插眼的眼位与可调参数。眼位按天辉、夜魇各一份，电脑只用本方的。
 * 眼位按区域组织：一个路口、一段河道、一个野区入口算一个区域，区域里 2 到 3 个备选点都经过实机视野与距离检查，
 * 电脑插眼时在备选点里随机选，同一区域同一时间只插一个。
 *
 * 假眼点位的距离规则（实机逐点核对过）：离己方基地不小于 2500、离己方防御塔不小于 2100、离敌方防御塔不小于 1200，
 * 且不在肉山坑禁眼圈内。
 */

import type { WardZone } from './ward-decision';

/** 每 N 秒最多尝试一次路过插眼 */
export const PLACE_INTERVAL = 2;

/** 落点随机偏移，避免多个 bot 的眼叠在同一点 */
export const POSITION_JITTER = 50;

export type WardSide = 'radiant' | 'dire';

/** 区域的原始数据：备选点存 [x, y, z]，z 是该处地面高度，运行时再转成 Vector */
export interface WardZoneData {
  id: string;
  spots: ReadonlyArray<readonly [number, number, number]>;
}

export interface WardTypeConfig {
  /** dispenser 只算假眼：它的假眼充能耗尽后会自动改名成 item_ward_sentry */
  itemNames: readonly string[];
  wardClassName: string;
  zones: Record<WardSide, readonly WardZoneData[]>;
  /** 须与 npc_items_override.txt 的 AbilityCastRange 保持一致 */
  castRange: number;
  /** 该半径内已有己方同类眼则不插，同一区域的备选点互相都在这个距离内 */
  sameWardRadius: number;
}

const converted = new Map<WardTypeConfig, Record<WardSide, readonly WardZone[]>>();

/** 首次调用时才建 Vector：引擎全局在模块加载时可能还没就绪，单测里也没有 */
export function getWardZones(config: WardTypeConfig, side: WardSide): readonly WardZone[] {
  let sides = converted.get(config);
  if (!sides) {
    const build = (data: readonly WardZoneData[]): readonly WardZone[] =>
      data.map((zone) => ({
        id: zone.id,
        spots: zone.spots.map(([x, y, z]) => Vector(x, y, z)),
      }));
    sides = { radiant: build(config.zones.radiant), dire: build(config.zones.dire) };
    converted.set(config, sides);
  }
  return sides[side];
}

const OBSERVER_RADIANT: readonly WardZoneData[] = [
  {
    id: 'r01',
    spots: [
      [-4363, -1040, 512],
      [-4363, -440, 256],
      [-3800, -650, 256],
    ],
  },
  { id: 'r02', spots: [[4612, 768, 512]] },
  {
    id: 'r03',
    spots: [
      [1030, 3589, 384],
      [400, 3550, 136],
    ],
  },
  {
    id: 'r04',
    spots: [
      [261, -4093, 256],
      [824, -3726, 256],
    ],
  },
  {
    id: 'r05',
    spots: [
      [1279, -4618, 251],
      [1939, -4793, 256],
      [1800, -4150, 256],
    ],
  },
  {
    id: 'r06',
    spots: [
      [-3311, 807, 228],
      [-3866, 578, 256],
    ],
  },
  { id: 'r07', spots: [[2604, -1398, 219]] },
  {
    id: 'r08',
    spots: [
      [-866, 3740, 256],
      [-1094, 3131, 256],
      [-1466, 3740, 256],
    ],
  },
  {
    id: 'r09',
    spots: [
      [2639, -6543, 128],
      [2076, -6176, 128],
    ],
  },
  {
    id: 'r10',
    spots: [
      [750, -1700, 91],
      [1450, -2050, 0],
    ],
  },
  {
    id: 'r11',
    spots: [
      [6293, -3589, 128],
      [5650, -3450, 128],
    ],
  },
  {
    id: 'r12',
    spots: [
      [-2305, 5974, 128],
      [-2248, 6713, 128],
    ],
  },
  { id: 'r13', spots: [[6561, -943, 128]] },
  {
    id: 'r14',
    spots: [
      [-380, 748, 128],
      [-943, 1229, 128],
    ],
  },
  { id: 'r15', spots: [[2443, 4811, 128]] },
  {
    id: 'r16',
    spots: [
      [4015, -3945, 128],
      [3923, -3191, 0],
    ],
  },
  {
    id: 'r17',
    spots: [
      [-6535, 4089, 128],
      [-6235, 4689, 128],
    ],
  },
  { id: 'r18', spots: [[-6657, 6211, 128]] },
  {
    id: 'r19',
    spots: [
      [1400, 5650, 128],
      [928, 5234, 128],
    ],
  },
  { id: 'r20', spots: [[-2107, 1589, 0]] },
  {
    id: 'r21',
    spots: [
      [3257, -89, 256],
      [3594, 550, 256],
    ],
  },
  { id: 'r22', spots: [[-3800, 3550, 91]] },
  { id: 'r23', spots: [[4543, -1911, 128]] },
];

const OBSERVER_DIRE: readonly WardZoneData[] = [
  {
    id: 'd01',
    spots: [
      [-4363, -1040, 512],
      [-4363, -440, 256],
      [-3800, -650, 256],
    ],
  },
  {
    id: 'd02',
    spots: [
      [-1264, -4364, 384],
      [-1264, -3764, 128],
    ],
  },
  {
    id: 'd03',
    spots: [
      [1030, 3589, 384],
      [400, 3550, 136],
    ],
  },
  {
    id: 'd04',
    spots: [
      [261, -4093, 256],
      [824, -3726, 256],
    ],
  },
  {
    id: 'd05',
    spots: [
      [-6039, 3257, 128],
      [-5550, 2850, 128],
    ],
  },
  {
    id: 'd06',
    spots: [
      [1279, -4618, 251],
      [1939, -4793, 256],
      [1800, -4150, 256],
    ],
  },
  {
    id: 'd07',
    spots: [
      [-3311, 807, 228],
      [-3866, 578, 256],
    ],
  },
  { id: 'd08', spots: [[2604, -1398, 219]] },
  {
    id: 'd09',
    spots: [
      [-866, 3740, 256],
      [-1094, 3131, 256],
      [-1466, 3740, 256],
    ],
  },
  {
    id: 'd10',
    spots: [
      [-6680, 627, 128],
      [-5956, 203, 128],
    ],
  },
  {
    id: 'd11',
    spots: [
      [2639, -6543, 128],
      [2076, -6176, 128],
    ],
  },
  {
    id: 'd12',
    spots: [
      [750, -1700, 91],
      [1450, -2050, 0],
    ],
  },
  {
    id: 'd13',
    spots: [
      [-2305, 5974, 128],
      [-2248, 6713, 128],
    ],
  },
  {
    id: 'd14',
    spots: [
      [-6093, -2029, 128],
      [-6832, -2086, 128],
    ],
  },
  {
    id: 'd15',
    spots: [
      [-2050, -6250, 128],
      [-2650, -6250, 128],
      [-2050, -5650, 128],
    ],
  },
  {
    id: 'd16',
    spots: [
      [4015, -3945, 128],
      [3923, -3191, 0],
    ],
  },
  {
    id: 'd17',
    spots: [
      [6046, -5083, 128],
      [6000, -5900, 128],
    ],
  },
  { id: 'd18', spots: [[-2107, 1589, 0]] },
  { id: 'd19', spots: [[-1766, 222, 128]] },
  { id: 'd20', spots: [[-2390, -1566, 128]] },
  { id: 'd21', spots: [[3257, -89, 256]] },
  { id: 'd22', spots: [[-3800, 3550, 91]] },
];

const SENTRY_RADIANT: readonly WardZoneData[] = [
  { id: 'sentry-pit-low', spots: [[2120, -2072, 0]] },
  { id: 'sentry-pit-up', spots: [[-3117, 1391, 0]] },
  { id: 'sentry-river-a', spots: [[-1625, -200, 128]] },
  { id: 'sentry-river-b', spots: [[74, -1320, 128]] },
];

const SENTRY_DIRE: readonly WardZoneData[] = [
  { id: 'sentry-pit-low', spots: [[3587, -2364, 0]] },
  { id: 'sentry-pit-up', spots: [[-2286, 1947, 0]] },
  { id: 'sentry-river-a', spots: [[-1625, -200, 128]] },
  { id: 'sentry-river-b', spots: [[74, -1320, 128]] },
];

export const OBSERVER_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_observer', 'item_ward_dispenser'],
  wardClassName: 'npc_dota_ward_base',
  zones: { radiant: OBSERVER_RADIANT, dire: OBSERVER_DIRE },
  castRange: 600,
  sameWardRadius: 900,
};

export const SENTRY_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_sentry'],
  wardClassName: 'npc_dota_ward_base_truesight',
  zones: { radiant: SENTRY_RADIANT, dire: SENTRY_DIRE },
  castRange: 600,
  sameWardRadius: 900,
};
