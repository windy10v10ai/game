import { GA4TreasureTracker, TreasureTier } from '../../api/analytics/ga4/ga4-treasure-tracker';
import { modifier_treasure_chest } from '../../modifiers/global/modifier_treasure_chest';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class Treasure {
  static readonly UNIT_NAME = 'npc_treasure_chest';
  static readonly RESPAWN_INTERVAL = 180;
  static readonly MAX_ACTIVE_CHESTS = 1;
  static readonly Z_SINK = 64;
  static readonly OPEN_PARTICLE = 'particles/items2_fx/hand_of_midas.vpcf';
  static readonly OPEN_SOUND = 'ui.treasure_01';

  // 开局点位：仅天辉高地附近，开局走两步就能看到
  static readonly SPAWN_POINTS_INITIAL: Vector[] = [
    Vector(-7343, -5279, 256), // 高低左近
    Vector(-7492, -3646, 256), // 高地左远
    Vector(-5527, -6858, 256), // 高地右近
    Vector(-4367, -7499, 262), // 高地右远
  ];

  // 中期点位：天辉野区
  // 这些点位都在空旷位置，很容易找到
  static readonly SPAWN_POINTS_RADIANT_EASY: Vector[] = [
    // 天辉上路外野区
    Vector(-8590, 1771, 0),

    // 天辉远古野区
    Vector(-5235, -726, 256),
    Vector(-5491, 167, 128),
    Vector(-5301, 1588, 128),

    // 天辉下路主野区
    Vector(-1829, -2422, 128),
    Vector(-2488, -4818, 128),
    Vector(-2208, -4192, 128),
    Vector(4761, -4554, 128),

    // 天辉下路外野区
    Vector(2039, -7166, 128),
    Vector(-1927, -8665, 128),
    Vector(-3, -8447, 128),
    Vector(6368, -8416, 0),

    // 夜魇上路外野区
    Vector(-7497, 3299, 128),
  ];

  // 中期点位：天辉野区
  // 这些点位都在树丛里，视觉上更隐蔽一些
  static readonly SPAWN_POINTS_RADIANT_JUNGLE: Vector[] = [
    // 天辉左侧外野区
    Vector(-8345, -2464, 256),
    Vector(-7424, -421, 256),
    Vector(-7157, 1058, 128),
    Vector(-6837, 2328, 128),

    // 天辉远古野区
    Vector(-5285, -207, 256),
    Vector(-2137, -319, 128),
    Vector(-2061, -847, 128),

    // 天辉下路主野区
    Vector(-3597, -4776, 128),
    Vector(1866, -3496, 256),
    Vector(3033, -4200, 256),
    Vector(2573, -5352, 256),

    // 天辉下路外野区
    Vector(-360, -8686, 128),
    Vector(7692, -7822, 256),

    // 夜魇上路外野区
    Vector(-7456, 3552, 128),
  ];

  // 后期点位：天辉野区
  // 这些点位都在阴间位置，很难找到
  static readonly SPAWN_POINTS_RADIANT_HARD: Vector[] = [
    // 天辉左侧外野区
    Vector(-8672, -2592, 256),
    Vector(-8416, 96, 256),

    // 天辉下路主野区
    Vector(4332, -3348, 128),
    Vector(-224, -2464, 256),

    // 天辉下路外野区
    Vector(8472, -4897, 128),

    // 夜魇上路外野区
    Vector(-6720, 8310, 256),
    Vector(1041, 8227, 128),

    // 夜魇上路主野区
    Vector(-3470, 5430, 128),

    // 夜魇下路外野区
    Vector(7200, 1312, 128),

    // 夜魇高地
    Vector(7320, 2627, 256),
    Vector(3765, 7214, 262),
  ];

  // value 是 spawn 时使用的原始 Vector 引用，open 时回查 tier 用
  private activeChests: Map<EntityIndex, Vector> = new Map();
  private spawnCount = 0;

  constructor() {
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        const state = GameRules.State_Get();
        if (state === GameState.PRE_GAME) {
          this.spawnOne();
        } else if (state === GameState.GAME_IN_PROGRESS) {
          Timers.CreateTimer(Treasure.RESPAWN_INTERVAL, () => {
            this.spawnOne();
            return Treasure.RESPAWN_INTERVAL;
          });
        }
      },
      undefined,
    );
  }

  spawnOne(): void {
    // 增加场上同时存在的最大个数兜底，避免玩家完全找不到第一只
    if (this.activeChests.size >= Treasure.MAX_ACTIVE_CHESTS) {
      return;
    }
    this.spawnAt(this.getRandomSpawnPoint());
  }

  debugSpawnAt(point: Vector): void {
    this.spawnAt(point);
  }

  /** 调试用 */
  debugSpawnInitial(): void {
    // 按照正常逻辑刷新下一个
    this.spawnOne();
  }

  private spawnAt(point: Vector): void {
    const chest = CreateUnitByName(
      Treasure.UNIT_NAME,
      point,
      true,
      undefined,
      undefined,
      DotaTeam.NEUTRALS,
    );
    if (!chest) {
      return;
    }
    chest.SetIdleAcquire(false);
    chest.SetAcquisitionRange(0);
    chest.AddNewModifier(chest, undefined, modifier_treasure_chest.name, {});
    // 绕过 CreateUnitByName 的地面 snap，让模型整体下降避免悬空
    const origin = chest.GetAbsOrigin();
    chest.SetAbsOrigin(Vector(origin.x, origin.y, origin.z - Treasure.Z_SINK));
    this.activeChests.set(chest.GetEntityIndex(), point);
    this.spawnCount++;
    print(`[Treasure] #${this.spawnCount} spawned at (${point.x}, ${point.y}, ${point.z})`);
  }

  openChest(chest: CDOTA_BaseNPC, opener: CDOTA_BaseNPC): void {
    const entIndex = chest.GetEntityIndex();
    const point = this.activeChests.get(entIndex);
    if (point === undefined) return;
    this.activeChests.delete(entIndex);

    const fx = ParticleManager.CreateParticle(
      Treasure.OPEN_PARTICLE,
      ParticleAttachment.ABSORIGIN,
      chest,
    );
    ParticleManager.ReleaseParticleIndex(fx);
    EmitSoundOn(Treasure.OPEN_SOUND, chest);
    UTIL_Remove(chest);
    print(`[Treasure] opened by ${opener.GetUnitName()}`);

    const pointTier = Treasure.getPointTier(point);
    GA4TreasureTracker.SendOpen(opener, this.spawnCount, point, pointTier);
    GameRules.Lottery.Item.onTriggered(opener, pointTier === TreasureTier.INITIAL);
  }

  getRandomSpawnPoint(): Vector {
    const pool = this.pickPool();
    // 避开场上已有 treasure 占用的点位；过滤后为空时回退到原池
    const occupied = new Set(this.activeChests.values());
    const candidates = pool.filter((p) => !occupied.has(p));
    const finalPool = candidates.length > 0 ? candidates : pool;
    const index = RandomInt(0, finalPool.length - 1);
    return finalPool[index];
  }

  // spawnCount = 0 开局 → 1-3 EASY → 4-6 JUNGLE → 7+ JUNGLE+HARD 合并（HARD 主导，JUNGLE 兜底防重复）
  private pickPool(): Vector[] {
    if (this.spawnCount === 0) return Treasure.SPAWN_POINTS_INITIAL;
    if (this.spawnCount <= 3) return Treasure.SPAWN_POINTS_RADIANT_EASY;
    if (this.spawnCount <= 6) return Treasure.SPAWN_POINTS_RADIANT_JUNGLE;
    return [...Treasure.SPAWN_POINTS_RADIANT_JUNGLE, ...Treasure.SPAWN_POINTS_RADIANT_HARD];
  }

  /** 反查点位属于哪个 tier，用于 GA 统计 */
  static getPointTier(point: Vector): TreasureTier {
    if (Treasure.SPAWN_POINTS_INITIAL.includes(point)) return TreasureTier.INITIAL;
    if (Treasure.SPAWN_POINTS_RADIANT_EASY.includes(point)) return TreasureTier.EASY;
    if (Treasure.SPAWN_POINTS_RADIANT_JUNGLE.includes(point)) return TreasureTier.JUNGLE;
    if (Treasure.SPAWN_POINTS_RADIANT_HARD.includes(point)) return TreasureTier.HARD;
    return TreasureTier.UNKNOWN;
  }

  getActiveChestCount(): number {
    return this.activeChests.size;
  }

  getSpawnCount(): number {
    return this.spawnCount;
  }
}
