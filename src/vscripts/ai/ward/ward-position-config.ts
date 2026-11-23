/**
 * bot 插眼的眼位与可调参数。眼位按天辉、夜魇各一份，电脑只用本方的，真眼假眼各一份。
 * 眼位分三层：组（group）→ 区（zone）→ 备选点（spot）。
 * 一个组是同一条路线上互相替代的几个区，同时最多 groupLimits[组] 只本方同种眼。
 * 一个区是一个路口、一段河道、一个野区入口，2 个备选点经过实机插眼验证，同一区同时最多一只眼。
 * 组有空槽时，从已启用且未占用的区里等概率抽一个当前目标区，再在区内等概率抽备选点。
 *
 * 档位 tier 决定区何时启用，tower 是绑定的防御塔：
 * always 与 attack 随时启用。defend 绑定己方塔，push 绑定敌方塔，塔被摧毁后才启用。
 * 眼位表来自逐点实机插眼的结果，坐标照搬，附近位置有游戏禁插区，不要手改。
 */

import type { WardTier, WardZone } from './ward-decision';

/** 每 N 秒最多尝试一次路过插眼 */
export const PLACE_INTERVAL = 2;

/** 带假眼的电脑为空区域绕路的最大距离，补眼时也只给这个范围内有目标区的电脑买 */
export const WARD_DETOUR_RANGE = 2500;

/** 同一个眼位区域发出插眼命令后，隔这么久才再派人 */
export const WARD_RETRY_SECONDS = 60;

/** 组的当前目标区抽出后，这么久还没插下就重抽，避免目标偏远、没人路过时卡死 */
export const WARD_TARGET_SECONDS = 90;

/** 落点随机偏移，避免多个 bot 的眼叠在同一点 */
export const POSITION_JITTER = 50;

export type WardSide = 'radiant' | 'dire';

/** 区的原始数据：备选点存 [x, y]，地面高度运行时再取 */
export interface WardZoneData {
  id: string;
  group: string;
  tier: WardTier;
  /** defend 绑定己方塔，push 绑定敌方塔，写塔单位名里的片段，如 'badguys_tower3_mid' */
  tower?: string;
  spots: ReadonlyArray<readonly [number, number]>;
}

export interface WardSideData {
  /** 组 id → 同时最多几只眼 */
  groupLimits: Readonly<Record<string, number>>;
  zones: readonly WardZoneData[];
}

