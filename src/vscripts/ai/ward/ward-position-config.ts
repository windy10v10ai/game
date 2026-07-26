/** bot 插眼的预设眼位与可调参数。眼位按天辉/夜魇分区标注，但代码不按队伍过滤。 */

/** 每 N 秒最多尝试一次，脚下插眼的概率以此为期望间隔基准 */
export const PLACE_INTERVAL = 2;

/** 落点随机偏移，避免多个 bot 的眼叠在同一点 */
export const POSITION_JITTER = 50;

export interface WardTypeConfig {
  /** dispenser 只算假眼：它的假眼充能耗尽后会自动改名成 item_ward_sentry */
  itemNames: readonly string[];
  wardClassName: string;
  /** z 保留高台眼位的原始高度，距离判定只看平面距离 */
  positions: readonly Vector[];
  /** 须与 npc_items_override.txt 的 AbilityCastRange 保持一致 */
  castRange: number;
  /** 该半径内已有己方同类眼则不插，预设眼位与脚下都生效 */
  sameWardRadius: number;
  /** 以下三项只在脚下插眼时判定，预设眼位免检 */
  friendTowerRadius: number;
  friendFortRadius: number;
  enemyTowerRadius: number;
  placeChance: number;
}

const OBSERVER_WARD_POSITIONS: readonly Vector[] = [
  // 天辉
  // 上路
  Vector(-5880, 627, 128),
  // 上路外野区
  Vector(-7544, -1254, 256),
  // 上野区
  Vector(-4363, -1040, 512), // 高台眼位
  Vector(-4759, 686, 256),
  Vector(-5187, -1619, 0),
  Vector(-4640, -1056, 0),
  Vector(-3815, 1577, 256),
  Vector(-4620, -1060, 384),
  Vector(0, 2598, 256),
  // 中路
  Vector(-1445, -2504, 0),
  Vector(-4526.85, -5406.58, 0),
  Vector(-5916, -3984, 0),
  Vector(-5017, -6268, 0),
  Vector(-3545, -6958, 0),
  Vector(1037, -2023, 0),
  Vector(1290, 842, 0),
  Vector(-2567, -1743, 0),
  // 下野区
  Vector(-1264, -4364, 384), // 高台眼位
  Vector(2800, -3087, 0),
  Vector(303, -2584, 0),
  Vector(-510, -3334, 0),
  Vector(1556, -3169, 0),
  Vector(187, -4970, 0),
  Vector(3941, -4017, 0),
  Vector(594, -4149, 0),
  Vector(3876, -4138, 0),
  Vector(1321.6, -2288, 256),
  Vector(1045, -2041, 128),
  // 下路
  Vector(3443, -5779, 0),
  Vector(4445, -5124, 0),
  // 中路河道
  Vector(-1625, -200, 0),
  Vector(74, -1320, 0),
  Vector(-519, 605, 0),
  Vector(-820, -1921, 0),
  // roshan
  Vector(-2142, 1776, 0),
  Vector(-3790, 1583, 0),
  Vector(-2675, 3296, 0),
  // 夜魇
  // 上路
  // 上野区
  Vector(1030, 3589, 384), // 高台眼位
  Vector(-758, 2033, 0),
  Vector(-512, 4094, 0),
  Vector(-2813, 3593, 0),
  Vector(-844, 3131, 0),
  Vector(-1040, 4370, 0),
  Vector(4488, 1319, 0),
  Vector(3825, 4127, 0),
  Vector(-3804, 4120, 0),
  // 中路
  Vector(2190, 4065, 0),
  // 下野区
  Vector(2050, -761, 0),
  Vector(2781, -1575, 0),
  Vector(4612, 768, 0),
  Vector(4024, -1056, 0),
  Vector(3923, -3441, 0),
  Vector(3240.6, 196.2, 0),
  Vector(4517, 1319, 0),
  Vector(3298, -181, 256),
  // 下路
];

const SENTRY_WARD_POSITIONS: readonly Vector[] = [
  // 天辉
  // 上路
  Vector(-6586, -2440, 0),
  Vector(-1998, 6113, 0),
  // 上野区
  // 中路
  Vector(-7036, -5603, 0),
  Vector(-2073, -2417, 0),
  Vector(1290, 842, 0),
  Vector(-2567, -1743, 0),
  // 下野区
  Vector(303, -2584, 0),
  Vector(-510, -3334, 0),
  Vector(1279, -5118, 0),
  Vector(3239, -4273, 0),
  Vector(4540, -4320, 0),
  Vector(2671, -3418, 0),
  // 下路
  Vector(5664, -4000, 0),
  Vector(6435, -5472, 0),
  // 中路河道
  Vector(-1625, -200, 0),
  Vector(74, -1320, 0),
  Vector(-519, 605, 0),
  // roshan
  Vector(-2142, 1776, 0),
  Vector(-2273, 2628, 0),
  Vector(-3308, 3020, 0),
  // 夜魇
  Vector(5251, 2947, 0),
  Vector(3493, 4632, 0),
  // 上路
  Vector(-3300, 5608, 0),
  Vector(-5735, 4089, 0),
  Vector(3825, 4127, 0),
  // 上野区
  Vector(-396, 2521, 0),
  Vector(512, 4094, 0),
  // 中路
  // 下野区
  Vector(4490, -1907, 0),
  Vector(2686, -828, 0),
  Vector(4612, 768, 0),
  Vector(4359, -426, 0),
  // 下路
];

export const OBSERVER_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_observer', 'item_ward_dispenser'],
  wardClassName: 'npc_dota_ward_base',
  positions: OBSERVER_WARD_POSITIONS,
  castRange: 600,
  sameWardRadius: 2400,
  friendTowerRadius: 2100,
  friendFortRadius: 2500,
  enemyTowerRadius: 1200,
  placeChance: 0.2,
};

export const SENTRY_WARD_CONFIG: WardTypeConfig = {
  itemNames: ['item_ward_sentry'],
  wardClassName: 'npc_dota_ward_base_truesight',
  positions: SENTRY_WARD_POSITIONS,
  castRange: 600,
  sameWardRadius: 1500,
  friendTowerRadius: 1200,
  friendFortRadius: 2000,
  enemyTowerRadius: 1200,
  placeChance: 0.2,
};
