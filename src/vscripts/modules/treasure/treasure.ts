import { modifier_hide_health_bar } from '../../modifiers/global/modifier_hide_health_bar';
import { reloadable } from '../../utils/tstl-utils';

@reloadable
export class Treasure {
  static readonly UNIT_NAME = 'npc_treasure_chest';
  static readonly RESPAWN_INTERVAL = 180;
  static readonly Z_SINK = 64;

  // 开局点位：仅天辉高地附近，开局走两步就能看到
  static readonly SPAWN_POINTS_INITIAL: Vector[] = [
    Vector(-5240, -6572, 256), // 天辉高地
  ];

  // 后续点位：天辉野区
  static readonly SPAWN_POINTS_RADIANT_JUNGLE: Vector[] = [
    Vector(-5800, 5400, 384), // 天辉左上野区
    Vector(-5400, -2000, 384), // 天辉远古野区
    Vector(-3000, 3500, 384), // 天辉上路野区
    Vector(-2400, -2400, 256), // 天辉肉山方向
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

    ListenToGameEvent('entity_killed', (keys) => this.onEntityKilled(keys), this);
  }

  spawnOne(): void {
    if (this.activeChests.size > 0) {
      return;
    }
    const point = this.getRandomSpawnPoint();
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
    chest.AddNewModifier(chest, undefined, modifier_hide_health_bar.name, {});
    // 绕过 CreateUnitByName 的地面 snap，让模型整体下降避免悬空
    const origin = chest.GetAbsOrigin();
    chest.SetAbsOrigin(Vector(origin.x, origin.y, origin.z - Treasure.Z_SINK));
    this.activeChests.add(chest.GetEntityIndex());
    this.spawnCount++;
    print(`[Treasure] #${this.spawnCount} spawned at (${point.x}, ${point.y}, ${point.z})`);
  }

  getRandomSpawnPoint(): Vector {
    const pool =
      this.spawnCount === 0 ? Treasure.SPAWN_POINTS_INITIAL : Treasure.SPAWN_POINTS_RADIANT_JUNGLE;
    const index = RandomInt(0, pool.length - 1);
    return pool[index];
  }

  private onEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    if (!keys.entindex_killed) return;
    const killed = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killed) return;
    if (killed.GetUnitName() !== Treasure.UNIT_NAME) return;
    const entIndex = killed.GetEntityIndex();
    if (!this.activeChests.has(entIndex)) return;
    this.activeChests.delete(entIndex);
  }

  getActiveChestCount(): number {
    return this.activeChests.size;
  }

  getSpawnCount(): number {
    return this.spawnCount;
  }
}