export interface WardTypeConfig {
  /** dispenser 只算假眼：它的假眼充能耗尽后会自动改名成 item_ward_sentry */
  itemNames: readonly string[];
  wardClassName: string;
  sides: Record<WardSide, WardSideData>;
  /** 须与 npc_items_override.txt 的 AbilityCastRange 保持一致 */
  castRange: number;
  /** 该半径内已有己方同类眼则该区算占用 */
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
    '上河道视野线/obs': 1,
    '夜魇下野外围入口线/obs': 1,
    '下河道视野线/obs': 2,
    '夜魇上野绕后线/obs': 1,
    '夜魇上野靠河入口线/obs': 2,
    '夜魇下野内圈入口线/obs': 2,
    'd-exterior-east/obs': 1,
    'd-push-top/obs': 1,
    'd-push-mid/obs': 1,
    'd-push-bot/obs': 1,
  },
  zones: [
    {
      id: 'base-top-obs',
      group: 'base-top-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_top',
      spots: [
        [-6480, -3820],
        [-6675, -4100],
      ],
    },
    {
      id: 'base-mid-obs',
      group: 'base-mid-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_mid',
      spots: [
        [-4270, -4116],
        [-4550, -4300],
      ],
    },
    {
      id: 'base-bot-obs',
      group: 'base-bot-obs/obs',
      tier: 'defend',
      tower: 'goodguys_tower3_bot',
      spots: [
        [-4530, -5890],
        [-3950, -6300],
      ],
    },
    {
      id: 'r-upper-stone',
      group: '天辉上野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [
        [-4350, -1025],
        [-3800, -675],
      ],
    },
    {
      id: 'r-upper-north',
      group: '天辉上野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [
        [-4800, 668],
        [-4550, 75],
      ],
    },
    {
      id: 'r-upper-mid',
      group: '天辉上野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_mid',
      spots: [
        [-3403, 700],
        [-3750, 625],
      ],
    },
    {
      id: 'r-south-river-ramp',
      group: '天辉下野入口线/obs',
      tier: 'always',
      spots: [
        [1276, -3153],
        [925, -3150],
      ],
    },
    {
      id: 'r-lower-stone',
      group: '天辉下野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower2_bot',
      spots: [
        [-1289, -4351],
        [-1425, -4675],
      ],
    },
    {
      id: 'r-lower-platform',
      group: '天辉下野入口线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [
        [286, -3993],
        [50, -3750],
      ],
    },
    {
      id: 'r-south-flank',
      group: '天辉下路回撤线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [
        [2978, -4790],
        [2071, -4855],
      ],
    },
    {
      id: 'r-lower-lane',
      group: '天辉下路回撤线/obs',
      tier: 'defend',
      tower: 'goodguys_tower1_bot',
      spots: [
        [2500, -6600],
        [2000, -6400],
      ],
    },
    {
      id: 'd-lower-road',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [
        [4015, -3945],
        [3775, -3700],
      ],
    },
    {
      id: 'd-lower-lane',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [
        [6400, -3600],
        [6400, -3950],
      ],
    },
    {
      id: 'r-river-entrances',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [297, -2366],
        [377, -1596],
      ],
    },
    {
      id: 's-roshan-river',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [2120, -2072],
        [2400, -2275],
      ],
    },
    {
      id: 's-east-entrance',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [2788, -1288],
        [3025, -1050],
      ],
    },
    {
      id: 'n-river-mid',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [
        [-450, 1326],
        [-775, 1200],
      ],
    },
    {
      id: 'n-river-low',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [
        [-2200, 1800],
        [-2075, 2125],
      ],
    },
    {
      id: 'd-upper-lane',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [
        [-2405, 5974],
        [-2850, 5300],
      ],
    },
    {
      id: 'd-upper-jungle',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [
        [2400, 4232],
        [2600, 3950],
      ],
    },
    {
      id: 'd-upper-ramp',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [
        [-600, 2600],
        [-1250, 2710],
      ],
    },
    {
      id: 'd-upper-outpost-edge',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [
        [-866, 3690],
        [-525, 3625],
      ],
    },
    {
      id: 'd-upper-stone',
      group: '夜魇上野靠河入口线/obs',
      tier: 'attack',
      spots: [
        [1025, 3575],
        [675, 3500],
      ],
    },
    {
      id: 'd-upper-backlane',
      group: '夜魇上野绕后线/obs',
      tier: 'attack',
      spots: [
        [1400, 6000],
        [1700, 5800],
      ],
    },
    {
      id: 'd-inner-stone-obs',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [
        [4600, 775],
        [4850, 1025],
      ],
    },
    {
      id: 'd-lower-jungle',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [
        [5033, -247],
        [4700, -375],
      ],
    },
    {
      id: 'd-lower-jungle-west',
      group: '夜魇下野内圈入口线/obs',
      tier: 'attack',
      spots: [
        [3652, 909],
        [3575, 575],
      ],
    },
    {
      id: 'd-lower-entrance',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [
        [4616, -1901],
        [4800, -1600],
      ],
    },
    {
      id: 'd-lower-edge',
      group: '夜魇下野外围入口线/obs',
      tier: 'attack',
      spots: [
        [7987, 620],
        [8050, 975],
      ],
    },
    {
      id: 'd-exterior-east',
      group: 'd-exterior-east/obs',
      tier: 'attack',
      spots: [
        [7090, 4100],
        [6775, 4225],
      ],
    },
    {
      id: 'd-push-top',
      group: 'd-push-top/obs',
      tier: 'push',
      tower: 'badguys_tower3_top',
      spots: [
        [3400, 5400],
        [3200, 5000],
      ],
    },
    {
      id: 'd-push-mid',
      group: 'd-push-mid/obs',
      tier: 'push',
      tower: 'badguys_tower3_mid',
      spots: [
        [4600, 3200],
        [3860, 3940],
      ],
    },
    {
      id: 'd-push-bot',
      group: 'd-push-bot/obs',
      tier: 'push',
      tower: 'badguys_tower3_bot',
      spots: [
        [5800, 3000],
        [6125, 3125],
      ],
    },
  ],
};

