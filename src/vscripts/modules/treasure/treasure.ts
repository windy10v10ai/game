import { modifier_treasure_chest } from '../../modifiers/global/modifier_treasure_chest';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class Treasure {
  static readonly UNIT_NAME = 'npc_treasure_chest';
  static readonly RESPAWN_INTERVAL = 180;
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

    // 天辉下路主野区

    // 天辉下路外野区
  ];

  // 中期点位：天辉野区
  // 这些点位都在树丛里，视觉上更隐蔽一些
  static readonly SPAWN_POINTS_RADIANT_JUNGLE: Vector[] = [
    // 天辉左侧外野区
    Vector(-8345, -2464, 256),
    Vector(-7424, -421, 256),
    Vector(-7157, 1058, 128),
    Vector(-6837, 2328, 128),
    Vector(-5400, -2000, 384), // 天辉远古野区
    Vector(-3000, 3500, 384), // 天辉上路野区
    Vector(-2400, -2400, 256), // 天辉肉山方向
  ];

  // 后期点位：天辉野区
  // 这些点位都在阴间位置，很难找到
  static readonly SPAWN_POINTS_RADIANT_HARD: Vector[] = [
    // 天辉左侧外野区
    Vector(-8672, -2592, 256),
    Vector(-8416, 96, 256),
  ];

  private activeChests: Set<EntityIndex> = new Set();
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
    if (this.activeChests.size > 0) {
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
    this.activeChests.add(chest.GetEntityIndex());
    this.spawnCount++;
    print(`[Treasure] #${this.spawnCount} spawned at (${point.x}, ${point.y}, ${point.z})`);
  }

  openChest(chest: CDOTA_BaseNPC, opener: CDOTA_BaseNPC): void {
    const entIndex = chest.GetEntityIndex();
    if (!this.activeChests.has(entIndex)) return;
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
    // TODO P2: GameRules.Lottery.openItemLottery(opener)
  }

  getRandomSpawnPoint(): Vector {
    const pool = this.pickPool();
    const index = RandomInt(0, pool.length - 1);
    return pool[index];
  }

  // spawnCount = 0 开局 → 1-3 EASY → 4-6 JUNGLE → 7+ JUNGLE+HARD 合并（HARD 主导，JUNGLE 兜底防重复）
  private pickPool(): Vector[] {
    if (this.spawnCount === 0) return Treasure.SPAWN_POINTS_INITIAL;
    if (this.spawnCount <= 3) return Treasure.SPAWN_POINTS_RADIANT_EASY;
    if (this.spawnCount <= 6) return Treasure.SPAWN_POINTS_RADIANT_JUNGLE;
    return [...Treasure.SPAWN_POINTS_RADIANT_JUNGLE, ...Treasure.SPAWN_POINTS_RADIANT_HARD];
  }

  getActiveChestCount(): number {
    return this.activeChests.size;
  }

  getSpawnCount(): number {
    return this.spawnCount;
  }
}
