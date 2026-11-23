/**
 * bot 插眼的眼位与可调参数。眼位按天辉、夜魇各一份，电脑只用本方的。
 * 眼位按区域组织：一个路口、一段河道、一个野区入口算一个区域，区域里 2 到 3 个备选点都经过实机视野与距离检查，
 * 电脑插眼时在备选点里随机选，同一区域同一时间只插一个。
 *
 * 点位要在相对高位：不放高台下面、斜坡、坡脚，边缘点往内移。不放己方基地内与己方防御塔附近。
 * 进攻眼位分两类：塔射程外随时可插，在某座敌塔射程内的要等那座塔被摧毁才启用（requiresDeadTower）。
 */

import type { WardZone } from './ward-decision';

/** 每 N 秒最多尝试一次路过插眼 */
export const PLACE_INTERVAL = 2;

/** 带假眼的电脑为空区域绕路的最大距离，补眼时也只给这个范围内有空区域的电脑买 */
export const WARD_DETOUR_RANGE = 2500;

/** 同一个眼位区域发出插眼命令后，隔这么久才再派人 */
export const WARD_RETRY_SECONDS = 60;

/** 落点随机偏移，避免多个 bot 的眼叠在同一点 */
export const POSITION_JITTER = 50;

export type WardSide = 'radiant' | 'dire';

/** 区域的原始数据：备选点存 [x, y, z]，z 是该处地面高度，运行时再转成 Vector */
export interface WardZoneData {
  id: string;
  /** 进攻眼位：该点在这座敌方防御塔射程内，塔被摧毁后才启用。写塔单位名里的片段，如 'badguys_tower3_mid' */
  requiresDeadTower?: string;
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
        requiresDeadTower: zone.requiresDeadTower,
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
      [2500, -6600, 128],
      [2000, -6400, 128],
    ],
  },
  { id: 'r02', spots: [[-1264, -4364, 384]] },
  {
    id: 'r03',
    spots: [
      [1800, -4600, 256],
      [1200, -4200, 256],
    ],
  },
  { id: 'r04', spots: [[4015, -3945, 128]] },
  {
    id: 'r05',
    spots: [
      [1000, -3200, 256],
      [286, -3993, 256],
    ],
  },
  { id: 'r06', spots: [[6400, -3600, 128]] },
  { id: 'r07', spots: [[-4400, -1000, 512]] },
  { id: 'r08', spots: [[3000, -1500, 256]] },
  { id: 'r09', spots: [[-4600, 600, 256]] },
  {
    id: 'r10',
    spots: [
      [-3400, 400, 256],
      [-3600, -200, 256],
    ],
  },
  { id: 'r11', spots: [[2800, -400, 256]] },
  { id: 'r12', spots: [[-2200, 1800, 0]] },
  { id: 'r13', spots: [[4600, 800, 512]] },
  {
    id: 'r14',
    spots: [
      [-600, 2600, 256],
      [-1200, 2800, 256],
    ],
  },
  { id: 'r15', spots: [[1000, 3600, 384]] },
  {
    id: 'r16',
    spots: [
      [-1600, 3800, 256],
      [-866, 3690, 256],
      [-1800, 3200, 256],
    ],
  },
  { id: 'r17', spots: [[2400, 5200, 128]] },
  { id: 'r18', spots: [[-2405, 5974, 128]] },
  { id: 'r19', spots: [[1400, 6000, 128]] },
  { id: 'ra1', spots: [[3200, 5000, 256]] },
  { id: 'ra2', spots: [[4800, 3000, 256]] },
  { id: 'ra3', spots: [[4200, 6400, 256]] },
  { id: 'rb1', spots: [[4600, 3200, 256]], requiresDeadTower: 'badguys_tower3_mid' },
  { id: 'rb2', spots: [[3400, 5400, 256]], requiresDeadTower: 'badguys_tower3_top' },
  { id: 'rb3', spots: [[3800, 4000, 256]], requiresDeadTower: 'badguys_tower3_mid' },
  { id: 'rb4', spots: [[5800, 3000, 256]], requiresDeadTower: 'badguys_tower3_bot' },
];

const OBSERVER_DIRE: readonly WardZoneData[] = [
  { id: 'd01', spots: [[-2200, -6400, 128]] },
  {
    id: 'd02',
    spots: [
      [2500, -6600, 128],
      [2000, -6400, 128],
    ],
  },
  { id: 'd03', spots: [[-1264, -4364, 384]] },
  { id: 'd04', spots: [[-600, -4200, 136]] },
  {
    id: 'd05',
    spots: [
      [1800, -4600, 256],
      [1200, -4200, 256],
    ],
  },
  { id: 'd06', spots: [[4015, -3945, 128]] },
  {
    id: 'd07',
    spots: [
      [1000, -3200, 256],
      [286, -3993, 256],
    ],
  },
  { id: 'd08', spots: [[-4400, -1000, 512]] },
  { id: 'd09', spots: [[3000, -1500, 256]] },
  { id: 'd10', spots: [[-6800, 600, 128]] },
  { id: 'd11', spots: [[-4600, 600, 256]] },
  {
    id: 'd12',
    spots: [
      [-3400, 400, 256],
      [-3600, -200, 256],
    ],
  },
  { id: 'd13', spots: [[-1800, 0, 128]] },
  { id: 'd14', spots: [[2800, -400, 256]] },
  { id: 'd15', spots: [[-4800, 1800, 128]] },
  { id: 'd16', spots: [[-2600, 1200, 0]] },
  { id: 'd17', spots: [[-6000, 3200, 128]] },
  {
    id: 'd18',
    spots: [
      [-600, 2600, 256],
      [-1200, 2800, 256],
    ],
  },
  { id: 'd19', spots: [[1000, 3600, 384]] },
  {
    id: 'd20',
    spots: [
      [-1600, 3800, 256],
      [-866, 3690, 256],
      [-1800, 3200, 256],
    ],
  },
  { id: 'd21', spots: [[-2405, 5974, 128]] },
  { id: 'da1', spots: [[-5400, -3600, 256]] },
  { id: 'da2', spots: [[-4000, -5200, 256]] },
  { id: 'db1', spots: [[-4800, -3800, 256]], requiresDeadTower: 'goodguys_tower3_mid' },
  { id: 'db2', spots: [[-3650, -5400, 256]], requiresDeadTower: 'goodguys_tower3_bot' },
  { id: 'db3', spots: [[-6000, -3400, 256]], requiresDeadTower: 'goodguys_tower3_top' },
  { id: 'db4', spots: [[-4200, -4600, 256]], requiresDeadTower: 'goodguys_tower3_mid' },
];

const SENTRY_RADIANT: readonly WardZoneData[] = [
  { id: 'rs1', spots: [[2120, -2072, 0]] },
  { id: 'rs2', spots: [[-3117, 1391, 0]] },
  { id: 'rs3', spots: [[-1000, -300, 128]] },
  { id: 'rs4', spots: [[-400, -1000, 128]] },
];

const SENTRY_DIRE: readonly WardZoneData[] = [
  { id: 'ds1', spots: [[3587, -2364, 0]] },
  { id: 'ds2', spots: [[-2286, 1947, 0]] },
  { id: 'ds3', spots: [[-1000, -300, 128]] },
  { id: 'ds4', spots: [[-400, -1000, 128]] },
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