const OBSERVER_DIRE: WardSideData = {
  groupLimits: {
    'r-push-top/obs': 1,
    'r-push-mid/obs': 1,
    'r-push-bot/obs': 1,
    '天辉上野入侵线/obs': 1,
    '天辉下野入侵线/obs': 1,
    '天辉下路绕行线/obs': 1,
    '上河道视野线/obs': 1,
    '下河道视野线/obs': 2,
    '上路外侧进出线/obs': 1,
    '夜魇上野入口线/obs': 1,
    '夜魇下野内圈入口线/obs': 2,
    '夜魇下野外围入口线/obs': 1,
    'base-top-obs/obs': 1,
    'base-mid-obs/obs': 1,
    'base-bot-obs/obs': 1,
    'd-exterior-east/obs': 1,
  },
  zones: [
    {
      id: 'r-push-top',
      group: 'r-push-top/obs',
      tier: 'push',
      tower: 'goodguys_tower3_top',
      spots: [
        [-6480, -3820],
        [-6675, -4100],
      ],
    },
    {
      id: 'r-push-mid',
      group: 'r-push-mid/obs',
      tier: 'push',
      tower: 'goodguys_tower3_mid',
      spots: [
        [-4420, -4250],
        [-4750, -4000],
      ],
    },
    {
      id: 'r-push-bot',
      group: 'r-push-bot/obs',
      tier: 'push',
      tower: 'goodguys_tower3_bot',
      spots: [
        [-4530, -5890],
        [-3950, -6300],
      ],
    },
    {
      id: 'r-upper-mid',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [
        [-3195, -1258],
        [-3475, -1075],
      ],
    },
    {
      id: 'r-upper-west',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [
        [-5314, -1483],
        [-4975, -1475],
      ],
    },
    {
      id: 'r-upper-outer',
      group: '天辉上野入侵线/obs',
      tier: 'attack',
      spots: [
        [-7786, -1146],
        [-7775, -1500],
      ],
    },
    {
      id: 'r-south-river-ramp',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [
        [1276, -3153],
        [1025, -3400],
      ],
    },
    {
      id: 'r-lower-jungle',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [
        [-2360, -6348],
        [-2675, -6475],
      ],
    },
    {
      id: 'r-lower-mid',
      group: '天辉下野入侵线/obs',
      tier: 'attack',
      spots: [
        [-3115, -4052],
        [-3125, -4550],
      ],
    },
    {
      id: 'r-south-flank',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [
        [2978, -4790],
        [2071, -4855],
      ],
    },
    {
      id: 'r-bottom-lane',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [
        [3275, -6139],
        [3575, -6325],
      ],
    },
    {
      id: 'r-bottom-wild',
      group: '天辉下路绕行线/obs',
      tier: 'attack',
      spots: [
        [5218, -4806],
        [5275, -4475],
      ],
    },
    {
      id: 'r-river-entrances',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [297, -2366],
        [377, -1596],
      ],
    },
    {
      id: 's-roshan-river',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [2120, -2072],
        [2400, -2275],
      ],
    },
    {
      id: 's-east-entrance',
      group: '下河道视野线/obs',
      tier: 'always',
      spots: [
        [2788, -1288],
        [3025, -1050],
      ],
    },
    {
      id: 'n-river-mid',
      group: '上河道视野线/obs',
      tier: 'always',
      spots: [
        [-450, 1326],
        [-775, 1200],
      ],
    },
    {
      id: 'n-river-west',
      group: '上河道视野线/obs',
      tier: 'attack',
      spots: [
        [-4583, 1904],
        [-4225, 1025],
      ],
    },
    {
      id: 'n-lane-entrances',
      group: '上河道视野线/obs',
      tier: 'attack',
      spots: [
        [-4214, 3783],
        [-4551, 4682],
      ],
    },
    {
      id: 'n-lane-west',
      group: '上路外侧进出线/obs',
      tier: 'attack',
      spots: [
        [-5595, 3141],
        [-5875, 3325],
      ],
    },
    {
      id: 'n-lane-north',
      group: '上路外侧进出线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_top',
      spots: [
        [-3998, 7138],
        [-3925, 6800],
      ],
    },
    {
      id: 'd-upper-jungle',
      group: '夜魇上野入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_top',
      spots: [
        [2400, 4232],
        [3275, 4600],
      ],
    },
    {
      id: 'n-jungle-west',
      group: '夜魇上野入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_top',
      spots: [
        [-2818, 4377],
        [-2675, 4700],
      ],
    },
    {
      id: 'd-inner-stone-obs',
      group: '夜魇下野内圈入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [
        [4600, 775],
        [4850, 1025],
      ],
    },
    {
      id: 'd-lower-jungle',
      group: '夜魇下野内圈入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [
        [5033, -247],
        [4700, -375],
      ],
    },
    {
      id: 'd-lower-jungle-west',
      group: '夜魇下野内圈入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_mid',
      spots: [
        [3652, 909],
        [3575, 575],
      ],
    },
    {
      id: 'd-lower-entrance',
      group: '夜魇下野外围入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower1_bot',
      spots: [
        [4616, -1901],
        [4800, -1600],
      ],
    },
    {
      id: 'd-lower-edge',
      group: '夜魇下野外围入口线/obs',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [
        [7987, 620],
        [8050, 975],
      ],
    },
    {
      id: 'base-top-obs',
      group: 'base-top-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_top',
      spots: [
        [3800, 5750],
        [3550, 6000],
      ],
    },
    {
      id: 'base-mid-obs',
      group: 'base-mid-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_mid',
      spots: [
        [4540, 3980],
        [4850, 3975],
      ],
    },
    {
      id: 'base-bot-obs',
      group: 'base-bot-obs/obs',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [
        [6000, 3210],
        [6175, 2950],
      ],
    },
    {
      id: 'd-exterior-east',
      group: 'd-exterior-east/obs',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [
        [6831, 3895],
        [6625, 4175],
      ],
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
    '上河道反眼线/sentry': 2,
    '下河道反眼线/sentry': 2,
    'mid-river-sentry/sentry': 1,
    '下路树林反眼线/sentry': 1,
    '上路树林反眼线/sentry': 1,
    'd-inner-stone/sentry': 1,
  },
  zones: [
    {
      id: 'base-top-sentry',
      group: 'base-top-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_top',
      spots: [
        [-6480, -3820],
        [-6675, -4100],
      ],
    },
    {
      id: 'base-mid-sentry',
      group: 'base-mid-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_mid',
      spots: [
        [-4270, -4116],
        [-4550, -4300],
      ],
    },
    {
      id: 'base-bot-sentry',
      group: 'base-bot-sentry/sentry',
      tier: 'defend',
      tower: 'goodguys_tower3_bot',
      spots: [
        [-4530, -5890],
        [-3950, -6300],
      ],
    },
    {
      id: 'r-upper-stone-sentry',
      group: '天辉上野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [
        [-4350, -1025],
        [-4800, -825],
      ],
    },
    {
      id: 'r-upper-north-sentry',
      group: '天辉上野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower1_top',
      spots: [
        [-4800, 668],
        [-5000, 950],
      ],
    },
    {
      id: 'r-south-river-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'always',
      spots: [
        [1276, -3153],
        [925, -3150],
      ],
    },
    {
      id: 'r-lower-stone-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'defend',
      tower: 'goodguys_tower2_bot',
      spots: [
        [-1289, -4351],
        [-1425, -4675],
      ],
    },
    {
      id: 'bottom-woods-a',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [5699, -4453],
        [6711, -4533],
      ],
    },
    {
      id: 'bottom-woods-b',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [6470, -5497],
        [6200, -5925],
      ],
    },
    {
      id: 's-roshan-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [
        [2120, -2072],
        [2400, -2275],
      ],
    },
    {
      id: 's-east-entrance-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [
        [2788, -1288],
        [3025, -1050],
      ],
    },
    {
      id: 'mid-river-sentry',
      group: 'mid-river-sentry/sentry',
      tier: 'always',
      spots: [
        [-1000, -300],
        [-400, -1000],
      ],
    },
    {
      id: 'n-river-rune',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [
        [-2818, 1182],
        [-3100, 1000],
      ],
    },
    {
      id: 'n-pit-sentry',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [
        [-3450, 1900],
        [-2500, 2150],
      ],
    },
    {
      id: 'top-woods-a',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [-5731, 4200],
        [-6609, 4457],
      ],
    },
    {
      id: 'top-woods-b',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [-6582, 5452],
        [-6450, 5775],
      ],
    },
    {
      id: 'd-inner-stone',
      group: 'd-inner-stone/sentry',
      tier: 'always',
      spots: [
        [4600, 775],
        [4850, 1025],
      ],
    },
  ],
};

const SENTRY_DIRE: WardSideData = {
  groupLimits: {
    'r-upper-stone-sentry/sentry': 1,
    '天辉下野反眼线/sentry': 1,
    '上河道反眼线/sentry': 2,
    '下河道反眼线/sentry': 2,
    'mid-river-sentry/sentry': 1,
    '下路树林反眼线/sentry': 1,
    '上路树林反眼线/sentry': 1,
    'd-inner-stone/sentry': 1,
    'base-top-sentry/sentry': 1,
    'base-mid-sentry/sentry': 1,
    'base-bot-sentry/sentry': 1,
  },
  zones: [
    {
      id: 'r-upper-stone-sentry',
      group: 'r-upper-stone-sentry/sentry',
      tier: 'attack',
      spots: [
        [-4350, -1025],
        [-4800, -825],
      ],
    },
    {
      id: 'r-south-river-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'attack',
      spots: [
        [1276, -3153],
        [1025, -3400],
      ],
    },
    {
      id: 'r-lower-stone-sentry',
      group: '天辉下野反眼线/sentry',
      tier: 'attack',
      spots: [
        [-1289, -4351],
        [-1425, -4675],
      ],
    },
    {
      id: 'bottom-woods-a',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [5699, -4453],
        [6711, -4533],
      ],
    },
    {
      id: 'bottom-woods-b',
      group: '下路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [6470, -5497],
        [6200, -5925],
      ],
    },
    {
      id: 's-roshan-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [
        [2120, -2072],
        [2400, -2275],
      ],
    },
    {
      id: 's-east-entrance-sentry',
      group: '下河道反眼线/sentry',
      tier: 'always',
      spots: [
        [2788, -1288],
        [3025, -1050],
      ],
    },
    {
      id: 'mid-river-sentry',
      group: 'mid-river-sentry/sentry',
      tier: 'always',
      spots: [
        [-1000, -300],
        [-325, -890],
      ],
    },
    {
      id: 'n-river-rune',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [
        [-2818, 1182],
        [-3100, 1000],
      ],
    },
    {
      id: 'n-pit-sentry',
      group: '上河道反眼线/sentry',
      tier: 'always',
      spots: [
        [-3450, 1900],
        [-2500, 2150],
      ],
    },
    {
      id: 'top-woods-a',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [-5731, 4200],
        [-6609, 4457],
      ],
    },
    {
      id: 'top-woods-b',
      group: '上路树林反眼线/sentry',
      tier: 'always',
      spots: [
        [-6582, 5452],
        [-6450, 5775],
      ],
    },
    {
      id: 'd-inner-stone',
      group: 'd-inner-stone/sentry',
      tier: 'defend',
      tower: 'badguys_tower2_bot',
      spots: [
        [4600, 775],
        [4850, 1025],
      ],
    },
    {
      id: 'base-top-sentry',
      group: 'base-top-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_top',
      spots: [
        [3800, 5750],
        [3550, 6000],
      ],
    },
    {
      id: 'base-mid-sentry',
      group: 'base-mid-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_mid',
      spots: [
        [4540, 3980],
        [4850, 3975],
      ],
    },
    {
      id: 'base-bot-sentry',
      group: 'base-bot-sentry/sentry',
      tier: 'defend',
      tower: 'badguys_tower3_bot',
      spots: [
        [6000, 3210],
        [6125, 3525],
      ],
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
};
